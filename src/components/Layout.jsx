import { useState, useEffect } from 'react';
import { getComunidades } from '../services/api';
import { Box, Typography, Avatar, IconButton, Tooltip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import Buscador from './Buscador';
import Chat from './Chat';
import Perfil from './Perfil';
import Comunidades from './Comunidades';
import GroupsIcon from '@mui/icons-material/Groups';

export default function Layout({ token, usuarioActual, onLogout }) {
    const [vista, setVista] = useState('chats'); // 'chats' o 'comunidades'
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [verPerfil, setVerPerfil] = useState(false);
    const [comunidadId, setComunidadId] = useState(null);

useEffect(() => {
    if (!token) return;
    getComunidades(token)
        .then(comunidades => {
            if (comunidades.length > 0) setComunidadId(comunidades[0].id);
        })
        .catch(() => {});
}, [token]);

    const statusColor = {
        EN_LINEA: '#22C55E',
        OCUPADO: '#F59E0B',
        INVISIBLE: '#94A3B8',
        DESCONECTADO: '#94A3B8',
    }[usuarioActual?.estado] || '#94A3B8';

    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Sidebar */}
            <Box sx={{
                width: 260,
                flexShrink: 0,
                bgcolor: '#1E2A38',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Cabecera */}
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 1 }}>
                    <Tooltip title="Chats">
                        <IconButton onClick={() => setVista('chats')} sx={{ color: vista === 'chats' ? 'white' : 'rgba(255,255,255,0.4)', bgcolor: vista === 'chats' ? 'rgba(37,99,235,0.4)' : 'transparent', borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                            <ChatBubbleIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Comunidades">
                        <IconButton onClick={() => setVista('comunidades')} sx={{ color: vista === 'comunidades' ? 'white' : 'rgba(255,255,255,0.4)', bgcolor: vista === 'comunidades' ? 'rgba(37,99,235,0.4)' : 'transparent', borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                            <GroupsIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Lista de usuarios */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {vista === 'chats' ? (
                        <Buscador
                            token={token}
                            onSeleccionarUsuario={(u) => { setUsuarioSeleccionado(u); setVerPerfil(false); }}
                            usuarioSeleccionado={usuarioSeleccionado}
                            onUnauthorized={onLogout}
                        />
                    ) : null}
                </Box>

                {/* Barra inferior - usuario actual */}
                <Box sx={{
                    px: 2,
                    py: 1.5,
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                }}>
                    <Box sx={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar
                            sx={{ width: 34, height: 34, bgcolor: '#2563EB', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                            onClick={() => setVerPerfil(true)}
                        >
                            {usuarioActual?.nombre?.[0]}{usuarioActual?.apellido?.[0]}
                        </Avatar>
                        <Box sx={{
                            width: 10, height: 10,
                            bgcolor: statusColor,
                            border: '2px solid #1E2A38',
                            borderRadius: '50%',
                            position: 'absolute',
                            bottom: 0, right: 0,
                        }} />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontSize={13} fontWeight={600} color="white" noWrap>
                            {usuarioActual ? `${usuarioActual.nombre} ${usuarioActual.apellido}` : '...'}
                        </Typography>
                        <Typography fontSize={11} sx={{ color: 'rgba(255,255,255,0.45)' }} noWrap>
                            {usuarioActual?.estado?.replace('_', ' ') || ''}
                        </Typography>
                    </Box>

                    <Tooltip title="Mi perfil">
                        <IconButton
                            size="small"
                            onClick={() => setVerPerfil(true)}
                            sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'white' }, p: 0.5 }}
                        >
                            <AccountCircleIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Cerrar sesión">
                        <IconButton
                            size="small"
                            onClick={onLogout}
                            sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#F87171' }, p: 0.5 }}
                        >
                            <LogoutIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Área principal */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {vista === 'comunidades' ? (
                    <Comunidades token={token} usuarioActual={usuarioActual} />
                ) : verPerfil ? (
                    <Perfil token={token} usuarioActual={usuarioActual} onVolver={() => setVerPerfil(false)} />
                ) : usuarioSeleccionado ? (
                    <Chat token={token} usuario={usuarioSeleccionado} usuarioActual={usuarioActual} comunidadId={comunidadId} />
                ) : (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC', gap: 2 }}>
                        <Box sx={{ width: 80, height: 80, borderRadius: 4, bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChatBubbleIcon sx={{ fontSize: 40, color: '#BFDBFE' }} />
                        </Box>
                        <Typography variant="h6" fontWeight={600} color="#1E293B">
                            {usuarioActual ? `Hola, ${usuarioActual.nombre} 👋` : 'Bienvenido'}
                        </Typography>
                        <Typography variant="body2" color="#94A3B8">
                            Seleccioná un usuario para comenzar a chatear
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}