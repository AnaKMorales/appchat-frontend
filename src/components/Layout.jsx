import { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, Avatar, IconButton, Tooltip } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import Buscador from './Buscador';
import Chat from './Chat';
import Perfil from './Perfil';

export default function Layout({ token, usuarioActual, onLogout }) {
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [verPerfil, setVerPerfil] = useState(false);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Barra superior */}
            <AppBar position="static" elevation={1}>
                <Toolbar>
                    <ChatIcon sx={{ mr: 1 }} />
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        AppChat Corporativa
                    </Typography>
                    <Tooltip title="Mi perfil">
                        <IconButton color="inherit" onClick={() => setVerPerfil(true)}>
                            <AccountCircleIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Cerrar sesión">
                        <IconButton color="inherit" onClick={onLogout}>
                            <LogoutIcon />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            {/* Contenido principal */}
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                {/* Sidebar izquierdo */}
                <Box sx={{
                    width: 320,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    overflow: 'auto',
                    flexShrink: 0
                }}>
                    <Buscador token={token} onSeleccionarUsuario={(u) => {
                        setUsuarioSeleccionado(u);
                        setVerPerfil(false);
                    }} />
                </Box>

                {/* Área derecha */}
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    {verPerfil ? (
                        <Perfil
                            token={token}
                            usuarioActual={usuarioActual}
                            onVolver={() => setVerPerfil(false)}
                        />
                    ) : usuarioSeleccionado ? (
                        <Chat
                            token={token}
                            usuario={usuarioSeleccionado}
                            usuarioActual={usuarioActual}
                        />
                    ) : (
                        <Box sx={{
                            height: '100%', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'grey.50'
                        }}>
                            <Box textAlign="center">
                                <ChatIcon sx={{ fontSize: 80, color: 'grey.300' }} />
                                <Typography variant="h6" color="text.secondary" mt={2}>
                                    Seleccioná un usuario para chatear
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
