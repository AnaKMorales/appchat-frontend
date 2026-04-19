import { Box, AppBar, Toolbar, Typography, Avatar, Divider } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import Buscador from './Buscador';

export default function Layout({ onSeleccionarUsuario }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            
            {/* Barra */}
            <AppBar position="static" elevation={1}>
                <Toolbar>
                    <ChatIcon sx={{ mr: 1 }} />
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        AppChat Corporativa
                    </Typography>
                    <Avatar sx={{ bgcolor: 'secondary.main', cursor: 'pointer' }}>
                        A
                    </Avatar>
                </Toolbar>
            </AppBar>

            {/* Contenido */}
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                
                {/* Sidebar izquierdo */}
                <Box sx={{ 
                    width: 320, 
                    borderRight: '1px solid', 
                    borderColor: 'divider',
                    overflow: 'auto',
                    flexShrink: 0
                }}>
                    <Buscador onSeleccionarUsuario={onSeleccionarUsuario} />
                </Box>

                {/* chat */}
                <Box sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'grey.50'
                }}>
                    <Box textAlign="center">
                        <ChatIcon sx={{ fontSize: 80, color: 'grey.300' }} />
                        <Typography variant="h6" color="text.secondary" mt={2}>
                            Seleccioná un usuario para chatear
                        </Typography>
                    </Box>
                </Box>

            </Box>
        </Box>
    );
}