import CONFIG from './config';
const BASE_URL = CONFIG.BASE_URL;

async function parseResponse(response) {
    if (!response.ok) {
        const err = new Error(`HTTP ${response.status}`);
        err.status = response.status;
        throw err;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

// Auth 
export const login = async (email, password) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) return null;
    return response.json();
};

// Usuarios 
export const getUsuarios = async (token) => {
    const response = await fetch(`${BASE_URL}/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return parseResponse(response);
};

export const getUsuario = async (id, token) => {
    const response = await fetch(`${BASE_URL}/usuarios/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return parseResponse(response);
};

export const editarUsuario = async (id, datos, token) => {
    const response = await fetch(`${BASE_URL}/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datos)
    });
    return parseResponse(response);
};

export const cambiarEstado = async (id, estado, token) => {
    const response = await fetch(`${BASE_URL}/usuarios/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ estado })
    });
    return parseResponse(response);
};

// Chats directos
export const getChats = async (comunidadId, token) => {
    const response = await fetch(`${BASE_URL}/chats/comunidad/${comunidadId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return parseResponse(response);
};

export const getMensajes = async (chatId, token, page = 0) => {
    const response = await fetch(`${BASE_URL}/chats/${chatId}/mensajes?page=${page}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return parseResponse(response);
};

export const subirAdjunto = async (chatId, file, token, parentId = null) => {
    const contenidoBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const value = String(reader.result || '');
            const comma = value.indexOf(',');
            resolve(comma >= 0 ? value.slice(comma + 1) : value);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const response = await fetch(`${BASE_URL}/chats/${chatId}/adjuntos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            nombre: file.name,
            mimeType: file.type || 'application/octet-stream',
            contenidoBase64,
            parentId,
        })
    });
    return parseResponse(response);
};

export const crearChat = async (usuarioDestinoId, comunidadId, token) => {
    const response = await fetch(`${BASE_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ usuarioDestinoId, comunidadId })
    });
    return parseResponse(response);
};

// Chats grupales 
export const crearChatGrupo = async (nombre, descripcion, comunidadId, usuarioIds, token) => {
    const response = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre, descripcion, comunidadId, usuarioIds })
    });
    return parseResponse(response);
};

export const agregarMiembrosGrupo = async (chatId, usuarioIds, token) => {
    const response = await fetch(`${BASE_URL}/chat/${chatId}/miembros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ usuarioIds })
    });
    return parseResponse(response);
};

export const editarGrupo = async (chatId, datos, token) => {
    const response = await fetch(`${BASE_URL}/chat/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datos)
    });
    return parseResponse(response);
};

export const eliminarGrupo = async (chatId, token) => {
    const response = await fetch(`${BASE_URL}/chat/${chatId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const eliminarMiembroGrupo = async (chatId, userId, token) => {
    const response = await fetch(`${BASE_URL}/chat/${chatId}/miembros/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const fijarMensaje = async (chatId, mensajeId, token) => {
    const response = await fetch(`${BASE_URL}/chat/${chatId}/mensajes/${mensajeId}/pin`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const desfijarMensaje = async (chatId, mensajeId, token) => {
    const response = await fetch(`${BASE_URL}/chat/${chatId}/mensajes/${mensajeId}/pin`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const getMensajesFijados = async (chatId, token) => {
    const response = await fetch(`${BASE_URL}/chat/${chatId}/mensajes/pin`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    return parseResponse(response);
};

// Comunidades
export const getComunidades = async (token) => {
    const response = await fetch(`${BASE_URL}/comunidades`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return parseResponse(response);
};

export const getComunidadDetalle = async (id, token) => {
    const response = await fetch(`${BASE_URL}/comunidades/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return parseResponse(response);
};

export const crearComunidad = async (datos, token) => {
    const response = await fetch(`${BASE_URL}/comunidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datos)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const editarComunidad = async (id, datos, token) => {
    const response = await fetch(`${BASE_URL}/comunidades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datos)
    });
    return parseResponse(response);
};

export const eliminarComunidad = async (id, token) => {
    const response = await fetch(`${BASE_URL}/comunidades/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const invitarUsuario = async (comunidadId, username, token) => {
    const response = await fetch(`${BASE_URL}/comunidades/${comunidadId}/invitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ username })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const salirComunidad = async (comunidadId, token) => {
    const response = await fetch(`${BASE_URL}/comunidades/${comunidadId}/salir`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const eliminarMiembroComunidad = async (comunidadId, userId, token) => {
    const response = await fetch(`${BASE_URL}/comunidades/${comunidadId}/mimebros/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const aceptarInvitacion = async (invitacionId, token) => {
    const response = await fetch(`${BASE_URL}/comunidades/invitaciones/${invitacionId}/aceptar`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};

export const rechazarInvitacion = async (invitacionId, token) => {
    const response = await fetch(`${BASE_URL}/comunidades/invitaciones/${invitacionId}/rechazar`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
};
export const register = async (datos) => {
    const response = await fetch(`${BASE_URL}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    return parseResponse(response);
};
