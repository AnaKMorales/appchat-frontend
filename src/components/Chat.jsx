import { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, TextField, IconButton,
    List, ListItem, Avatar, Paper, CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { crearChat, getMensajes } from '../services/api';

const WS_BASE = 'ws://localhost:8080/JAVAEE/ws/chat';

export default function Chat({ token, usuario, usuarioActual }) {
    const [mensaje, setMensaje] = useState('');
    const [mensajes, setMensajes] = useState([]);
    const [chatId, setChatId] = useState(null);
    const [cargando, setCargando] = useState(false);
    const wsRef = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!usuario || !token) return;

        let ws = null;
        setCargando(true);
        setMensajes([]);
        setChatId(null);

        crearChat(usuario.id, token)
            .then(chat => {
                setChatId(chat.id);
                return getMensajes(chat.id, token).then(historial => {
                    setMensajes(historial.mensajes || []);
                    return chat.id;
                });
            })
            .then(id => {
                ws = new WebSocket(`${WS_BASE}/${id}?token=${token}`);
                wsRef.current = ws;

                ws.onmessage = (event) => {
                    try {
                        const nuevoMensaje = JSON.parse(event.data);
                        setMensajes(prev => [...prev, nuevoMensaje]);
                    } catch {
                        // mensaje no es JSON válido
                    }
                };

                ws.onerror = () => console.warn('WebSocket error');
            })
            .catch(err => console.error('Error al abrir chat:', err))
            .finally(() => setCargando(false));

        return () => {
            if (ws) ws.close();
        };
    }, [usuario, token]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    const enviar = () => {
        if (!mensaje.trim()) return;

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(mensaje);
        }

        // optimistic update: mostrar el mensaje localmente mientras el WS no está implementado
        setMensajes(prev => [...prev, {
            id: Date.now(),
            contenido: mensaje,
            emisorId: usuarioActual?.id,
            fechaEnvio: new Date().toISOString()
        }]);
        setMensaje('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') enviar();
    };

    const esPropio = (m) => m.emisorId === usuarioActual?.id;

    const formatHora = (fechaStr) => {
        if (!fechaStr) return '';
        return new Date(fechaStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box sx={{
                p: 2, borderBottom: '1px solid',
                borderColor: 'divider', display: 'flex',
                alignItems: 'center', gap: 2,
                bgcolor: 'background.paper'
            }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
                </Avatar>
                <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                        {usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Usuario'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {usuario?.estado || ''}
                    </Typography>
                </Box>
            </Box>

            {/* Mensajes */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
                {cargando ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <List>
                        {mensajes.map((m, i) => (
                            <ListItem key={m.id ?? i} sx={{
                                justifyContent: esPropio(m) ? 'flex-end' : 'flex-start',
                                px: 0
                            }}>
                                <Paper sx={{
                                    px: 2, py: 1, maxWidth: '70%',
                                    bgcolor: esPropio(m) ? 'primary.main' : 'white',
                                    color: esPropio(m) ? 'white' : 'text.primary',
                                    borderRadius: esPropio(m)
                                        ? '18px 18px 4px 18px'
                                        : '18px 18px 18px 4px'
                                }}>
                                    <Typography variant="body2">{m.contenido}</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', textAlign: 'right' }}>
                                        {formatHora(m.fechaEnvio)}
                                    </Typography>
                                </Paper>
                            </ListItem>
                        ))}
                        <div ref={bottomRef} />
                    </List>
                )}
            </Box>

            {/* Input */}
            <Box sx={{
                p: 2, borderTop: '1px solid',
                borderColor: 'divider', bgcolor: 'background.paper',
                display: 'flex', gap: 1
            }}>
                <TextField
                    fullWidth
                    placeholder="Escribí un mensaje..."
                    value={mensaje}
                    onChange={e => setMensaje(e.target.value)}
                    onKeyPress={handleKeyPress}
                    size="small"
                    sx={{ bgcolor: 'grey.100', borderRadius: 3 }}
                />
                <IconButton color="primary" onClick={enviar} disabled={!mensaje.trim()}>
                    <SendIcon />
                </IconButton>
            </Box>
        </Box>
    );
}
