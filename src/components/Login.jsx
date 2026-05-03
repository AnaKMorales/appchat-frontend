import { useState } from 'react';
import {
    Box, TextField, Button, Typography, Alert,
    CircularProgress, InputAdornment, IconButton
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);
        setError('');
        try {
            const response = await fetch('http://localhost:8080/appchat/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (response.ok) {
                const data = await response.json();
                onLogin(data.token);
            } else {
                setError('Email o contraseña incorrectos');
            }
        } catch {
            setError('No se pudo conectar al servidor');
        } finally {
            setCargando(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            {/* Panel izquierdo - branding */}
            <Box sx={{
                width: { xs: 0, md: '45%' },
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#1E2A38',
                p: 6,
                gap: 3,
            }}>
                <Box sx={{
                    width: 72, height: 72, borderRadius: 3,
                    bgcolor: '#2563EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <ChatBubbleIcon sx={{ color: 'white', fontSize: 36 }} />
                </Box>
                <Typography variant="h4" fontWeight={700} color="white" textAlign="center">
                    Chat Empresarial
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.55)', textAlign: 'center', maxWidth: 300, lineHeight: 1.7 }}>
                    Comunicación simple y efectiva para tu equipo
                </Typography>
                <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 280 }}>
                    {['Mensajes en tiempo real', 'Búsqueda de usuarios', 'Gestión de estado'].map(f => (
                        <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2563EB', flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{f}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Panel derecho - formulario */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#F8FAFC',
                p: 3,
            }}>
                <Box sx={{ width: '100%', maxWidth: 400 }}>
                    {/* Logo mobile */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChatBubbleIcon sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h6" fontWeight={700} color="#1E2A38">Chat Empresarial</Typography>
                    </Box>

                    <Typography variant="h5" fontWeight={700} color="#1E2A38" mb={0.5}>
                        Bienvenido de vuelta
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={4}>
                        Iniciá sesión para continuar
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            fullWidth
                            autoFocus
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                        />
                        <TextField
                            label="Contraseña"
                            type={showPass ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPass(!showPass)} edge="end" size="small">
                                            {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={cargando}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                fontSize: 15,
                                fontWeight: 600,
                                bgcolor: '#2563EB',
                                '&:hover': { bgcolor: '#1D4ED8' },
                                boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                                mt: 0.5,
                            }}
                        >
                            {cargando ? <CircularProgress size={22} color="inherit" /> : 'Iniciar sesión'}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
