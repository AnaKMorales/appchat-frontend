import { useState, useEffect } from 'react';
import { Box, TextField, Typography, Avatar, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getUsuarios } from '../services/api';

const STATUS_COLOR = {
    EN_LINEA: '#22C55E',
    OCUPADO: '#F59E0B',
    INVISIBLE: null,
    DESCONECTADO: '#94A3B8',
};

export default function Buscador({ token, onSeleccionarUsuario, usuarioSeleccionado, onUnauthorized }) {
    const [query, setQuery] = useState('');
    const [todos, setTodos] = useState([]);

    useEffect(() => {
        if (!token) return;
        getUsuarios(token)
            .then(data => setTodos(data.filter(u => u.estado !== 'INVISIBLE')))
            .catch(err => { if (err?.status === 401) onUnauthorized?.(); });
    }, [token]);

    const filtrados = query.trim()
        ? todos.filter(u =>
            `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(query.toLowerCase())
        )
        : todos;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', pt: 2 }}>
            {/* Título sección */}
            <Typography variant="caption" sx={{
                px: 2.5, pb: 1,
                color: 'rgba(255,255,255,0.35)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontSize: 10,
            }}>
                Usuarios
            </Typography>

            {/* Buscador */}
            <Box sx={{ px: 1.5, pb: 1.5 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255,255,255,0.07)',
                            borderRadius: 1.5,
                            color: 'rgba(255,255,255,0.85)',
                            '& fieldset': { border: 'none' },
                            '&:hover fieldset': { border: 'none' },
                            '&.Mui-focused fieldset': { border: '1px solid rgba(255,255,255,0.15)' },
                            '& input': { py: 0.75, fontSize: 13 },
                        },
                        '& .MuiInputBase-input::placeholder': {
                            color: 'rgba(255,255,255,0.3)',
                            opacity: 1,
                        },
                    }}
                />
            </Box>

            {/* Lista */}
            <Box>
                {filtrados.length === 0 && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', px: 2.5 }}>
                        Sin resultados
                    </Typography>
                )}
                {filtrados.map(u => {
                    const selected = usuarioSeleccionado?.id === u.id;
                    const dotColor = STATUS_COLOR[u.estado];

                    return (
                        <Box
                            key={u.id}
                            onClick={() => onSeleccionarUsuario(u)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                px: 1.5,
                                py: 0.75,
                                mx: 1,
                                mb: 0.25,
                                borderRadius: 1.5,
                                cursor: 'pointer',
                                bgcolor: selected ? 'rgba(37,99,235,0.3)' : 'transparent',
                                '&:hover': {
                                    bgcolor: selected ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.06)',
                                },
                                transition: 'background 0.12s',
                            }}
                        >
                            <Box sx={{ position: 'relative', flexShrink: 0 }}>
                                <Avatar 
                                    src={u.fotoPerfil || undefined}
                                    sx={{
                                        width: 30, height: 30,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        bgcolor: selected ? '#2563EB' : '#2D3F52',
                                    }}
                                >
                                    {!u.fotoPerfil && `${u.nombre?.[0] || ''}${u.apellido?.[0] || ''}`}
                                </Avatar>
                                {dotColor && (
                                    <Box sx={{
                                        width: 9, height: 9,
                                        bgcolor: dotColor,
                                        border: '2px solid #1E2A38',
                                        borderRadius: '50%',
                                        position: 'absolute',
                                        bottom: 0, right: 0,
                                    }} />
                                )}
                            </Box>
                            <Typography
                                variant="body2"
                                noWrap
                                sx={{
                                    fontSize: 13.5,
                                    color: selected ? 'white' : 'rgba(255,255,255,0.75)',
                                    fontWeight: selected ? 600 : 400,
                                }}
                            >
                                {u.nombre} {u.apellido}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
