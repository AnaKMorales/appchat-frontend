const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

/**
 * Sube un File al bucket de Supabase Storage indicado.
 * @param {string} bucket - nombre del bucket ('avatars' | 'adjuntos')
 * @param {string} path   - ruta dentro del bucket, ej: 'user-3-1234.jpg'
 * @param {File}   file   - objeto File del navegador
 * @returns {string} URL pública del objeto
 */
export async function uploadFile(bucket, path, file) {
    const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            apikey: SUPABASE_ANON_KEY,
            'Content-Type': file.type || 'application/octet-stream',
            'x-upsert': 'true',
        },
        body: file,
    });
    if (!res.ok) {
        const msg = await res.text().catch(() => res.status);
        throw new Error(`Supabase Storage error: ${msg}`);
    }
    return getPublicUrl(bucket, path);
}

/**
 * Devuelve la URL pública de un objeto en Supabase Storage.
 */
export function getPublicUrl(bucket, path) {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/** Sube foto de perfil/grupo al bucket 'avatars'. */
export async function uploadAvatar(userId, file) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `avatar-${userId}-${Date.now()}.${ext}`;
    return uploadFile('avatars', path, file);
}

/** Sube foto de comunidad al bucket 'avatars'. */
export async function uploadCommunityPhoto(comunidadId, file) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `community-${comunidadId}-${Date.now()}.${ext}`;
    return uploadFile('avatars', path, file);
}

/** Sube foto de grupo al bucket 'avatars'. */
export async function uploadGroupPhoto(groupId, file) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `group-${groupId}-${Date.now()}.${ext}`;
    return uploadFile('avatars', path, file);
}

/** Sube un adjunto de chat al bucket 'adjuntos'. */
export async function uploadAdjunto(file) {
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    return uploadFile('adjuntos', path, file);
}
