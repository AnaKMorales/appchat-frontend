import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Badge, IconButton, Tooltip, Popover, Box, Typography,
    Button, Divider, CircularProgress, Snackbar, Alert
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import GroupsIcon from '@mui/icons-material/Groups';
import MessageIcon from '@mui/icons-material/Message';
import { aceptarInvitacion, rechazarInvitacion } from '../services/api';

import CONFIG from '../services/config';
const WS_URL = CONFIG.WS_URL;

const getInvitaciones = async (token) => {
    const r = await fetch('http://localhost:8080/appchat/api/comunidades/invitaciones/pendientes', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!r.ok) return [];
    return r.json();
};

export default function Notificaciones({ token, onInvitacionAceptada, chatActivoId }) {
    const [anchor, setAnchor] = useState(null);
    const [invitaciones, setInvitaciones] = useState([]);
    const [procesando, setProcesando] = useState(null);
    const [msgNuevos, setMsgNuevos] = useState([]); // { chatId, nombre, contenido }
    const [snack, setSnack] = useState(null);
    const wsRef = useRef(null);

    const cargarInvitaciones = useCallback(() => {
        if (!token) return;
        getInvitaciones(token).then(setInvitaciones).catch(() => {});
    }, [token]);

    // Polling invitaciones cada 15s
    useEffect(() => {
        cargarInvitaciones();
        const interval = setInterval(cargarInvitaciones, 15000);
        return () => clearInterval(interval);
    }, [cargarInvitaciones]);

    // WebSocket global para notificaciones de mensajes
    useEffect(() => {
        if (!token) return;
        const ws = new WebSocket(`${WS_URL}?token=${token}`);
        wsRef.current = ws;

        ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                if (msg.type === 'ERROR' || !msg.contenido) return;
                // el servidor no incluye chatId — solo notificamos si el emisor no soy yo
                // y no hay un chat activo (o sea está navegando fuera)
                if (chatActivoId) return; // si hay chat abierto, Chat.jsx lo maneja
                const notif = {
                    id: Date.now(),
                    emisor: msg.emisorNombre ? `${msg.emisorNombre} ${msg.emisorApellido || ''}`.trim() : 'Alguien',
                    contenido: msg.contenido.length > 50 ? msg.contenido.substring(0, 50) + '...' : msg.contenido,
                };
                setMsgNuevos(prev => [...prev.slice(-4), notif]);
                setSnack(notif);
            } catch {}
        };

        ws.onerror = () => {};
        return () => { ws.close(); };
    }, [token, chatActivoId]);

    const handleAceptar = async (inv) => {
        setProcesando(inv.id);
        try {
            await aceptarInvitacion(inv.id, token);
        } catch {
            // el backend puede tirar 500 si ya es miembro, pero igual procedemos
        } finally {
            // en cualquier caso quitamos la invitación y refrescamos
            setInvitaciones(prev => prev.filter(i => i.id !== inv.id));
            if (onInvitacionAceptada) onInvitacionAceptada();
            setProcesando(null);
        }
    };

    const handleRechazar = async (inv) => {
        setProcesando(inv.id);
        try {
            await rechazarInvitacion(inv.id, token);
            setInvitaciones(prev => prev.filter(i => i.id !== inv.id));
        } catch {}
        finally { setProcesando(null); }
    };

    const totalBadge = invitaciones.length + msgNuevos.length;

    return (
        <>
            <Tooltip title="Notificaciones">
                <IconButton size="small" onClick={e => { setAnchor(e.currentTarget); setMsgNuevos([]); }}
                    sx={{ color: 'rgba(255,255,255,0.35)', '&:hover': { color: 'white' }, p: 0.3 }}>
                    <Badge badgeContent={totalBadge || null} color="error"
                        sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 14, height: 14 } }}>
                        <NotificationsIcon sx={{ fontSize: 15 }} />
                    </Badge>
                </IconButton>
            </Tooltip>

            {/* Snackbar para mensajes nuevos */}
            <Snackbar
                open={!!snack}
                autoHideDuration={4000}
                onClose={() => setSnack(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="info" icon={<MessageIcon />} onClose={() => setSnack(null)}
                    sx={{ bgcolor: '#1E293B', color: 'white', '& .MuiAlert-icon': { color: '#60A5FA' }, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography fontSize={12} fontWeight={600}>{snack?.emisor}</Typography>
                    <Typography fontSize={11} sx={{ color: 'rgba(255,255,255,0.7)' }}>{snack?.contenido}</Typography>
                </Alert>
            </Snackbar>

            <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                PaperProps={{ sx: { bgcolor: '#1E293B', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, width: 300, overflow: 'hidden' } }}>

                <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <Typography fontWeight={700} fontSize={13}>Notificaciones</Typography>
                </Box>

                {invitaciones.length === 0 && msgNuevos.length === 0 ? (
                    <Box sx={{ px: 2.5, py: 3, textAlign: 'center' }}>
                        <Typography fontSize={13} sx={{ color: 'rgba(255,255,255,0.35)' }}>Sin notificaciones</Typography>
                    </Box>
                ) : (
                    <>
                        {invitaciones.map((inv, i) => (
                            <Box key={inv.id}>
                                <Box sx={{ px: 2.5, py: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                                        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <GroupsIcon sx={{ fontSize: 16, color: 'white' }} />
                                        </Box>
                                        <Box>
                                            <Typography fontSize={13} fontWeight={600} color="white">Invitación a comunidad</Typography>
                                            <Typography fontSize={12} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{inv.invitadoPor}</strong> te invitó a <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{inv.comunidadNombre}</strong>
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button size="small" variant="contained" disabled={procesando === inv.id}
                                            onClick={() => handleAceptar(inv)}
                                            sx={{ flex: 1, bgcolor: '#2563EB', fontSize: 12, '&:hover': { bgcolor: '#1D4ED8' } }}>
                                            {procesando === inv.id ? <CircularProgress size={14} color="inherit" /> : 'Aceptar'}
                                        </Button>
                                        <Button size="small" variant="outlined" disabled={procesando === inv.id}
                                            onClick={() => handleRechazar(inv)}
                                            sx={{ flex: 1, fontSize: 12, borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}>
                                            Rechazar
                                        </Button>
                                    </Box>
                                </Box>
                                {i < invitaciones.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />}
                            </Box>
                        ))}
                    </>
                )}
            </Popover>
        </>
    );
}