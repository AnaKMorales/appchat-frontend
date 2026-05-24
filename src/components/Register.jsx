import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';

import { register } from '../services/api';

import PersonIcon from '@mui/icons-material/Person';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';

export default function Register() {
    const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    userName: '',
    password: '',
  });

  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

const handleSubmit = async (e) => {
    e.preventDefault();

    setCargando(true);
    setError('');
    setSuccess('');

    try {
        await register({
            nombre: form.nombre,
            apellido: form.apellido,
            email: form.email,
            userName: form.userName,
            password: form.password,
        });

        setSuccess('Cuenta creada correctamente');

        setForm({
            nombre: '',
            apellido: '',
            email: '',
            userName: '',
            password: '',
        });

     } catch (err) {
        setError(err.message || 'No se pudo crear la cuenta');
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
          maxWidth: 500,
          bgcolor: 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.7)',
          borderRadius: 1,
          p: { xs: 4, md: 5 },
          boxShadow: '0 25px 70px rgba(15,23,42,0.10)',
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
              borderRadius: '24px',
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
            Crear cuenta
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: '#64748B',
              mt: 1,
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            Registrate para comenzar a usar AppChat.
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 3 }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 3, borderRadius: 3 }}
            onClose={() => setSuccess('')}
          >
            {success}
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
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
              },
              gap: 2,
            }}
          >
            <TextField
                label="Nombre"
                name="nombre"
                autoFocus
              value={form.nombre}
              onChange={handleChange}
              required
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                ),
              }}
              sx={textFieldStyles}
            />

            <TextField
              label="Apellido"
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              required
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                ),
              }}
              sx={textFieldStyles}
            />
          </Box>

          <TextField
            label="Nombre de usuario"
            name="userName"
            value={form.userName}
            onChange={handleChange}
            required
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AlternateEmailIcon sx={{ color: '#94A3B8' }} />
                </InputAdornment>
              ),
            }}
            sx={textFieldStyles}
          />

          <TextField
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: '#94A3B8' }} />
                </InputAdornment>
              ),
            }}
            sx={textFieldStyles}
          />

          <TextField
            label="Contraseña"
            type={showPass ? 'text' : 'password'}
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#94A3B8' }} />
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
            sx={textFieldStyles}
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

              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 14px 30px rgba(37,99,235,0.4)',
              },
            }}
          >
            {cargando ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              'Crear cuenta'
            )}
          </Button>

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
              ¿Ya tienes cuenta?
            </Typography>

            <Typography
              component="span"
              onClick={() => navigate('/login')}  // ← agregá esto
              sx={{
                fontWeight: 700,
                color: '#2563EB',
                cursor: 'pointer',

                '&:hover': {
                  color: '#1D4ED8',
                  textDecoration: 'underline',
                },
              }}
            >
              Iniciar sesión
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

const textFieldStyles = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'white',
    borderRadius: 3,

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
};