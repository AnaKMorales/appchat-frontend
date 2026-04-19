const BASE_URL = '/JAVAEE/api';

export const login = async (email, password) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return response.json();
};

export const getUsuarios = async (token) => {
    const response = await fetch(`${BASE_URL}/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
};

export const getUsuario = async (id, token) => {
    const response = await fetch(`${BASE_URL}/usuarios/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
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
    return response.json();
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
    return response.json();
};

export const buscarUsuarios = async (q, token) => {
    const response = await fetch(`${BASE_URL}/usuarios/buscar?q=${q}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
};

export const getChats = async (token) => {
    const response = await fetch(`${BASE_URL}/chats`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
};

export const getMensajes = async (chatId, token, page = 0) => {
    const response = await fetch(`${BASE_URL}/chats/${chatId}/mensajes?page=${page}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
};

export const crearChat = async (usuarioId, token) => {
    const response = await fetch(`${BASE_URL}/chats`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ usuarioId })
    });
    return response.json();
};