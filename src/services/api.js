const BASE_URL = '/appchat/api';

async function parseResponse(response) {
    if (!response.ok) {
        const err = new Error(`HTTP ${response.status}`);
        err.status = response.status;
        throw err;
    }
    return response.json();
}

export const login = async (email, password) => {
    const response = await fetch('/appchat/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (response.ok) {
        const token = await response.text();
        return { token };
    }
    return null;
};

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
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datos)
    });
    return parseResponse(response);
};

export const cambiarEstado = async (id, estado, token) => {
    const response = await fetch(`${BASE_URL}/usuarios/${id}/estado`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado })
    });
    return parseResponse(response);
};

export const buscarUsuarios = async (q, token) => {
    const response = await fetch(`${BASE_URL}/usuarios/buscar?q=${q}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return parseResponse(response);
};

export const getChats = async (token) => {
    const response = await fetch(`${BASE_URL}/chats`, {
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

export const crearChat = async (usuarioDestinoId, comunidadId, token) => {
    const response = await fetch(`/appchat/api/chats`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ usuarioDestinoId, comunidadId })
    });
    return response.json();
};
