import { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, IconButton, Avatar, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { crearChat, getMensajes } from '../services/api';

const WS_BASE = 'ws://localhost:8080/appchat/chat';

const STATUS_COLOR = {
    EN_LINEA: '#22C55E',
    OCUPADO: '#F59E0B',
    INVISIBLE: '#94A3B8',
    DESCONECTADO: '#94A3B8',
};

export default function Chat({ token, usuario, usuarioActual, comunidadId }) {
    const [mensaje, setMensaje] = useState('');
    const [mensajes, setMensajes] = useState([]);
    const [cargando, setCargando] = useState(false);
    const wsRef = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => {
    if (!usuario || !token || !comunidadId) return;
    let ws = null;
    setCargando(true);
    setMensajes([]);


    crearChat(usuario.id, comunidadId, token)
        //.then(chat => getMensajes(chat.id, token).then(h => ({ chatId: chat.id, historial: h })))
        .then(chat => {
    console.log('chat creado:', chat);
    return getMensajes(chat.id, token).then(h => ({ chatId: chat.id, historial: h }));
})
        .then(({ chatId, historial }) => {
            setMensajes(historial.mensajes || []);
            ws = new WebSocket(`ws://localhost:8080/appchat/chat?token=${token}`);
            ws.chatId = chatId;
            wsRef.current = ws;
            ws.onopen = () => console.log('WebSocket conectado');
            ws.onmessage = (e) => {
                try { 
                    const msg = JSON.parse(e.data);
                    if (msg.type !== 'ERROR') {
                        setMensajes(prev => [...prev, msg]);
                    }
                } catch { }
            };
            ws.onerror = () => console.warn('WebSocket error');
        })
        .catch(err => console.error('Error al abrir chat:', err))
        .finally(() => setCargando(false));

    return () => { if (ws) ws.close(); };
}, [usuario, token, comunidadId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    const enviar = () => {
    if (!mensaje.trim()) return;
    
    const chatIdActual = wsRef.current?.chatId;
    
    if (wsRef.current?.readyState === WebSocket.OPEN && chatIdActual) {
        wsRef.current.send(JSON.stringify({
            chatId: chatIdActual,
            contenido: mensaje
        }));
    }
    
    setMensajes(prev => [...prev, {
        id: Date.now(),
        contenido: mensaje,
        emisorId: usuarioActual?.id,
        fechaEnvio: new Date().toISOString(),
    }]);
    setMensaje('');
};

    const esPropio = (m) => m.emisorId === usuarioActual?.id;

    const formatHora = (f) =>
        f ? new Date(f).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    const dotColor = STATUS_COLOR[usuario?.estado] || '#94A3B8';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'white' }}>
            {/* Header */}
            <Box sx={{
                px: 3, py: 1.75,
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: 'white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
                <Box sx={{ position: 'relative' }}>
                    <Avatar sx={{ bgcolor: '#2563EB', fontWeight: 700, width: 38, height: 38 }}>
                        {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
                    </Avatar>
                    <Box sx={{
                        width: 11, height: 11,
                        bgcolor: dotColor,
                        border: '2px solid white',
                        borderRadius: '50%',
                        position: 'absolute',
                        bottom: 0, right: 0,
                    }} />
                </Box>
                <Box>
                    <Typography fontWeight={600} fontSize={15} color="#1E293B">
                        {usuario?.nombre} {usuario?.apellido}
                    </Typography>
                    <Typography variant="caption" color="#94A3B8">
                        {usuario?.estado?.replace(/_/g, ' ') || ''}
                    </Typography>
                </Box>
            </Box>

            {/* Mensajes */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 3, bgcolor: '#F8FAFC' }}>
                {cargando ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                        <CircularProgress size={28} sx={{ color: '#2563EB' }} />
                    </Box>
                ) : mensajes.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 10 }}>
                        <Typography variant="body2" color="#94A3B8">
                            Aún no hay mensajes. ¡Empezá la conversación!
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {mensajes.map((m, i) => {
                            const propio = esPropio(m);
                            return (
                                <Box key={m.id ?? i} sx={{
                                    display: 'flex',
                                    justifyContent: propio ? 'flex-end' : 'flex-start',
                                    alignItems: 'flex-end',
                                    gap: 1,
                                    mb: 1.5,
                                }}>
                                    {!propio && (
                                        <Avatar sx={{
                                            width: 26, height: 26, fontSize: 10,
                                            fontWeight: 700, bgcolor: '#334155', mb: 0.25,
                                        }}>
                                            {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
                                        </Avatar>
                                    )}
                                    <Box sx={{ maxWidth: '65%' }}>
                                        <Box sx={{
                                            px: 2, py: 1,
                                            bgcolor: propio ? '#2563EB' : 'white',
                                            color: propio ? 'white' : '#1E293B',
                                            borderRadius: propio ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                                        }}>
                                            <Typography variant="body2" sx={{ lineHeight: 1.55, fontSize: 14 }}>
                                                {m.contenido}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{
                                            display: 'block',
                                            color: '#94A3B8',
                                            fontSize: 11,
                                            mt: 0.4,
                                            textAlign: propio ? 'right' : 'left',
                                            px: 0.5,
                                        }}>
                                            {formatHora(m.fechaEnvio)}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                        <div ref={bottomRef} />
                    </>
                )}
            </Box>

            {/* Input */}
            <Box sx={{ px: 3, py: 2, bgcolor: 'white', borderTop: '1px solid #E2E8F0' }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: '#F1F5F9',
                    borderRadius: 3,
                    px: 2,
                    py: 0.5,
                    border: '1px solid #E2E8F0',
                }}>
                    <TextField
                        fullWidth
                        placeholder={`Mensaje a ${usuario?.nombre}...`}
                        value={mensaje}
                        onChange={e => setMensaje(e.target.value)}
                        onKeyPress={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{ '& input': { py: 1, fontSize: 14, color: '#1E293B' } }}
                    />
                    <IconButton
                        onClick={enviar}
                        disabled={!mensaje.trim()}
                        size="small"
                        sx={{
                            width: 34, height: 34,
                            bgcolor: mensaje.trim() ? '#2563EB' : 'transparent',
                            color: mensaje.trim() ? 'white' : '#CBD5E1',
                            '&:hover': { bgcolor: mensaje.trim() ? '#1D4ED8' : 'transparent' },
                            '&.Mui-disabled': { bgcolor: 'transparent', color: '#CBD5E1' },
                            transition: 'all 0.15s',
                            flexShrink: 0,
                        }}
                    >
                        <SendIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
}
