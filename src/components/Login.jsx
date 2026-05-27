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

import { useNavigate } from 'react-router-dom';

import CONFIG from '../services/config';

export default function Login({ onLogin }) {
    const navigate = useNavigate();

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
            const response = await fetch(`${CONFIG.BASE_URL}/auth/login`, {
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
        } catch(err) {
            setError('No se pudo conectar al servidor');
            console.log(err);
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    return (
    <Box
        sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        bgcolor: '#F4F7FB',

        background: `
            radial-gradient(circle at top left, rgba(37,99,235,0.10), transparent 25%),
            radial-gradient(circle at bottom right, rgba(79,70,229,0.10), transparent 25%)
        `,
        }}
    >
    <Box
      sx={{
        width: '100%',
        maxWidth: 460,
        bgcolor: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.7)',
        borderRadius: 1,
        p: { xs: 4, md: 5 },
        boxShadow: '0 25px 70px rgba(15,23,42,0.10)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box
          sx={{
            width: 74,
            height: 74,
            borderRadius: '40px',
            background:
              'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(37,99,235,0.35)',
            mb: 2,
          }}
        >
          <ChatBubbleIcon sx={{ color: 'white', fontSize: 34 }} />
        </Box>

        <Typography
          variant="h4"
          fontWeight={800}
          color="#0F172A"
          textAlign="center"
        >
          ¡Bienvenido!
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: '#64748B',
            mt: 1,
            textAlign: 'center',
            lineHeight: 1.6,
            maxWidth: 320,
          }}
        >
          Iniciá sesión para acceder a tu espacio de trabajo.
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 3,
          }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon
                  sx={{
                    color: '#94A3B8',
                    fontSize: 20,
                  }}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'white',
              borderRadius: 1,
              transition: '0.2s',

              '& fieldset': {
                borderColor: '#E2E8F0',
              },

              '&:hover fieldset': {
                borderColor: '#2563EB',
              },

              '&.Mui-focused': {
                boxShadow: '0 0 0 4px rgba(37,99,235,0.12)',
              },
            },
          }}
        />

        <TextField
          label="Contraseña"
          type={showPass ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon
                  sx={{
                    color: '#94A3B8',
                    fontSize: 20,
                  }}
                />
              </InputAdornment>
            ),

            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPass(!showPass)}
                  edge="end"
                  size="small"
                >
                  {showPass ? (
                    <VisibilityOff fontSize="small" />
                  ) : (
                    <Visibility fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'white',
              borderRadius: 1,
              transition: '0.2s',

              '& fieldset': {
                borderColor: '#E2E8F0',
              },

              '&:hover fieldset': {
                borderColor: '#2563EB',
              },

              '&.Mui-focused': {
                boxShadow: '0 0 0 4px rgba(37,99,235,0.12)',
              },
            },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={cargando}
          sx={{
            py: 1.6,
            borderRadius: 1,
            fontSize: 15,
            fontWeight: 700,
            textTransform: 'none',
            background:
              'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
            boxShadow: '0 10px 25px rgba(37,99,235,0.35)',
            transition: '0.25s',

            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 14px 30px rgba(37,99,235,0.4)',
            },
          }}
        >
          {cargando ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            'Iniciar sesión'
          )}
        </Button>

        {/* Footer */}
        <Box
          sx={{
            mt: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 0.5,
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#64748B',
            }}
          >
            ¿No tienes cuenta?
          </Typography>

          <Typography
            component="span"
            onClick={() => navigate('/register')}
            sx={{
                fontWeight: 700,
                color: '#2563EB',
                cursor: 'pointer',
                transition: '0.2s',

                '&:hover': {
                    color: '#1D4ED8',
                    textDecoration: 'underline',
                },
            }}
            >
            Regístrate
        </Typography>
        </Box>
      </Box>
    </Box>
  </Box>
);
}
