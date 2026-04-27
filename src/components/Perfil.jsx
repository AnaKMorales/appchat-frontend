import { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, Button,
    Avatar, Select, MenuItem, FormControl,
    InputLabel, Divider, Alert, CircularProgress, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { editarUsuario, cambiarEstado } from '../services/api';

const ESTADOS = [
    { value: 'EN_LINEA',      label: 'En línea',     color: '#22C55E' },
    { value: 'OCUPADO',       label: 'Ocupado',       color: '#F59E0B' },
    { value: 'INVISIBLE',     label: 'Invisible',     color: '#94A3B8' },
    { value: 'DESCONECTADO',  label: 'Desconectado',  color: '#64748B' },
];

export default function Perfil({ token, usuarioActual, onVolver }) {
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [estado, setEstado] = useState('EN_LINEA');
    const [editando, setEditando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    useEffect(() => {
        if (usuarioActual) {
            setNombre(usuarioActual.nombre || '');
            setApellido(usuarioActual.apellido || '');
            setEstado(usuarioActual.estado || 'EN_LINEA');
        }
    }, [usuarioActual]);

    const guardar = async () => {
        if (!usuarioActual) return;
        setGuardando(true);
        setMensaje(null);
        try {
            await editarUsuario(usuarioActual.id, { nombre, apellido }, token);
            await cambiarEstado(usuarioActual.id, estado, token);
            setMensaje({ tipo: 'success', texto: 'Perfil actualizado correctamente' });
            setEditando(false);
        } catch {
            setMensaje({ tipo: 'error', texto: 'Error al guardar los cambios' });
        } finally {
            setGuardando(false);
        }
    };

    const cancelar = () => {
        if (usuarioActual) {
            setNombre(usuarioActual.nombre || '');
            setApellido(usuarioActual.apellido || '');
            setEstado(usuarioActual.estado || 'EN_LINEA');
        }
        setEditando(false);
        setMensaje(null);
    };

    const estadoActual = ESTADOS.find(e => e.value === estado) || ESTADOS[0];

    return (
        <Box sx={{ height: '100%', bgcolor: '#F8FAFC', overflow: 'auto' }}>
            {/* Header */}
            <Box sx={{
                px: 3, py: 2,
                bgcolor: 'white',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
                <IconButton onClick={onVolver} size="small" sx={{ color: '#64748B' }}>
                    <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Typography fontWeight={600} fontSize={15} color="#1E293B">
                    Mi perfil
                </Typography>
            </Box>

            <Box sx={{ maxWidth: 480, mx: 'auto', p: 4 }}>
                {/* Avatar section */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mb: 4,
                    gap: 1.5,
                }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar sx={{
                            width: 90, height: 90,
                            fontSize: 32, fontWeight: 700,
                            bgcolor: '#2563EB',
                            boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                        }}>
                            {nombre[0]}{apellido[0]}
                        </Avatar>
                        <Box sx={{
                            width: 16, height: 16,
                            bgcolor: estadoActual.color,
                            border: '3px solid white',
                            borderRadius: '50%',
                            position: 'absolute',
                            bottom: 4, right: 4,
                        }} />
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography fontWeight={700} fontSize={18} color="#1E293B">
                            {nombre} {apellido}
                        </Typography>
                        <Typography variant="body2" color="#64748B">
                            {usuarioActual?.email}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {mensaje && (
                    <Alert severity={mensaje.tipo} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMensaje(null)}>
                        {mensaje.texto}
                    </Alert>
                )}

                {!usuarioActual ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress size={28} sx={{ color: '#2563EB' }} />
                    </Box>
                ) : (
                    <Box sx={{
                        bgcolor: 'white',
                        borderRadius: 3,
                        border: '1px solid #E2E8F0',
                        overflow: 'hidden',
                    }}>
                        <Box sx={{
                            px: 3, py: 2,
                            borderBottom: '1px solid #F1F5F9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <Typography fontWeight={600} fontSize={14} color="#1E293B">
                                Información personal
                            </Typography>
                            {!editando && (
                                <Button
                                    size="small"
                                    startIcon={<EditIcon fontSize="small" />}
                                    onClick={() => setEditando(true)}
                                    sx={{ color: '#2563EB', fontWeight: 600, fontSize: 13 }}
                                >
                                    Editar
                                </Button>
                            )}
                        </Box>

                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField
                                label="Email"
                                value={usuarioActual.email || ''}
                                disabled
                                fullWidth
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <TextField
                                label="Nombre"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                disabled={!editando}
                                fullWidth
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <TextField
                                label="Apellido"
                                value={apellido}
                                onChange={e => setApellido(e.target.value)}
                                disabled={!editando}
                                fullWidth
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <FormControl fullWidth size="small" disabled={!editando}>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    value={estado}
                                    label="Estado"
                                    onChange={e => setEstado(e.target.value)}
                                    sx={{ borderRadius: 2 }}
                                >
                                    {ESTADOS.map(e => (
                                        <MenuItem key={e.value} value={e.value}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: e.color }} />
                                                {e.label}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {editando && (
                                <Box sx={{ display: 'flex', gap: 1.5, pt: 0.5 }}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={cancelar}
                                        disabled={guardando}
                                        sx={{ borderRadius: 2, borderColor: '#E2E8F0', color: '#64748B' }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={guardar}
                                        disabled={guardando}
                                        sx={{
                                            borderRadius: 2,
                                            bgcolor: '#2563EB',
                                            '&:hover': { bgcolor: '#1D4ED8' },
                                        }}
                                    >
                                        {guardando ? <CircularProgress size={18} color="inherit" /> : 'Guardar'}
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
