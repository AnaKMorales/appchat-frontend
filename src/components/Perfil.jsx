import { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, Button,
    Avatar, Select, MenuItem, FormControl,
    InputLabel, IconButton, Divider, Alert, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { editarUsuario, cambiarEstado } from '../services/api';

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
            setMensaje({ tipo: 'success', texto: 'Perfil actualizado' });
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

    return (
        <Box sx={{ p: 3, maxWidth: 480, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={onVolver} sx={{ mr: 1 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" fontWeight="bold">Mi perfil</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Avatar sx={{ width: 100, height: 100, fontSize: 40, bgcolor: 'primary.main' }}>
                    {nombre[0]}{apellido[0]}
                </Avatar>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {mensaje && (
                <Alert severity={mensaje.tipo} sx={{ mb: 2 }} onClose={() => setMensaje(null)}>
                    {mensaje.texto}
                </Alert>
            )}

            {!usuarioActual ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Email"
                        value={usuarioActual.email || ''}
                        disabled
                        fullWidth
                    />
                    <TextField
                        label="Nombre"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        disabled={!editando}
                        fullWidth
                    />
                    <TextField
                        label="Apellido"
                        value={apellido}
                        onChange={e => setApellido(e.target.value)}
                        disabled={!editando}
                        fullWidth
                    />
                    <FormControl fullWidth>
                        <InputLabel>Estado</InputLabel>
                        <Select
                            value={estado}
                            label="Estado"
                            onChange={e => setEstado(e.target.value)}
                            disabled={!editando}
                        >
                            <MenuItem value="EN_LINEA">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'success.main' }} />
                                    En línea
                                </Box>
                            </MenuItem>
                            <MenuItem value="OCUPADO">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'warning.main' }} />
                                    Ocupado
                                </Box>
                            </MenuItem>
                            <MenuItem value="INVISIBLE">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'grey.400' }} />
                                    Invisible
                                </Box>
                            </MenuItem>
                            <MenuItem value="DESCONECTADO">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'grey.500' }} />
                                    Desconectado
                                </Box>
                            </MenuItem>
                        </Select>
                    </FormControl>

                    {editando ? (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button variant="outlined" fullWidth onClick={cancelar} disabled={guardando}>
                                Cancelar
                            </Button>
                            <Button variant="contained" fullWidth onClick={guardar} disabled={guardando}>
                                {guardando ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
                            </Button>
                        </Box>
                    ) : (
                        <Button variant="contained" fullWidth onClick={() => setEditando(true)}>
                            Editar perfil
                        </Button>
                    )}
                </Box>
            )}
        </Box>
    );
}
