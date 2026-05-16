import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Avatar, IconButton, Tooltip, Divider, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Chip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import Chat from './Chat';
import Perfil from './Perfil';
import PantallaComunidades from './PantallaComunidades';
import PantallaComunidadDetalle from './PantallaComunidadDetalle';
import Notificaciones from './Notificaciones';
import { getChats, getComunidades, getComunidadDetalle, crearChatGrupo } from '../services/api';

const STATUS_COLOR = {
    EN_LINEA: '#22C55E',
    OCUPADO: '#F59E0B',
    INVISIBLE: '#94A3B8',
    DESCONECTADO: '#94A3B8',
};

const COLORES_AVATAR = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#DB2777'];
function colorPorNombre(nombre) {
    if (!nombre) return COLORES_AVATAR[0];
    let h = 0; for (let i = 0; i < nombre.length; i++) h += nombre.charCodeAt(i);
    return COLORES_AVATAR[h % COLORES_AVATAR.length];
}

export default function Layout({ token, usuarioActual, setUsuarioActual, onLogout }) {
    const [pantalla, setPantalla] = useState('comunidades');
    const [comunidadActiva, setComunidadActiva] = useState(null);
    const [chatActivo, setChatActivo] = useState(null);
    const [comunidades, setComunidades] = useState([]);
    const [chats, setChats] = useState([]);
    const [cargandoChats, setCargandoChats] = useState(false);
    const [refreshComunidades, setRefreshComunidades] = useState(0);
    const [dlgNuevoGrupo, setDlgNuevoGrupo] = useState(false);
    const [grupoForm, setGrupoForm] = useState({ nombre: '', descripcion: '' });
    const [grupoMiembros, setGrupoMiembros] = useState([]);
    const [miembrosComunidad, setMiembrosComunidad] = useState([]);

    const statusColor = STATUS_COLOR[usuarioActual?.estado] || '#94A3B8';

    const cargarComunidades = useCallback(() => {
        getComunidades(token).then(setComunidades).catch(() => {});
    }, [token]);

    useEffect(() => {
        cargarComunidades();
    }, [cargarComunidades, refreshComunidades]);

    const cargarChats = useCallback(() => {
        if (!comunidadActiva) return;
        setCargandoChats(true);
        getChats(comunidadActiva.id, token)
            .then(setChats)
            .catch(() => {})
            .finally(() => setCargandoChats(false));
    }, [comunidadActiva, token]);

    useEffect(() => {
        cargarChats();
        if (!comunidadActiva) return;
        const interval = setInterval(cargarChats, 10000);
        return () => clearInterval(interval);
    }, [cargarChats, comunidadActiva]);

    useEffect(() => {
        if (!comunidadActiva) { setMiembrosComunidad([]); return; }
        getComunidadDetalle(comunidadActiva.id, token)
            .then(d => setMiembrosComunidad(d?.miembros?.filter(m => m.id !== usuarioActual?.id) || []))
            .catch(() => {});
    }, [comunidadActiva, token, usuarioActual?.id]);

    const irAComunidad = (comunidad) => {
        setComunidadActiva(comunidad);
        setChatActivo(null);
        setChats([]);
        setPantalla('comunidad');
    };

    const irAChat = (chat) => {
        setChatActivo(chat);
        setPantalla('chat');
        setTimeout(cargarChats, 500);
    };

    const volverAComunidades = () => {
        setComunidadActiva(null);
        setChatActivo(null);
        setChats([]);
        setPantalla('comunidades');
    };

    const handleInvitacionAceptada = () => {
        setRefreshComunidades(r => r + 1);
    };

    const handleCrearGrupo = async () => {
        try {
            const chat = await crearChatGrupo(grupoForm.nombre, grupoForm.descripcion, comunidadActiva.id, grupoMiembros, token);
            setDlgNuevoGrupo(false);
            setGrupoForm({ nombre: '', descripcion: '' });
            setGrupoMiembros([]);
            cargarChats();
            irAChat({ chatId: chat.id, tipo: 'GRUPO', nombre: chat.nombre || grupoForm.nombre });
        } catch {}
    };

    const chatsDirectos = chats.filter(c => c.tipo === 'DIRECTO');
    const chatsGrupo = chats.filter(c => c.tipo === 'GRUPO');

    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

            {/* Sidebar */}
            <Box sx={{ width: 240, flexShrink: 0, bgcolor: '#111827', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

                {/* Logo */}
                <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography fontWeight={800} fontSize={16} color="white" letterSpacing={-0.5}>AppChat</Typography>
                    {comunidadActiva && (
                        <Tooltip title="Volver a comunidades">
                            <IconButton size="small" onClick={volverAComunidades}
                                sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'white' }, p: 0.4 }}>
                                <ArrowBackIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>

                {/* Contenido */}
                <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
                    {!comunidadActiva && (
                        <>
                            <SectionLabel label="Tus comunidades" />
                            {comunidades.length === 0 ? (
                                <Typography fontSize={11} sx={{ color: 'rgba(255,255,255,0.25)', px: 2.5, py: 1 }}>
                                    Sin comunidades aún
                                </Typography>
                            ) : comunidades.map(c => (
                                <ComunidadItem key={c.id} comunidad={c} onClick={() => irAComunidad(c)} />
                            ))}
                            <Box sx={{ px: 2, mt: 1 }}>
                                <Box onClick={() => setPantalla('comunidades')} sx={{
                                    display: 'flex', alignItems: 'center', gap: 1,
                                    px: 1.5, py: 1, borderRadius: 1.5, cursor: 'pointer',
                                    border: '1px dashed rgba(255,255,255,0.12)',
                                    '&:hover': { borderColor: '#2563EB', bgcolor: 'rgba(37,99,235,0.06)' },
                                    transition: 'all 0.15s',
                                }}>
                                    <AddIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
                                    <Typography fontSize={12} sx={{ color: 'rgba(255,255,255,0.3)' }}>
                                        Explorar / crear comunidad
                                    </Typography>
                                </Box>
                            </Box>
                        </>
                    )}

                    {comunidadActiva && (
                        <>
                            <Box sx={{ px: 2.5, pb: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 700, bgcolor: colorPorNombre(comunidadActiva.nombre), borderRadius: 1.5 }}>
                                        {comunidadActiva.nombre?.[0]?.toUpperCase()}
                                    </Avatar>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography fontSize={13} fontWeight={700} color="white" noWrap>{comunidadActiva.nombre}</Typography>
                                        {comunidadActiva.descripcion && (
                                            <Typography fontSize={10} sx={{ color: 'rgba(255,255,255,0.35)' }} noWrap>{comunidadActiva.descripcion}</Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>

                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2, mb: 1 }} />

                            <SidebarItem
                                icon={<GroupsIcon sx={{ fontSize: 15 }} />}
                                label="Miembros y ajustes"
                                active={pantalla === 'comunidad'}
                                onClick={() => setPantalla('comunidad')}
                            />

                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2, my: 1 }} />

                            <SectionLabel label="Mensajes directos" />
                            {cargandoChats && chatsDirectos.length === 0 ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                                    <CircularProgress size={14} sx={{ color: '#2563EB' }} />
                                </Box>
                            ) : chatsDirectos.length === 0 ? (
                                <Typography fontSize={11} sx={{ color: 'rgba(255,255,255,0.2)', px: 2.5, pb: 1 }}>Sin conversaciones</Typography>
                            ) : chatsDirectos.map(c => (
                                <ChatSidebarItem key={c.id} chat={c} active={chatActivo?.chatId === c.id}
                                    onClick={() => irAChat({ chatId: c.id, tipo: 'DIRECTO', nombre: c.nombre || 'Chat directo', interlocutorId: c.usuarioInterlocutorId })}
                                />
                            ))}

                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2, my: 1 }} />

                            <SectionLabel label="Grupos" onAdd={() => setDlgNuevoGrupo(true)} tooltip="Nuevo grupo" />
                            {chatsGrupo.length === 0 ? (
                                <Typography fontSize={11} sx={{ color: 'rgba(255,255,255,0.2)', px: 2.5, pb: 1 }}>Sin grupos</Typography>
                            ) : chatsGrupo.map(c => (
                                <ChatSidebarItem key={c.id} chat={c} active={chatActivo?.chatId === c.id} isGroup
                                    onClick={() => irAChat({ chatId: c.id, tipo: 'GRUPO', nombre: c.nombre || 'Grupo' })}
                                />
                            ))}
                        </>
                    )}
                </Box>

                {/* Footer */}
                <Box sx={{ px: 1.5, py: 1.25, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar sx={{ width: 30, height: 30, bgcolor: '#2563EB', fontSize: 11, fontWeight: 700 }}>
                            {usuarioActual?.nombre?.[0]}{usuarioActual?.apellido?.[0]}
                        </Avatar>
                        <Box sx={{ width: 8, height: 8, bgcolor: statusColor, border: '2px solid #111827', borderRadius: '50%', position: 'absolute', bottom: 0, right: 0 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontSize={11} fontWeight={600} color="white" noWrap>
                            {usuarioActual ? `${usuarioActual.nombre} ${usuarioActual.apellido}` : '...'}
                        </Typography>
                        <Typography fontSize={10} sx={{ color: 'rgba(255,255,255,0.35)' }} noWrap>
                            {usuarioActual?.estado?.replace('_', ' ') || ''}
                        </Typography>
                    </Box>
                    <Notificaciones token={token} onInvitacionAceptada={handleInvitacionAceptada} chatActivoId={chatActivo?.chatId} />
                    <Tooltip title="Mi perfil">
                        <IconButton size="small" onClick={() => setPantalla('perfil')}
                            sx={{ color: 'rgba(255,255,255,0.35)', '&:hover': { color: 'white' }, p: 0.3 }}>
                            <AccountCircleIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Cerrar sesión">
                        <IconButton size="small" onClick={onLogout}
                            sx={{ color: 'rgba(255,255,255,0.35)', '&:hover': { color: '#F87171' }, p: 0.3 }}>
                            <LogoutIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Área principal */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {pantalla === 'perfil' && (
                    <Perfil token={token} usuarioActual={usuarioActual}
                        onVolver={() => setPantalla(comunidadActiva ? 'comunidad' : 'comunidades')}
                        onActualizar={(u) => setUsuarioActual(u)} />
                )}
                {(pantalla === 'comunidades' || (!comunidadActiva && pantalla !== 'perfil')) && (
                    <PantallaComunidades token={token} usuarioActual={usuarioActual}
                        onEntrarComunidad={(c) => { irAComunidad(c); cargarComunidades(); }}
                        refresh={refreshComunidades} />
                )}
                {pantalla === 'comunidad' && comunidadActiva && (
                    <PantallaComunidadDetalle token={token} usuarioActual={usuarioActual}
                        comunidad={comunidadActiva} onAbrirChat={irAChat}
                        onVolver={volverAComunidades}
                        onComunidadActualizada={(c) => setComunidadActiva(c)}
                        onChatsActualizados={cargarChats} />
                )}
                {pantalla === 'chat' && chatActivo && (
                    <Chat token={token} chat={chatActivo} usuarioActual={usuarioActual}
                        comunidadId={comunidadActiva?.id}
                        onVolver={() => setPantalla('comunidad')} />
                )}
            </Box>

            {/* Dialog nuevo grupo */}
            <Dialog open={dlgNuevoGrupo} onClose={() => setDlgNuevoGrupo(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Nuevo grupo</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                    <TextField label="Nombre del grupo" value={grupoForm.nombre}
                        onChange={e => setGrupoForm(f => ({ ...f, nombre: e.target.value }))} fullWidth required />
                    <TextField label="Descripción (opcional)" value={grupoForm.descripcion}
                        onChange={e => setGrupoForm(f => ({ ...f, descripcion: e.target.value }))} fullWidth multiline rows={2} />
                    <Box>
                        <Typography fontSize={13} fontWeight={600} color="#475569" mb={1}>Agregar miembros</Typography>
                        {miembrosComunidad.length === 0 ? (
                            <Typography fontSize={12} color="#94A3B8">No hay otros miembros en esta comunidad</Typography>
                        ) : (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {miembrosComunidad.map(m => {
                                    const sel = grupoMiembros.includes(m.id);
                                    return (
                                        <Chip key={m.id} label={`${m.nombre} ${m.apellido}`}
                                            onClick={() => setGrupoMiembros(prev => sel ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                                            sx={{ fontSize: 12, bgcolor: sel ? '#2563EB' : '#F1F5F9', color: sel ? 'white' : '#475569', '&:hover': { bgcolor: sel ? '#1D4ED8' : '#E2E8F0' } }} />
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDlgNuevoGrupo(false)} color="inherit">Cancelar</Button>
                    <Button onClick={handleCrearGrupo} variant="contained" disabled={!grupoForm.nombre.trim()}
                        sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}>
                        Crear grupo
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

function SectionLabel({ label, onAdd, tooltip }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pt: 1, pb: 0.5 }}>
            <Typography variant="caption" sx={{ flex: 1, color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {label}
            </Typography>
            {onAdd && (
                <Tooltip title={tooltip || 'Agregar'}>
                    <IconButton size="small" onClick={onAdd} sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'white' }, p: 0.3 }}>
                        <AddIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    );
}

function SidebarItem({ icon, label, active, onClick }) {
    return (
        <Box onClick={onClick} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 0.85, mx: 1, borderRadius: 1.5, cursor: 'pointer', bgcolor: active ? 'rgba(37,99,235,0.25)' : 'transparent', '&:hover': { bgcolor: active ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.06)' }, transition: 'background 0.12s' }}>
            <Box sx={{ color: active ? '#60A5FA' : 'rgba(255,255,255,0.4)' }}>{icon}</Box>
            <Typography fontSize={13} fontWeight={active ? 600 : 400} color={active ? 'white' : 'rgba(255,255,255,0.6)'} noWrap>{label}</Typography>
        </Box>
    );
}

function ComunidadItem({ comunidad, onClick }) {
    return (
        <Box onClick={onClick} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 0.85, mx: 1, borderRadius: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' }, transition: 'background 0.12s' }}>
            <Avatar sx={{ width: 26, height: 26, fontSize: 11, fontWeight: 700, bgcolor: colorPorNombre(comunidad.nombre), borderRadius: 1, flexShrink: 0 }}>
                {comunidad.nombre?.[0]?.toUpperCase()}
            </Avatar>
            <Typography fontSize={13} color="rgba(255,255,255,0.7)" noWrap fontWeight={500}>{comunidad.nombre}</Typography>
        </Box>
    );
}

function ChatSidebarItem({ chat, active, onClick, isGroup }) {
    return (
        <Box onClick={onClick} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 0.75, mx: 1, borderRadius: 1.5, cursor: 'pointer', bgcolor: active ? 'rgba(37,99,235,0.25)' : 'transparent', '&:hover': { bgcolor: active ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.06)' }, transition: 'background 0.12s' }}>
            <Avatar sx={{ width: 24, height: 24, fontSize: 10, fontWeight: 700, bgcolor: isGroup ? '#7C3AED' : '#334155', borderRadius: isGroup ? 1 : '50%', flexShrink: 0 }}>
                {isGroup ? <GroupsIcon sx={{ fontSize: 13 }} /> : (chat.nombre?.[0] || '?')}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontSize={12} fontWeight={active ? 600 : 400} color={active ? 'white' : 'rgba(255,255,255,0.65)'} noWrap>
                    {chat.nombre || 'Chat'}
                </Typography>
                {chat.ultimoMensajeContenido && (
                    <Typography fontSize={10} sx={{ color: 'rgba(255,255,255,0.25)' }} noWrap>{chat.ultimoMensajeContenido}</Typography>
                )}
            </Box>
        </Box>
    );
}
