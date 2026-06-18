import { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, TextField, Button, Avatar,
    Select, MenuItem, FormControl, InputLabel,
    Divider, Alert, CircularProgress, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { editarUsuario, cambiarEstado } from '../services/api';

import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
        ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        : null;

//const BASE_URL = 'http://localhost:8080/appchat/api';

const ESTADOS = [
    { value: 'EN_LINEA',     label: 'En línea',    color: '#22C55E' },
    { value: 'OCUPADO',      label: 'Ocupado',      color: '#F59E0B' },
    { value: 'INVISIBLE',    label: 'Invisible',    color: '#94A3B8' },
    { value: 'DESCONECTADO', label: 'Desconectado', color: '#64748B' },
];

export default function Perfil({ token, usuarioActual, onVolver, onActualizar }) {
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [estado, setEstado] = useState('EN_LINEA');
    const [editando, setEditando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [guardandoEstado, setGuardandoEstado] = useState(false);
    const [subiendoFoto, setSubiendoFoto] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (usuarioActual) {
            setNombre(usuarioActual.nombre || '');
            setApellido(usuarioActual.apellido || '');
            setEstado(usuarioActual.estado || 'EN_LINEA');
            setFotoPreview(usuarioActual.fotoPerfil || null);
        }
    }, [usuarioActual]);

    const handleFotoSeleccionada = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!supabase) {
        setMensaje({ tipo: 'error', texto: 'Falta configurar Supabase (REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY)' });
        return;
    }

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setMensaje({ tipo: 'error', texto: 'Solo se permiten imágenes JPG, PNG, GIF o WEBP' });
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        setMensaje({ tipo: 'error', texto: 'La imagen no puede superar 5MB' });
        return;
    }

    // Preview local inmediato
    const reader = new FileReader();
    reader.onload = (ev) => setFotoPreview(ev.target.result);
    reader.readAsDataURL(file);

    setSubiendoFoto(true);
    setMensaje(null);

    try {
        const extension = file.name.split('.').pop();
        const path = `avatars/${usuarioActual.id}.${extension}`;

        // Subir a Supabase Storage
        const { error } = await supabase.storage
        .from('fotos-perfil')
        .upload(path, file, { upsert: true });

        if (error) throw new Error(error.message);

        // Obtener URL pública
        const { data } = supabase.storage.from('fotos-perfil').getPublicUrl(path);
        const url = data.publicUrl;

        // Guardar URL en tu backend Java (ya tenés este endpoint)
        await editarUsuario(usuarioActual.id, {
        nombre: usuarioActual.nombre,
        apellido: usuarioActual.apellido,
        fotoPerfil: url
        }, token);

        setFotoPreview(url);
        setMensaje({ tipo: 'success', texto: 'Foto actualizada correctamente' });
        if (onActualizar) onActualizar({ ...usuarioActual, fotoPerfil: url });

    } catch (err) {
        setMensaje({ tipo: 'error', texto: 'Error al subir la foto: ' + err.message });
        setFotoPreview(usuarioActual?.fotoPerfil || null);
    } finally {
        setSubiendoFoto(false);
    }
    };

    const guardar = async () => {
    if (!usuarioActual) return;
    setGuardando(true);
    setMensaje(null);
    try {
        const updated = await editarUsuario(usuarioActual.id, {
            nombre,
            apellido,
            fotoPerfil: fotoPreview || ''
        }, token);
        setMensaje({ tipo: 'success', texto: 'Perfil actualizado correctamente' });
        setEditando(false);
        if (onActualizar) onActualizar({ ...usuarioActual, nombre, apellido, ...(updated || {}) });
    } catch {
        setMensaje({ tipo: 'error', texto: 'Error al guardar los cambios' });
    } finally {
        setGuardando(false);
    }
};

    const handleCambioEstado = async (nuevoEstado) => {
        setEstado(nuevoEstado);

        if (!usuarioActual || nuevoEstado === (usuarioActual.estado || 'EN_LINEA')) {
            return;
        }

        setGuardandoEstado(true);
        setMensaje(null);
        try {
            await cambiarEstado(usuarioActual.id, nuevoEstado, token);
            setMensaje({ tipo: 'success', texto: 'Estado actualizado correctamente' });
            if (onActualizar) onActualizar({ ...usuarioActual, estado: nuevoEstado });
        } catch {
            setMensaje({ tipo: 'error', texto: 'Error al actualizar el estado' });
            setEstado(usuarioActual.estado || 'EN_LINEA');
        } finally {
            setGuardandoEstado(false);
        }
    };

    const cancelar = () => {
        if (usuarioActual) {
            setNombre(usuarioActual.nombre || '');
            setApellido(usuarioActual.apellido || '');
            setFotoPreview(usuarioActual.fotoPerfil || null);
        }
        setEditando(false);
        setMensaje(null);
    };

    const estadoActual = ESTADOS.find(e => e.value === estado) || ESTADOS[0];

    return (
        <Box sx={{ height: '100%', bgcolor: '#F8FAFC', overflow: 'auto' }}>
            <Box sx={{ px: 3, py: 2, bgcolor: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <IconButton onClick={onVolver} size="small" sx={{ color: '#64748B' }}>
                    <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Typography fontWeight={600} fontSize={15} color="#1E293B">Mi perfil</Typography>
            </Box>

            <Box sx={{ maxWidth: 480, mx: 'auto', p: 4 }}>
                {/* Avatar con botón de cambio de foto */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, gap: 1.5 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            src={fotoPreview || undefined}
                            sx={{ width: 90, height: 90, fontSize: 32, fontWeight: 700, bgcolor: '#2563EB', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
                        >
                            {!fotoPreview && `${nombre?.[0] || ''}${apellido?.[0] || ''}`}
                        </Avatar>
                        <Box sx={{ width: 16, height: 16, bgcolor: estadoActual.color, border: '3px solid white', borderRadius: '50%', position: 'absolute', bottom: 4, right: 4 }} />

                        {/* Botón subir foto */}
                        <IconButton
                            size="small"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={subiendoFoto || !supabase}
                            sx={{
                                position: 'absolute', bottom: -4, left: -4,
                                width: 28, height: 28,
                                bgcolor: 'white', border: '2px solid #E2E8F0',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                '&:hover': { bgcolor: '#F1F5F9' }
                            }}
                        >
                            {subiendoFoto
                                ? <CircularProgress size={12} sx={{ color: '#2563EB' }} />
                                : <PhotoCameraIcon sx={{ fontSize: 13, color: '#64748B' }} />
                            }
                        </IconButton>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            style={{ display: 'none' }}
                            onChange={handleFotoSeleccionada}
                        />
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography fontWeight={700} fontSize={18} color="#1E293B">{nombre} {apellido}</Typography>
                        <Typography variant="body2" color="#64748B">@{usuarioActual?.username}</Typography>
                        <Typography variant="caption" color="#94A3B8" sx={{ display: 'block', mt: 0.5 }}>
                            {supabase
                                ? 'Click en la cámara para cambiar tu foto'
                                : 'Subida de foto deshabilitada: faltan variables de Supabase'}
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
                    <Box sx={{ bgcolor: 'white', borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography fontWeight={600} fontSize={14} color="#1E293B">Información personal</Typography>
                            {!editando && (
                                <Button size="small" startIcon={<EditIcon fontSize="small" />}
                                    onClick={() => setEditando(true)}
                                    sx={{ color: '#2563EB', fontWeight: 600, fontSize: 13 }}>
                                    Editar
                                </Button>
                            )}
                        </Box>
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField label="Email" value={usuarioActual.email || ''} disabled fullWidth size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            <TextField label="Username" value={usuarioActual.username || ''} disabled fullWidth size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            <TextField label="Nombre" value={nombre} onChange={e => setNombre(e.target.value)}
                                disabled={!editando} fullWidth size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            <TextField label="Apellido" value={apellido} onChange={e => setApellido(e.target.value)}
                                disabled={!editando} fullWidth size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            <FormControl fullWidth size="small" disabled={guardandoEstado}>
                                <InputLabel>Estado</InputLabel>
                                <Select value={estado} label="Estado" onChange={e => handleCambioEstado(e.target.value)} sx={{ borderRadius: 2 }}>
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
                                    <Button variant="outlined" fullWidth onClick={cancelar} disabled={guardando}
                                        sx={{ borderRadius: 2, borderColor: '#E2E8F0', color: '#64748B' }}>
                                        Cancelar
                                    </Button>
                                    <Button variant="contained" fullWidth onClick={guardar} disabled={guardando}
                                        sx={{ borderRadius: 2, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}>
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
