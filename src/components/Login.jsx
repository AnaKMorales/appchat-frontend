import { useState } from 'react';
import {
    Box, Card, CardContent, TextField, Button,
    Typography, Alert, CircularProgress
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { login } from '../services/api';

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);
        try {
            const data = await login(email, password);
            if (data.token) {
                localStorage.setItem('token', data.token);
                onLogin(data.token);
            } else {
                setError(data.error || 'Credenciales incorrectas');
            }
        } catch {
            setError('No se pudo conectar con el servidor');
        } finally {
            setCargando(false);
        }
    };

    return (
        <Box sx={{
            height: '100vh', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            bgcolor: 'grey.100'
        }}>
            <Card sx={{ width: 380, p: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <ChatIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                        <Typography variant="h5" fontWeight="bold">AppChat Corporativa</Typography>
                        <Typography variant="body2" color="text.secondary">Iniciá sesión para continuar</Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            fullWidth
                            autoFocus
                        />
                        <TextField
                            label="Contraseña"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            fullWidth
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={cargando}
                        >
                            {cargando ? <CircularProgress size={24} color="inherit" /> : 'Iniciar sesión'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
