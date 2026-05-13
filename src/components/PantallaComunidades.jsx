import { useState, useEffect } from 'react';
import {
    Box, Typography, Avatar, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import { getComunidades, crearComunidad } from '../services/api';

const COLORES = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#DB2777'];

function colorPorNombre(nombre) {
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) hash += nombre.charCodeAt(i);
    return COLORES[hash % COLORES.length];
}

export default function PantallaComunidades({ token, usuarioActual, onEntrarComunidad }) {
    const [comunidades, setComunidades] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [dialogCrear, setDialogCrear] = useState(false);
    const [form, setForm] = useState({ nombre: '', descripcion: '', fotoUrl: '' });

    useEffect(() => {
        cargarComunidades();
    }, [token]);

    const cargarComunidades = () => {
        setCargando(true);
        getComunidades(token)
            .then(setComunidades)
            .catch(() => {})
            .finally(() => setCargando(false));
    };

    const handleCrear = () => {
        crearComunidad({ nombre: form.nombre, descripcion: form.descripcion, fotoUrl: form.fotoUrl || null }, token)
            .then(() => {
                setDialogCrear(false);
                setForm({ nombre: '', descripcion: '', fotoUrl: '' });
                cargarComunidades();
            })
            .catch(() => {});
    };

    return (
        <Box sx={{ flex: 1, bgcolor: '#0F172A', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ px: 6, pt: 5, pb: 3 }}>
                <Typography variant="h4" fontWeight={700} color="white">
                    Tus comunidades
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mt: 0.5 }}>
                    Unite a una comunidad o creá la tuya para comenzar.
                </Typography>
            </Box>

            {/* Grid */}
            <Box sx={{ px: 6, pb: 6, flex: 1 }}>
                {cargando ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                        <CircularProgress sx={{ color: '#2563EB' }} />
                    </Box>
                ) : (
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: 3,
                    }}>
                        {/* Cards de comunidades */}
                        {comunidades.map(c => {
                            const color = colorPorNombre(c.nombre);
                            return (
                                <Box
                                    key={c.id}
                                    onClick={() => onEntrarComunidad(c)}
                                    sx={{
                                        bgcolor: '#1E293B',
                                        borderRadius: 3,
                                        p: 3,
                                        cursor: 'pointer',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        transition: 'all 0.18s',
                                        '&:hover': {
                                            bgcolor: '#263449',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                            borderColor: color,
                                        }
                                    }}
                                >
                                    <Avatar sx={{
                                        width: 52, height: 52,
                                        bgcolor: color,
                                        fontSize: 22, fontWeight: 700,
                                        mb: 2, borderRadius: 2
                                    }}>
                                        {c.fotoUrl
                                            ? <img src={c.fotoUrl} alt={c.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : c.nombre[0].toUpperCase()
                                        }
                                    </Avatar>
                                    <Typography fontWeight={700} fontSize={15} color="white" noWrap>
                                        {c.nombre}
                                    </Typography>
                                    <Typography fontSize={12} sx={{ color: 'rgba(255,255,255,0.45)', mt: 0.5, mb: 2 }} noWrap>
                                        {c.descripcion || 'Sin descripción'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <GroupsIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
                                        <Typography fontSize={12} sx={{ color: 'rgba(255,255,255,0.3)' }}>
                                            {c.cantidadMiembros ?? '?'} miembros
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}

                        {/* Card crear nueva */}
                        <Box
                            onClick={() => setDialogCrear(true)}
                            sx={{
                                bgcolor: 'transparent',
                                borderRadius: 3,
                                p: 3,
                                cursor: 'pointer',
                                border: '2px dashed rgba(255,255,255,0.12)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                minHeight: 160,
                                transition: 'all 0.18s',
                                '&:hover': {
                                    borderColor: '#2563EB',
                                    bgcolor: 'rgba(37,99,235,0.06)',
                                }
                            }}
                        >
                            <AddIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.3)' }} />
                            <Typography fontSize={13} fontWeight={600} sx={{ color: 'rgba(255,255,255,0.4)' }}>
                                Crear nueva comunidad
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Dialog Crear */}
            <Dialog open={dialogCrear} onClose={() => setDialogCrear(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { bgcolor: '#1E293B', color: 'white', borderRadius: 3 } }}>
                <DialogTitle fontWeight={700} sx={{ color: 'white' }}>Nueva comunidad</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                    <TextField
                        label="Nombre" value={form.nombre}
                        onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                        fullWidth required
                        InputLabelProps={{ style: { color: 'rgba(255,255,255,0.5)' } }}
                        InputProps={{ style: { color: 'white' } }}
                        sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } } }}
                    />
                    <TextField
                        label="Descripción" value={form.descripcion}
                        onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                        fullWidth multiline rows={2}
                        InputLabelProps={{ style: { color: 'rgba(255,255,255,0.5)' } }}
                        InputProps={{ style: { color: 'white' } }}
                        sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } } }}
                    />
                    <TextField
                        label="URL de foto (opcional)" value={form.fotoUrl}
                        onChange={e => setForm(f => ({ ...f, fotoUrl: e.target.value }))}
                        fullWidth
                        InputLabelProps={{ style: { color: 'rgba(255,255,255,0.5)' } }}
                        InputProps={{ style: { color: 'white' } }}
                        sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } } }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogCrear(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cancelar</Button>
                    <Button onClick={handleCrear} variant="contained" disabled={!form.nombre.trim()}
                        sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}>
                        Crear
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}