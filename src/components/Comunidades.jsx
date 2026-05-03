import { useState, useEffect } from 'react';
import {
    Box, Typography, Avatar, IconButton, Button, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    List, ListItem, ListItemAvatar, ListItemText, Divider,
    CircularProgress, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupsIcon from '@mui/icons-material/Groups';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getComunidades, getComunidadDetalle, crearComunidad, editarComunidad, eliminarComunidad } from '../services/api';

export default function Comunidades({ token, usuarioActual }) {
    const [comunidades, setComunidades] = useState([]);
    const [seleccionada, setSeleccionada] = useState(null);
    const [detalle, setDetalle] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [dialogCrear, setDialogCrear] = useState(false);
    const [dialogEditar, setDialogEditar] = useState(false);
    const [dialogEliminar, setDialogEliminar] = useState(false);
    const [form, setForm] = useState({ nombre: '', descripcion: '', fotoUrl: '' });

    useEffect(() => {
        cargarComunidades();
    }, [token]);

    const cargarComunidades = () => {
        getComunidades(token)
            .then(setComunidades)
            .catch(() => {});
    };

    const verDetalle = (c) => {
        setSeleccionada(c);
        setCargando(true);
        getComunidadDetalle(c.id, token)
            .then(setDetalle)
            .catch(() => {})
            .finally(() => setCargando(false));
    };

    const esOwner = detalle?.ownerUserId === usuarioActual?.id;

    const handleCrear = () => {
        crearComunidad({ nombre: form.nombre, descripcion: form.descripcion, fotoUrl: form.fotoUrl || null }, token)
            .then(() => { setDialogCrear(false); setForm({ nombre: '', descripcion: '', fotoUrl: '' }); cargarComunidades(); })
            .catch(() => {});
    };

    const handleEditar = () => {
        editarComunidad(seleccionada.id, { nombre: form.nombre, descripcion: form.descripcion, fotoUrl: form.fotoUrl || null }, token)
            .then(() => { setDialogEditar(false); verDetalle(seleccionada); cargarComunidades(); })
            .catch(() => {});
    };

    const handleEliminar = () => {
        eliminarComunidad(seleccionada.id, token)
            .then(() => { setDialogEliminar(false); setSeleccionada(null); setDetalle(null); cargarComunidades(); })
            .catch(() => {});
    };

    return (
        <Box sx={{ display: 'flex', height: '100%' }}>
            {/* Lista de comunidades */}
            <Box sx={{ width: 260, flexShrink: 0, bgcolor: '#1E2A38', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography fontWeight={700} color="white" fontSize={15}>Comunidades</Typography>
                    <Tooltip title="Nueva comunidad">
                        <IconButton size="small" onClick={() => { setForm({ nombre: '', descripcion: '', fotoUrl: '' }); setDialogCrear(true); }} sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white' } }}>
                            <AddIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
                    {comunidades.length === 0 ? (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)', px: 2.5, mt: 2 }}>
                            No pertenecés a ninguna comunidad
                        </Typography>
                    ) : comunidades.map(c => (
                        <Box key={c.id} onClick={() => verDetalle(c)} sx={{
                            px: 2, py: 1.5, mx: 1, borderRadius: 2, cursor: 'pointer',
                            bgcolor: seleccionada?.id === c.id ? 'rgba(37,99,235,0.3)' : 'transparent',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
                            display: 'flex', alignItems: 'center', gap: 1.5,
                        }}>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: '#2563EB', fontSize: 15, fontWeight: 700 }}>
                                {c.fotoUrl ? <img src={c.fotoUrl} alt={c.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.nombre[0]}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography fontSize={13} fontWeight={600} color="white" noWrap>{c.nombre}</Typography>
                                <Typography fontSize={11} sx={{ color: 'rgba(255,255,255,0.4)' }} noWrap>{c.descripcion}</Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Detalle */}
            <Box sx={{ flex: 1, bgcolor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
                {!seleccionada ? (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <Box sx={{ width: 80, height: 80, borderRadius: 4, bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <GroupsIcon sx={{ fontSize: 40, color: '#BFDBFE' }} />
                        </Box>
                        <Typography variant="h6" fontWeight={600} color="#1E293B">Seleccioná una comunidad</Typography>
                        <Typography variant="body2" color="#94A3B8">O creá una nueva con el botón +</Typography>
                    </Box>
                ) : cargando ? (
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CircularProgress size={28} sx={{ color: '#2563EB' }} />
                    </Box>
                ) : detalle && (
                    <Box sx={{ flex: 1, overflow: 'auto' }}>
                        {/* Header comunidad */}
                        <Box sx={{ px: 4, py: 3, bgcolor: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 56, height: 56, bgcolor: '#2563EB', fontSize: 22, fontWeight: 700 }}>
                                {detalle.fotoUrl ? <img src={detalle.fotoUrl} alt={detalle.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : detalle.nombre[0]}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight={700} color="#1E293B">{detalle.nombre}</Typography>
                                <Typography variant="body2" color="#64748B">{detalle.descripcion}</Typography>
                            </Box>
                            {esOwner && (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="Editar">
                                        <IconButton onClick={() => { setForm({ nombre: detalle.nombre, descripcion: detalle.descripcion || '', fotoUrl: detalle.fotoUrl || '' }); setDialogEditar(true); }} sx={{ color: '#64748B', '&:hover': { color: '#2563EB' } }}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Eliminar">
                                        <IconButton onClick={() => setDialogEliminar(true)} sx={{ color: '#64748B', '&:hover': { color: '#EF4444' } }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            )}
                        </Box>

                        {/* Miembros */}
                        <Box sx={{ px: 4, py: 3 }}>
                            <Typography fontWeight={600} color="#1E293B" mb={2}>
                                Miembros ({detalle.miembros?.length || 0})
                            </Typography>
                            <List disablePadding>
                                {detalle.miembros?.map((m, i) => (
                                    <Box key={m.id}>
                                        <ListItem disablePadding sx={{ py: 1 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: '#2563EB', fontWeight: 700, width: 38, height: 38, fontSize: 14 }}>
                                                    {m.nombre?.[0]}{m.apellido?.[0]}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={<Typography fontWeight={500} fontSize={14} color="#1E293B">{m.nombre} {m.apellido}</Typography>}
                                                secondary={<Typography fontSize={12} color="#94A3B8">{m.email}</Typography>}
                                            />
                                            {m.id === detalle.ownerUserId && (
                                                <Typography fontSize={11} fontWeight={600} sx={{ color: '#2563EB', bgcolor: '#EFF6FF', px: 1, py: 0.3, borderRadius: 1 }}>
                                                    OWNER
                                                </Typography>
                                            )}
                                        </ListItem>
                                        {i < detalle.miembros.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </List>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Dialog Crear */}
            <Dialog open={dialogCrear} onClose={() => setDialogCrear(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Nueva comunidad</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <TextField label="Nombre" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} fullWidth required />
                    <TextField label="Descripción" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} fullWidth multiline rows={2} />
                    <TextField label="URL de foto (opcional)" value={form.fotoUrl} onChange={e => setForm(f => ({ ...f, fotoUrl: e.target.value }))} fullWidth />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogCrear(false)} color="inherit">Cancelar</Button>
                    <Button onClick={handleCrear} variant="contained" disabled={!form.nombre.trim()} sx={{ bgcolor: '#2563EB' }}>Crear</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Editar */}
            <Dialog open={dialogEditar} onClose={() => setDialogEditar(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Editar comunidad</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <TextField label="Nombre" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} fullWidth required />
                    <TextField label="Descripción" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} fullWidth multiline rows={2} />
                    <TextField label="URL de foto (opcional)" value={form.fotoUrl} onChange={e => setForm(f => ({ ...f, fotoUrl: e.target.value }))} fullWidth />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogEditar(false)} color="inherit">Cancelar</Button>
                    <Button onClick={handleEditar} variant="contained" disabled={!form.nombre.trim()} sx={{ bgcolor: '#2563EB' }}>Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Eliminar */}
            <Dialog open={dialogEliminar} onClose={() => setDialogEliminar(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Eliminar comunidad</DialogTitle>
                <DialogContent>
                    <Typography>¿Estás seguro que querés eliminar <strong>{seleccionada?.nombre}</strong>? Esta acción no se puede deshacer.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogEliminar(false)} color="inherit">Cancelar</Button>
                    <Button onClick={handleEliminar} variant="contained" color="error">Eliminar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}