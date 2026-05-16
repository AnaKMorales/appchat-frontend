import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Avatar, IconButton, Button, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, List, ListItem, ListItemAvatar, ListItemText,
    CircularProgress, Divider, Chip, Menu, MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ForumIcon from '@mui/icons-material/Forum';
import {
    crearChat, crearChatGrupo,
    getComunidadDetalle, editarComunidad, eliminarComunidad,
    invitarUsuario, salirComunidad, eliminarMiembroComunidad,
} from '../services/api';

const COLORES_AVATAR = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#DB2777'];
function colorPorNombre(nombre) {
    if (!nombre) return COLORES_AVATAR[0];
    let h = 0; for (let i = 0; i < nombre.length; i++) h += nombre.charCodeAt(i);
    return COLORES_AVATAR[h % COLORES_AVATAR.length];
}

export default function PantallaComunidadDetalle({ token, usuarioActual, comunidad, onAbrirChat, onVolver, onComunidadActualizada, onChatsActualizados }) {
    const [detalle, setDetalle] = useState(null);
    const [cargando, setCargando] = useState(true);

    const [dlgInvitar, setDlgInvitar] = useState(false);
    const [dlgEditar, setDlgEditar] = useState(false);
    const [dlgEliminar, setDlgEliminar] = useState(false);
    const [dlgNuevoGrupo, setDlgNuevoGrupo] = useState(false);
    const [dlgSalir, setDlgSalir] = useState(false);

    const [invUsername, setInvUsername] = useState('');
    const [invError, setInvError] = useState('');
    const [formEditar, setFormEditar] = useState({ nombre: '', descripcion: '', fotoUrl: '' });
    const [grupoForm, setGrupoForm] = useState({ nombre: '', descripcion: '' });
    const [grupoMiembros, setGrupoMiembros] = useState([]);
    const [menuAnchor, setMenuAnchor] = useState(null);

    const esOwner = detalle?.ownerUserId === usuarioActual?.id;
    const miembrosNoYo = detalle?.miembros?.filter(m => m.id !== usuarioActual?.id) || [];

    const cargar = useCallback(() => {
        setCargando(true);
        getComunidadDetalle(comunidad.id, token)
            .then(det => { setDetalle(det); if (onChatsActualizados) onChatsActualizados(); })
            .catch(() => {})
            .finally(() => setCargando(false));
    }, [comunidad.id, token]);

    useEffect(() => {
        cargar();
        // polling de miembros cada 15s para detectar nuevos
        const interval = setInterval(cargar, 15000);
        return () => clearInterval(interval);
    }, [cargar]);

    const handleInvitar = async () => {
        setInvError('');
        try {
            await invitarUsuario(comunidad.id, invUsername, token);
            setDlgInvitar(false);
            setInvUsername('');
        } catch {
            setInvError('No se pudo invitar. Verificá el username.');
        }
    };

    const handleEditar = async () => {
        try {
            await editarComunidad(comunidad.id, formEditar, token);
            setDlgEditar(false);
            cargar();
            onComunidadActualizada({ ...comunidad, ...formEditar });
        } catch {}
    };

    const handleEliminar = async () => {
        try {
            await eliminarComunidad(comunidad.id, token);
            setDlgEliminar(false);
            onVolver();
        } catch {}
    };

    const handleSalir = async () => {
        try {
            await salirComunidad(comunidad.id, token);
            setDlgSalir(false);
            onVolver();
        } catch {}
    };

    const handleEliminarMiembro = async (userId) => {
        try {
            await eliminarMiembroComunidad(comunidad.id, userId, token);
            cargar();
        } catch {}
    };

    const handleChatDirecto = async (miembro) => {
        try {
            const chat = await crearChat(miembro.id, comunidad.id, token);
            if (onChatsActualizados) onChatsActualizados();
            onAbrirChat({ chatId: chat.id, tipo: 'DIRECTO', nombre: `${miembro.nombre} ${miembro.apellido}`, interlocutorId: miembro.id });
        } catch {}
    };

    const handleCrearGrupo = async () => {
        try {
            const chat = await crearChatGrupo(grupoForm.nombre, grupoForm.descripcion, comunidad.id, grupoMiembros, token);
            setDlgNuevoGrupo(false);
            setGrupoForm({ nombre: '', descripcion: '' });
            setGrupoMiembros([]);
            if (onChatsActualizados) onChatsActualizados();
            onAbrirChat({ chatId: chat.id, tipo: 'GRUPO', nombre: chat.nombre || grupoForm.nombre });
        } catch {}
    };

    return (
        /* Solo el panel de contenido — sin panel izquierdo propio */
        <Box sx={{ height: '100%', bgcolor: '#F8FAFC', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

            {cargando ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <CircularProgress sx={{ color: '#2563EB' }} />
                </Box>
            ) : detalle && (
                <>
                    {/* Header */}
                    <Box sx={{ px: 4, py: 3, bgcolor: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 48, height: 48, bgcolor: colorPorNombre(detalle.nombre), fontSize: 20, fontWeight: 700, borderRadius: 2 }}>
                            {detalle.fotoUrl
                                ? <img src={detalle.fotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : detalle.nombre?.[0]?.toUpperCase()
                            }
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={700} color="#1E293B">{detalle.nombre}</Typography>
                            <Typography variant="body2" color="#64748B">{detalle.descripcion || 'Sin descripción'}</Typography>
                        </Box>
                        <Button variant="outlined" size="small" startIcon={<PersonAddIcon />}
                            onClick={() => setDlgInvitar(true)}
                            sx={{ borderColor: '#CBD5E1', color: '#475569', borderRadius: 2, fontSize: 13 }}>
                            Invitar
                        </Button>
                        <Tooltip title="Opciones">
                            <IconButton size="small" onClick={e => setMenuAnchor(e.currentTarget)} sx={{ color: '#94A3B8' }}>
                                <MoreVertIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Miembros */}
                    <Box sx={{ px: 4, py: 3 }}>
                        <Typography fontWeight={700} fontSize={13} color="#64748B"
                            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 2 }}>
                            Miembros · {detalle.miembros?.length || 0}
                        </Typography>
                        <List disablePadding sx={{ bgcolor: 'white', borderRadius: 2, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                            {detalle.miembros?.map((m, i) => {
                                const esYo = m.id === usuarioActual?.id;
                                const esOwnerM = m.id === detalle.ownerUserId;
                                return (
                                    <Box key={m.id}>
                                        <ListItem disablePadding sx={{ px: 2, py: 1.25 }}
                                            secondaryAction={!esYo && (
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title="Enviar mensaje">
                                                        <IconButton size="small" onClick={() => handleChatDirecto(m)}
                                                            sx={{ color: '#94A3B8', '&:hover': { color: '#2563EB' } }}>
                                                            <ForumIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {esOwner && (
                                                        <Tooltip title="Expulsar">
                                                            <IconButton size="small" onClick={() => handleEliminarMiembro(m.id)}
                                                                sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' } }}>
                                                                <DeleteIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            )}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ width: 38, height: 38, bgcolor: colorPorNombre(m.nombre), fontWeight: 700, fontSize: 13 }}>
                                                    {m.nombre?.[0]}{m.apellido?.[0]}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography fontWeight={500} fontSize={14} color="#1E293B">
                                                            {m.nombre} {m.apellido}
                                                            {esYo && <span style={{ color: '#94A3B8', fontSize: 12 }}> (vos)</span>}
                                                        </Typography>
                                                        {esOwnerM && (
                                                            <Chip label="ADMIN" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: '#EFF6FF', color: '#2563EB' }} />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    <Typography fontSize={12} color="#94A3B8">
                                                        {m.email} {m.username ? `· @${m.username}` : ''}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                        {i < detalle.miembros.length - 1 && <Divider />}
                                    </Box>
                                );
                            })}
                        </List>
                    </Box>
                </>
            )}

            {/* Menú contextual */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}
                PaperProps={{ sx: { bgcolor: '#1E293B', color: 'white', border: '1px solid rgba(255,255,255,0.1)', minWidth: 180 } }}>
                <MenuItem onClick={() => { setMenuAnchor(null); setDlgInvitar(true); }}
                    sx={{ fontSize: 13, gap: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' } }}>
                    <PersonAddIcon fontSize="small" /> Invitar usuario
                </MenuItem>
                {esOwner && [
                    <MenuItem key="editar" onClick={() => {
                        setMenuAnchor(null);
                        setFormEditar({ nombre: detalle?.nombre || '', descripcion: detalle?.descripcion || '', fotoUrl: detalle?.fotoUrl || '' });
                        setDlgEditar(true);
                    }} sx={{ fontSize: 13, gap: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' } }}>
                        <EditIcon fontSize="small" /> Editar comunidad
                    </MenuItem>,
                    <MenuItem key="eliminar" onClick={() => { setMenuAnchor(null); setDlgEliminar(true); }}
                        sx={{ fontSize: 13, gap: 1, color: '#F87171', '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}>
                        <DeleteIcon fontSize="small" /> Eliminar comunidad
                    </MenuItem>
                ]}
                {!esOwner && (
                    <MenuItem onClick={() => { setMenuAnchor(null); setDlgSalir(true); }}
                        sx={{ fontSize: 13, gap: 1, color: '#F87171', '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}>
                        <ExitToAppIcon fontSize="small" /> Salir de la comunidad
                    </MenuItem>
                )}
            </Menu>

            {/* Dialogs */}
            <Dialog open={dlgInvitar} onClose={() => { setDlgInvitar(false); setInvError(''); setInvUsername(''); }} maxWidth="xs" fullWidth
                PaperProps={{ sx: { bgcolor: '#1E293B', color: 'white', borderRadius: 3 } }}>
                <DialogTitle fontWeight={700} sx={{ color: 'white' }}>Invitar a {comunidad.nombre}</DialogTitle>
                <DialogContent>
                    <TextField fullWidth label="Username" value={invUsername}
                        onChange={e => setInvUsername(e.target.value)}
                        error={!!invError} helperText={invError || 'Ingresá el username del usuario (no el email)'}
                        InputLabelProps={{ style: { color: 'rgba(255,255,255,0.5)' } }}
                        InputProps={{ style: { color: 'white' } }}
                        FormHelperTextProps={{ style: { color: invError ? '#F87171' : 'rgba(255,255,255,0.35)' } }}
                        sx={{ mt: 1, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } } }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDlgInvitar(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cancelar</Button>
                    <Button onClick={handleInvitar} variant="contained" disabled={!invUsername.trim()} sx={{ bgcolor: '#2563EB' }}>Invitar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dlgEditar} onClose={() => setDlgEditar(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Editar comunidad</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                    <TextField label="Nombre" value={formEditar.nombre} onChange={e => setFormEditar(f => ({ ...f, nombre: e.target.value }))} fullWidth required />
                    <TextField label="Descripción" value={formEditar.descripcion} onChange={e => setFormEditar(f => ({ ...f, descripcion: e.target.value }))} fullWidth multiline rows={2} />
                    <TextField label="URL de foto (opcional)" value={formEditar.fotoUrl} onChange={e => setFormEditar(f => ({ ...f, fotoUrl: e.target.value }))} fullWidth />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDlgEditar(false)} color="inherit">Cancelar</Button>
                    <Button onClick={handleEditar} variant="contained" disabled={!formEditar.nombre.trim()} sx={{ bgcolor: '#2563EB' }}>Guardar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dlgEliminar} onClose={() => setDlgEliminar(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Eliminar comunidad</DialogTitle>
                <DialogContent>
                    <Typography>¿Seguro que querés eliminar <strong>{comunidad.nombre}</strong>? Esta acción no se puede deshacer.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDlgEliminar(false)} color="inherit">Cancelar</Button>
                    <Button onClick={handleEliminar} variant="contained" color="error">Eliminar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dlgSalir} onClose={() => setDlgSalir(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Salir de la comunidad</DialogTitle>
                <DialogContent>
                    <Typography>¿Seguro que querés salir de <strong>{comunidad.nombre}</strong>?</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDlgSalir(false)} color="inherit">Cancelar</Button>
                    <Button onClick={handleSalir} variant="contained" color="error">Salir</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dlgNuevoGrupo} onClose={() => setDlgNuevoGrupo(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Nuevo grupo</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                    <TextField label="Nombre del grupo" value={grupoForm.nombre}
                        onChange={e => setGrupoForm(f => ({ ...f, nombre: e.target.value }))} fullWidth required />
                    <TextField label="Descripción (opcional)" value={grupoForm.descripcion}
                        onChange={e => setGrupoForm(f => ({ ...f, descripcion: e.target.value }))} fullWidth multiline rows={2} />
                    <Box>
                        <Typography fontSize={13} fontWeight={600} color="#475569" mb={1}>Agregar miembros</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {miembrosNoYo.map(m => {
                                const sel = grupoMiembros.includes(m.id);
                                return (
                                    <Chip key={m.id} label={`${m.nombre} ${m.apellido}`}
                                        onClick={() => setGrupoMiembros(prev => sel ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                                        sx={{ fontSize: 12, bgcolor: sel ? '#2563EB' : '#F1F5F9', color: sel ? 'white' : '#475569', '&:hover': { bgcolor: sel ? '#1D4ED8' : '#E2E8F0' } }}
                                    />
                                );
                            })}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDlgNuevoGrupo(false)} color="inherit">Cancelar</Button>
                    <Button onClick={handleCrearGrupo} variant="contained" disabled={!grupoForm.nombre.trim()} sx={{ bgcolor: '#2563EB' }}>Crear grupo</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
