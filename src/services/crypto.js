/**
 * Cifrado extremo a extremo (E2E) para AppChat
 *
 * Esquema:
 *   - Par de claves ECDH P-256 por usuario (generado en el navegador)
 *   - Clave privada almacenada en IndexedDB (nunca sale del dispositivo)
 *   - Clave pública almacenada en el servidor
 *   - Cada mensaje usa una clave AES-256-GCM aleatoria
 *   - La clave AES se envuelve (wrap) para cada participante usando el
 *     secreto compartido ECDH → clave de envoltura AES-GCM
 *
 * Formato del contenido cifrado (JSON):
 *   { e2e: true, iv: "<b64>", ct: "<b64>", keys: { "<userId>": "<wrapIv>.<wrappedKey>" } }
 */

const DB_NAME = 'appchat-e2e';
const DB_VER  = 1;
const STORE   = 'keys';

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

function openDB() {
    return new Promise((res, rej) => {
        const r = indexedDB.open(DB_NAME, DB_VER);
        r.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
        r.onsuccess  = e => res(e.target.result);
        r.onerror    = e => rej(e.target.error);
    });
}

async function dbPut(key, val) {
    const db = await openDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(val, key);
        tx.oncomplete = res;
        tx.onerror    = e => rej(e.target.error);
    });
}

async function dbGet(key) {
    const db = await openDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(STORE, 'readonly');
        const r  = tx.objectStore(STORE).get(key);
        r.onsuccess = e => res(e.target.result ?? null);
        r.onerror   = e => rej(e.target.error);
    });
}

// ─── Base64 helpers ───────────────────────────────────────────────────────────

function toB64(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromB64(s) {
    return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

// ─── Gestión de claves ────────────────────────────────────────────────────────

/**
 * Inicializa (o recupera) el par de claves ECDH del usuario.
 * Devuelve { privateKey, publicKey, publicKeyB64 }
 */
export async function initKeys(userId) {
    const privKey = await dbGet(`priv-${userId}`);
    const pubKey  = await dbGet(`pub-${userId}`);

    if (privKey && pubKey) {
        const spki = await crypto.subtle.exportKey('spki', pubKey);
        return { privateKey: privKey, publicKey: pubKey, publicKeyB64: toB64(spki) };
    }

    // Generar nuevo par
    const kp = await crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        false,                         // clave privada no exportable
        ['deriveKey', 'deriveBits']
    );

    const spki = await crypto.subtle.exportKey('spki', kp.publicKey);

    await dbPut(`priv-${userId}`, kp.privateKey);
    await dbPut(`pub-${userId}`,  kp.publicKey);

    return { privateKey: kp.privateKey, publicKey: kp.publicKey, publicKeyB64: toB64(spki) };
}

/**
 * Importa una clave pública ECDH desde Base64 SPKI.
 */
export function importPubKey(b64Str) {
    return crypto.subtle.importKey(
        'spki',
        fromB64(b64Str),
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
    );
}

/**
 * Deriva una clave AES-GCM de 256 bits a partir del secreto compartido ECDH.
 */
async function deriveWrapKey(myPriv, theirPub) {
    return crypto.subtle.deriveKey(
        { name: 'ECDH', public: theirPub },
        myPriv,
        { name: 'AES-GCM', length: 256 },
        false,
        ['wrapKey', 'unwrapKey']
    );
}

// ─── Cifrado / descifrado ─────────────────────────────────────────────────────

/**
 * Cifra `plaintext` para todos los participantes con clave pública conocida.
 *
 * @param {string} plaintext
 * @param {CryptoKey} myPrivateKey      - clave privada ECDH del remitente
 * @param {Object}  participantPublicKeysB64  - { userId: publicKeyB64, ... }
 * @param {string}  [myPublicKeyB64]    - clave pública del remitente (SPKI Base64)
 *                                        se embebe en el payload para que el receptor
 *                                        pueda descifrar aunque la DB cambie.
 * @returns {string} JSON cifrado, o el texto plano si no hay participantes con clave
 */
export async function encryptMsg(plaintext, myPrivateKey, participantPublicKeysB64, myPublicKeyB64) {
    const entries = Object.entries(participantPublicKeysB64).filter(([, v]) => !!v);
    if (entries.length === 0) return plaintext;

    // Clave AES aleatoria por mensaje
    const msgKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    // Cifrar contenido
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        msgKey,
        new TextEncoder().encode(plaintext)
    );

    // Envolver (wrap) la clave de mensaje para cada participante
    const keys = {};
    for (const [uid, pubKeyB64] of entries) {
        try {
            const pubKey  = await importPubKey(pubKeyB64);
            const wrapKey = await deriveWrapKey(myPrivateKey, pubKey);
            const wiv     = crypto.getRandomValues(new Uint8Array(12));
            const wk      = await crypto.subtle.wrapKey(
                'raw', msgKey, wrapKey, { name: 'AES-GCM', iv: wiv }
            );
            keys[String(uid)] = `${toB64(wiv)}.${toB64(new Uint8Array(wk))}`;
        } catch {
            // Si falla un participante, se omite (no podrá descifrar)
        }
    }

    if (Object.keys(keys).length === 0) return plaintext;

    const payload = { e2e: true, iv: toB64(iv), ct: toB64(new Uint8Array(ct)), keys };
    // Embeber la clave pública del emisor en el mensaje para descifrado estable
    if (myPublicKeyB64) payload.spk = myPublicKeyB64;
    return JSON.stringify(payload);
}

/**
 * Descifra un mensaje E2E.
 *
 * @param {string}    content              - contenido cifrado (JSON)
 * @param {number|string} myUserId
 * @param {CryptoKey} myPrivateKey
 * @param {string}    senderPublicKeyB64   - clave pública del emisor (Base64 SPKI)
 * @returns {Promise<string|null>}  texto descifrado, o null si falla
 */
export async function decryptMsg(content, myUserId, myPrivateKey, senderPublicKeyB64) {
    let parsed;
    try { parsed = JSON.parse(content); } catch { return null; }
    if (!parsed?.e2e) return null;

    const wrapped = parsed.keys?.[String(myUserId)];
    if (!wrapped) return null;

    const dotIdx = wrapped.indexOf('.');
    if (dotIdx < 0) return null;

    const wiv = fromB64(wrapped.slice(0, dotIdx));
    const wk  = fromB64(wrapped.slice(dotIdx + 1));

    // Preferir la clave pública embebida en el mensaje (stable al momento de cifrar)
    // sobre la clave actual de la DB (que puede haber rotado)
    const effectiveSenderKey = parsed.spk || senderPublicKeyB64;
    if (!effectiveSenderKey) return null;

    try {
        const senderPub = await importPubKey(effectiveSenderKey);
        const wrapKey   = await deriveWrapKey(myPrivateKey, senderPub);

        const msgKey = await crypto.subtle.unwrapKey(
            'raw', wk, wrapKey,
            { name: 'AES-GCM', iv: wiv },
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        const iv    = fromB64(parsed.iv);
        const ctBuf = fromB64(parsed.ct);
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, msgKey, ctBuf);
        return new TextDecoder().decode(plain);
    } catch {
        return null;
    }
}

/**
 * Devuelve true si el contenido es un mensaje E2E cifrado.
 */
export function isE2E(content) {
    if (typeof content !== 'string' || !content.startsWith('{')) return false;
    try { return JSON.parse(content)?.e2e === true; } catch { return false; }
}
