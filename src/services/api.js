import CONFIG from './config';
const BASE_URL = CONFIG.BASE_URL;

// Header requerido para saltear la pantalla de advertencia de ngrok en plan free
const NGROK_HEADER = { 'ngrok-skip-browser-warning': '1' };

// Wrapper de fetch que inyecta el header de ngrok en todas las requests
function apiFetch(url, options = {}) {
    const headers = { ...NGROK_HEADER, ...(options.headers || {}) };
    return fetch(url, { ...options, headers });
}

async function parseResponse(response) {
    const text = await response.text();

    if (!response.ok) {
        let mensaje = `HTTP ${response.status}`;
        if (text) {
            try {
                // Errores 
                const data = JSON.parse(text);
                mensaje = data.error || data.message || mensaje;
            } catch {
                // Respuesta 
                mensaje = /<html/i.test(text)
                    ? 'Datos invalidos. Revisa que todos los campos esten completos.'
                    : text;
            }
        }
        const err = new Error(mensaje);
        err.status = response.status;
        throw err;
    }

    return text ? JSON.parse(text) : null;
}

// Auth 
export const login = async (email, password) => {
    const response = await apiFetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) return null;
    return response.json();
};

// Usuarios 
export const getUsuarios = async (token) => {
    const response = await apiFetch(`${BASE_URL}/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return parseResponse(response);
};

export const guardarPublicKey = async (userId, publicKeyB64, token) => {
    const response = await apiFetch(`${BASE_URL}/usuarios/${userId}/publicKey`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain', 'Authorization': `Bearer ${token}` },
        body: publicKeyB64
    });
    return parseResponse(response);
};

export const getUsuario = async (id, token) => {
    const response = await apiFetch(`${BASE_URL}/usuarios/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return parseResponse(response);
};

export const editarUsuario = async (id, datos, token) => {
    const response = await apiFetch(`${BASE_URL}/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datos)
    });
    return parseResponse(response);
};

export const cambiarEstado = async (id, estado, token) => {
    const response = await apiFetch(`${BASE_URL}/usuarios/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ estado })
    });
    return parseResponse(response);
};

// Chats directos
export const getChats = async (comunidadId, token) => {
    const response = await apiFetch(`${BASE_URL}/chats/comunidad/${comunidadId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return parseResponse(response);
};

export const getMensajes = async (chatId, token, page = 0) => {
    const response = await apiFetch(`${BASE_URL}/chats/${chatId}/mensajes?page=${page}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return parseResponse(response);
};

export const subirAdjunto = async (chatId, file, token, parentId = null) => {
    const { uploadAdjunto } = await import('./storage.js');
    const fileUrl = await uploadAdjunto(file);

    const response = await apiFetch(`${BASE_URL}/chats/${chatId}/adjuntos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            nombre: file.name,
            mimeType: file.type || 'application/octet-stream',
            fileUrl,
            size: file.size,
            parentId,
        })
    });
    return parseResponse(response);
};

export const crearChat = async (usuarioDestinoId, comunidadId, token) => {
    const response = await apiFetch(`${BASE_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ usuarioDestinoId, comunidadId })
    });
    return parseResponse(response);
};

// Chats grupales 
export const crearChatGrupo = async (nombre, descripcion, comunidadId, usuarioIds, token) => {
    const response = await apiFetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre, descripcion, comunidadId, usuarioIds })
    });
    return parseResponse(response);
};

export const agregarMiembrosGrupo = async (chatId, usuarioIds, token) => {
    const response = await apiFetch(`${BASE_URL}/chat/${chatId}/miembros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ usuarioIds })
    });
    return parseResponse(response);
};

export const editarGrupo = async (chatId, datos, token) => {
    const response = await apiFetch(`${BASE_URL}/chat/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datos)
    });
    return parseResponse(response);
};

export const eliminarGrupo = async (chatId, token) => {
    const response = await apiFetch(`${BASE_URL}/chat/${chatId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const eliminarMiembroGrupo = async (chatId, userId, token) => {
    const response = await apiFetch(`${BASE_URL}/chat/${chatId}/miembros/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const fijarMensaje = async (chatId, mensajeId, token) => {
    const response = await apiFetch(`${BASE_URL}/chat/${chatId}/mensajes/${mensajeId}/pin`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const desfijarMensaje = async (chatId, mensajeId, token) => {
    const response = await apiFetch(`${BASE_URL}/chat/${chatId}/mensajes/${mensajeId}/pin`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const getMensajesFijados = async (chatId, token) => {
    const response = await apiFetch(`${BASE_URL}/chat/${chatId}/mensajes/pin`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    return parseResponse(response);
};

// Comunidades
export const getComunidades = async (token) => {
    const response = await apiFetch(`${BASE_URL}/comunidades`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return parseResponse(response);
};

export const getComunidadDetalle = async (id, token) => {
    const response = await apiFetch(`${BASE_URL}/comunidades/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return parseResponse(response);
};

export const crearComunidad = async (datos, token) => {
    const response = await apiFetch(`${BASE_URL}/comunidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datos)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const editarComunidad = async (id, datos, token) => {
    const response = await apiFetch(`${BASE_URL}/comunidades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datos)
    });
    return parseResponse(response);
};

export const eliminarComunidad = async (id, token) => {
    const response = await apiFetch(`${BASE_URL}/comunidades/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const invitarUsuario = async (comunidadId, username, token) => {
    const response = await apiFetch(`${BASE_URL}/comunidades/${comunidadId}/invitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ username })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const salirComunidad = async (comunidadId, token) => {
    const response = await apiFetch(`${BASE_URL}/comunidades/${comunidadId}/salir`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const eliminarMiembroComunidad = async (comunidadId, userId, token) => {
    const response = await apiFetch(`${BASE_URL}/comunidades/${comunidadId}/mimebros/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const aceptarInvitacion = async (invitacionId, token) => {
    const response = await apiFetch(`${BASE_URL}/comunidades/invitaciones/${invitacionId}/aceptar`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const rechazarInvitacion = async (invitacionId, token) => {
    const response = await apiFetch(`${BASE_URL}/comunidades/invitaciones/${invitacionId}/rechazar`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};
export const register = async (datos) => {
    const response = await apiFetch(`${BASE_URL}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    return parseResponse(response);
};
