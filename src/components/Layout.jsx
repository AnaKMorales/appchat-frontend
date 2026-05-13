import { useState } from 'react';
import { Box, Typography, Avatar, IconButton, Tooltip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Chat from './Chat';
import Perfil from './Perfil';
import Comunidades from './Comunidades';
import PantallaComunidades from './PantallaComunidades';

export default function Layout({ token, usuarioActual, onLogout }) {
    const [comunidadSeleccionada, setComunidadSeleccionada] = useState(null);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [verPerfil, setVerPerfil] = useState(false);

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
                <Box sx={{ flex: 1 }} />

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
                {verPerfil ? (
                    <Perfil token={token} usuarioActual={usuarioActual} onVolver={() => setVerPerfil(false)} />
                ) : comunidadSeleccionada && usuarioSeleccionado ? (
                    <Chat
                        token={token}
                        usuario={usuarioSeleccionado}
                        usuarioActual={usuarioActual}
                        comunidadId={comunidadSeleccionada.id}
                        onVolver={() => setUsuarioSeleccionado(null)}
                    />
                ) : (
                    <PantallaComunidades
                        token={token}
                        usuarioActual={usuarioActual}
                        onEntrarComunidad={(c) => setComunidadSeleccionada(c)}
/>
                )}
            </Box>
        </Box>
    );
}