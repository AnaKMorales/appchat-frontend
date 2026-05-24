import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Avatar,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Drawer,
} from '@mui/material';

import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import MenuIcon from '@mui/icons-material/Menu';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import Chat from './Chat';
import Perfil from './Perfil';
import PantallaComunidades from './PantallaComunidades';
import PantallaComunidadDetalle from './PantallaComunidadDetalle';
import Notificaciones from './Notificaciones';

import {
    getChats,
    getComunidades,
    getComunidadDetalle,
    crearChatGrupo,
} from '../services/api';

const STATUS_COLOR = {
    EN_LINEA: '#22C55E',
    OCUPADO: '#F59E0B',
    INVISIBLE: '#94A3B8',
    DESCONECTADO: '#94A3B8',
};

function colorPorNombre() {
    return '#CBD5E1';
}

const T = {
    bg: '#F5F7FB',
    sidebar: '#FFFFFF',
    card: '#FFFFFF',

    border: '#E8EDF5',

    textPrimary: '#111827',
    textSecond: '#4B5563',
    textMuted: '#94A3B8',

    accent: '#2563EB',
    accentHover: '#1D4ED8',
    accentSoft: '#EAF2FF',
    accentLight: '#EAF2FF',

    bgHover: '#F3F6FB',
    active: '#EAF2FF',

    success: '#22C55E',
    danger: '#EF4444',
};

const R = '16px';

export default function Layout({
    token,
    usuarioActual,
    setUsuarioActual,
    onLogout,
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [pantalla, setPantalla] = useState('comunidades');
    const [comunidadActiva, setComunidadActiva] = useState(null);
    const [chatActivo, setChatActivo] = useState(null);

    const [comunidades, setComunidades] = useState([]);
    const [chats, setChats] = useState([]);

    const [refreshComunidades, setRefreshComunidades] = useState(0);

    const [dlgNuevoGrupo, setDlgNuevoGrupo] = useState(false);

    const [grupoForm, setGrupoForm] = useState({
        nombre: '',
        descripcion: '',
    });

    const [grupoMiembros, setGrupoMiembros] = useState([]);
    const [miembrosComunidad, setMiembrosComunidad] = useState([]);

    const statusColor =
        STATUS_COLOR[usuarioActual?.estado] || '#94A3B8';

    const cargarComunidades = useCallback(() => {
        getComunidades(token)
            .then(setComunidades)
            .catch(() => {});
    }, [token]);

    useEffect(() => {
        cargarComunidades();
    }, [cargarComunidades, refreshComunidades]);

    const cargarChats = useCallback(() => {
        if (!comunidadActiva) return;

        getChats(comunidadActiva.id, token)
            .then(setChats)
            .catch(() => {});
    }, [comunidadActiva, token]);

    useEffect(() => {
        cargarChats();

        if (!comunidadActiva) return;

        const interval = setInterval(cargarChats, 10000);

        return () => clearInterval(interval);
    }, [cargarChats, comunidadActiva]);

    useEffect(() => {
        if (!comunidadActiva) {
            setMiembrosComunidad([]);
            return;
        }

        getComunidadDetalle(comunidadActiva.id, token)
            .then((d) =>
                setMiembrosComunidad(
                    d?.miembros?.filter(
                        (m) => m.id !== usuarioActual?.id
                    ) || []
                )
            )
            .catch(() => {});
    }, [comunidadActiva, token, usuarioActual?.id]);

    const irAComunidad = (comunidad) => {
        setComunidadActiva(comunidad);
        setChatActivo(null);
        setChats([]);
        setPantalla('comunidad');

        if (isMobile) setSidebarOpen(false);
    };

    const irAChat = (chat) => {
        setChatActivo(chat);
        setPantalla('chat');

        if (isMobile) setSidebarOpen(false);

        setTimeout(cargarChats, 500);
    };

    const volverAComunidades = () => {
        setComunidadActiva(null);
        setChatActivo(null);
        setChats([]);
        setPantalla('comunidades');
    };

    const handleInvitacionAceptada = () =>
        setRefreshComunidades((r) => r + 1);

    const handleCrearGrupo = async () => {
        try {
            const chat = await crearChatGrupo(
                grupoForm.nombre,
                grupoForm.descripcion,
                comunidadActiva.id,
                grupoMiembros,
                token
            );

            setDlgNuevoGrupo(false);

            setGrupoForm({
                nombre: '',
                descripcion: '',
            });

            setGrupoMiembros([]);

            cargarChats();

            irAChat({
                chatId: chat.id,
                tipo: 'GRUPO',
                nombre: chat.nombre || grupoForm.nombre,
            });
        } catch {}
    };

    const chatsDirectos = chats.filter(
        (c) => c.tipo === 'DIRECTO'
    );

    const chatsGrupo = chats.filter(
        (c) => c.tipo === 'GRUPO'
    );

    const sidebarContent = (
        <Box
            sx={{
                width: isMobile ? 300 : 340,
                height: '100%',
                bgcolor: '#FFFFFF',
                borderRadius: isMobile ? 0 : '24px',
                border: isMobile
                    ? 'none'
                    : '1px solid #E7ECF3',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: isMobile
                    ? 'none'
                    : '0 8px 30px rgba(15,23,42,0.04)',
            }}
        >
            {/* HEADER */}
            <Box
                sx={{
                    px: 3,
                    py: 2.5,
                    borderBottom: '1px solid #EEF2F7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                    }}
                >
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '18px',
                            background:
                                'linear-gradient(135deg,#2563EB 0%, #0EA5E9 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <ChatBubbleIcon
                            sx={{
                                color: 'white',
                                fontSize: 20,
                            }}
                        />
                    </Box>

                    <Box>
                        <Typography
                            sx={{
                                fontWeight: 800,
                                fontSize: 17,
                                color: '#111827',
                            }}
                        >
                            AppChat
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: 12,
                                color: '#94A3B8',
                            }}
                        >
                            Workspace colaborativo
                        </Typography>
                    </Box>
                </Box>

                {comunidadActiva && (
                    <IconButton
                        onClick={volverAComunidades}
                        sx={{
                            bgcolor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                        }}
                    >
                        <ArrowBackIcon
                            sx={{ fontSize: 18 }}
                        />
                    </IconButton>
                )}
            </Box>

            {/* CONTENT */}
            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    px: 1.5,
                    pt: 2,
                    pb: 2,
                }}
            >
                {!comunidadActiva && (
                    <>
                        <Typography
                            sx={{
                                px: 1,
                                mb: 1.2,
                                fontSize: 11,
                                fontWeight: 800,
                                letterSpacing: '.08em',
                                textTransform: 'uppercase',
                                color: '#94A3B8',
                            }}
                        >
                            Comunidades
                        </Typography>

                        {comunidades.map((c) => (
                            <Box
                                key={c.id}
                                onClick={() =>
                                    irAComunidad(c)
                                }
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    px: 1.3,
                                    py: 1.1,
                                    borderRadius: '18px',
                                    cursor: 'pointer',
                                    mb: 0.6,

                                    '&:hover': {
                                        bgcolor: '#F5F7FF',
                                    },
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 42,
                                        height: 42,
                                        bgcolor:
                                            colorPorNombre(
                                                c.nombre
                                            ),
                                    }}
                                >
                                    {c.nombre?.[0]}
                                </Avatar>

                                <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                        noWrap
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: '#111827',
                                        }}
                                    >
                                        {c.nombre}
                                    </Typography>

                                    <Typography
                                        noWrap
                                        sx={{
                                            fontSize: 12,
                                            color: '#94A3B8',
                                        }}
                                    >
                                        Comunidad activa
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </>
                )}

                {comunidadActiva && (
                    <>
                        <SidebarItem
                            icon={
                                <GroupsIcon
                                    sx={{
                                        fontSize: 18,
                                    }}
                                />
                            }
                            label="Miembros y ajustes"
                            active={
                                pantalla === 'comunidad'
                            }
                            onClick={() =>
                                setPantalla(
                                    'comunidad'
                                )
                            }
                        />

                        <Typography
                            sx={{
                                px: 1.2,
                                pt: 3,
                                pb: 1,
                                fontSize: 11,
                                fontWeight: 800,
                                letterSpacing: '.08em',
                                textTransform: 'uppercase',
                                color: '#94A3B8',
                            }}
                        >
                            Mensajes directos
                        </Typography>

                        {chatsDirectos.map((c) => (
                            <ChatSidebarItem
                                key={c.id}
                                chat={c}
                                active={
                                    chatActivo?.chatId ===
                                    c.id
                                }
                                onClick={() =>
                                    irAChat({
                                        chatId: c.id,
                                        tipo: 'DIRECTO',
                                        nombre: c.nombre,
                                    })
                                }
                            />
                        ))}

                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent:
                                    'space-between',
                                px: 1.2,
                                pt: 3,
                                pb: 1,
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    letterSpacing:
                                        '.08em',
                                    textTransform:
                                        'uppercase',
                                    color: '#94A3B8',
                                }}
                            >
                                Grupos
                            </Typography>

                            <IconButton
                                onClick={() =>
                                    setDlgNuevoGrupo(
                                        true
                                    )
                                }
                                size="small"
                                sx={{
                                    bgcolor:
                                        '#EEF2FF',
                                }}
                            >
                                <AddIcon
                                    sx={{
                                        fontSize: 16,
                                        color:
                                            '#1D4ED8',
                                    }}
                                />
                            </IconButton>
                        </Box>

                        {chatsGrupo.map((c) => (
                            <ChatSidebarItem
                                key={c.id}
                                chat={c}
                                active={
                                    chatActivo?.chatId ===
                                    c.id
                                }
                                isGroup
                                onClick={() =>
                                    irAChat({
                                        chatId: c.id,
                                        tipo: 'GRUPO',
                                        nombre: c.nombre,
                                    })
                                }
                            />
                        ))}
                    </>
                )}
            </Box>

            {/* FOOTER */}
            <Box
                sx={{
                    p: 2,
                    borderTop: '1px solid #EEF2F7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    bgcolor: '#FCFDFE',
                }}
            >
                <Avatar
                    sx={{
                        width: 48,
                        height: 48,
                        bgcolor: '#CBD5E1',
                    }}
                >
                    {usuarioActual?.nombre?.[0]}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                    <Typography
                        noWrap
                        sx={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: '#111827',
                        }}
                    >
                        {usuarioActual?.nombre}{' '}
                        {usuarioActual?.apellido}
                    </Typography>

                    <Typography
                        noWrap
                        sx={{
                            fontSize: 12,
                            color: '#94A3B8',
                        }}
                    >
                        {usuarioActual?.estado?.toLowerCase()}
                    </Typography>
                </Box>

                <Notificaciones
                    token={token}
                    onInvitacionAceptada={
                        handleInvitacionAceptada
                    }
                    chatActivoId={chatActivo?.chatId}
                />

                <IconButton
                    onClick={() =>
                        setPantalla('perfil')
                    }
                >
                    <AccountCircleIcon />
                </IconButton>

                <IconButton onClick={onLogout}>
                    <LogoutIcon
                        sx={{ color: '#EF4444' }}
                    />
                </IconButton>
            </Box>
        </Box>
    );

    return (
        <Box
            sx={{
                display: 'flex',
                height: '100dvh',
                overflow: 'hidden',
                bgcolor: '#F5F7FB',
                p: isMobile ? 0 : 1.5,
                gap: 1.5,
            }}
        >
            {/* MOBILE BUTTON */}
            {isMobile && (
                <IconButton
                    onClick={() =>
                        setSidebarOpen(true)
                    }
                    sx={{
                        position: 'fixed',
                        top: 16,
                        left: 16,
                        zIndex: 2000,
                        bgcolor: 'white',
                        border:
                            '1px solid #E2E8F0',
                        boxShadow:
                            '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                >
                    <MenuIcon />
                </IconButton>
            )}

            {/* SIDEBAR */}
            {isMobile ? (
                <Drawer
                    open={sidebarOpen}
                    onClose={() =>
                        setSidebarOpen(false)
                    }
                >
                    {sidebarContent}
                </Drawer>
            ) : (
                sidebarContent
            )}

            {/* MAIN */}
            <Box
                sx={{
                    flex: 1,
                    borderRadius: isMobile
                        ? 0
                        : '28px',
                    overflow: 'hidden',
                    bgcolor: '#FFFFFF',
                    border: isMobile
                        ? 'none'
                        : '1px solid #E7ECF3',
                    boxShadow: isMobile
                        ? 'none'
                        : '0 8px 30px rgba(15,23,42,0.04)',
                }}
            >
                {pantalla === 'perfil' && (
                    <Perfil
                        token={token}
                        usuarioActual={
                            usuarioActual
                        }
                        onVolver={() =>
                            setPantalla(
                                comunidadActiva
                                    ? 'comunidad'
                                    : 'comunidades'
                            )
                        }
                        onActualizar={(u) =>
                            setUsuarioActual(u)
                        }
                    />
                )}

                {(pantalla === 'comunidades' ||
                    (!comunidadActiva &&
                        pantalla !== 'perfil')) && (
                    <PantallaComunidades
                        token={token}
                        usuarioActual={
                            usuarioActual
                        }
                        onEntrarComunidad={(
                            c
                        ) => {
                            irAComunidad(c);
                            cargarComunidades();
                        }}
                        refresh={
                            refreshComunidades
                        }
                    />
                )}

                {pantalla === 'comunidad' &&
                    comunidadActiva && (
                        <PantallaComunidadDetalle
                            token={token}
                            usuarioActual={
                                usuarioActual
                            }
                            comunidad={
                                comunidadActiva
                            }
                            onAbrirChat={
                                irAChat
                            }
                            onVolver={
                                volverAComunidades
                            }
                            onComunidadActualizada={(
                                c
                            ) =>
                                setComunidadActiva(
                                    c
                                )
                            }
                            onChatsActualizados={
                                cargarChats
                            }
                        />
                    )}

                {pantalla === 'chat' &&
                    chatActivo && (
                        <Chat
                            token={token}
                            chat={chatActivo}
                            usuarioActual={
                                usuarioActual
                            }
                            comunidadId={
                                comunidadActiva?.id
                            }
                            onVolver={() =>
                                setPantalla(
                                    'comunidad'
                                )
                            }
                        />
                    )}
            </Box>


               {/* DIALOG NUEVO GRUPO */}
            <Dialog
                open={dlgNuevoGrupo}
                onClose={() =>
                    setDlgNuevoGrupo(false)
                }
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle
                    sx={{
                        fontWeight: 700,
                        fontSize: 22,
                    }}
                >
                    Crear grupo
                </DialogTitle>

                <DialogContent
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        pt: '12px !important',
                    }}
                >
                    <TextField
                        label="Nombre del grupo"
                        fullWidth
                        value={grupoForm.nombre}
                        onChange={(e) =>
                            setGrupoForm({
                                ...grupoForm,
                                nombre:
                                    e.target.value,
                            })
                        }
                    />

                    <TextField
                        label="Descripción"
                        fullWidth
                        multiline
                        rows={3}
                        value={
                            grupoForm.descripcion
                        }
                        onChange={(e) =>
                            setGrupoForm({
                                ...grupoForm,
                                descripcion:
                                    e.target.value,
                            })
                        }
                    />

                    <Typography
                        sx={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#64748B',
                            mt: 1,
                        }}
                    >
                        Seleccionar miembros
                    </Typography>

                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            maxHeight: 220,
                            overflow: 'auto',
                            p: 0.5,
                        }}
                    >
                        {miembrosComunidad.map(
                            (m) => {
                                const selected =
                                    grupoMiembros.includes(
                                        m.id
                                    );

                                return (
                                    <Button
                                        key={m.id}
                                        variant={
                                            selected
                                                ? 'contained'
                                                : 'outlined'
                                        }
                                        onClick={() => {
                                            if (
                                                selected
                                            ) {
                                                setGrupoMiembros(
                                                    grupoMiembros.filter(
                                                        (
                                                            id
                                                        ) =>
                                                            id !==
                                                            m.id
                                                    )
                                                );
                                            } else {
                                                setGrupoMiembros(
                                                    [
                                                        ...grupoMiembros,
                                                        m.id,
                                                    ]
                                                );
                                            }
                                        }}
                                        sx={{
                                            borderRadius:
                                                '99px',
                                            textTransform:
                                                'none',
                                            px: 2,
                                            py: 1,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {m.nombre}{' '}
                                        {m.apellido}
                                    </Button>
                                );
                            }
                        )}
                    </Box>
                </DialogContent>

                <DialogActions
                    sx={{
                        px: 3,
                        pb: 2,
                    }}
                >
                    <Button
                        onClick={() =>
                            setDlgNuevoGrupo(
                                false
                            )
                        }
                        sx={{
                            textTransform: 'none',
                        }}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleCrearGrupo}
                        disabled={
                            !grupoForm.nombre
                        }
                        sx={{
                            textTransform: 'none',
                            borderRadius: '12px',
                            px: 3,
                        }}
                    >
                        Crear grupo
                    </Button>
                </DialogActions>
            </Dialog>     


        </Box>
    );
}

function SidebarItem({
    icon,
    label,
    active,
    onClick,
}) {
    return (
        <Box
            onClick={onClick}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 0.85,
                mx: 1,
                borderRadius: R,
                cursor: 'pointer',

                bgcolor: active
                    ? T.accentLight
                    : 'transparent',

                '&:hover': {
                    bgcolor: active
                        ? T.accentLight
                        : T.bgHover,
                },
            }}
        >
            <Box
                sx={{
                    color: active
                        ? T.accent
                        : T.textMuted,
                }}
            >
                {icon}
            </Box>

            <Typography
                fontSize={13}
                fontWeight={active ? 600 : 400}
                color={
                    active
                        ? T.accent
                        : T.textSecond
                }
            >
                {label}
            </Typography>
        </Box>
    );
}

function ChatSidebarItem({
    chat,
    active,
    onClick,
    isGroup,
}) {
    return (
        <Box
            onClick={onClick}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 0.85,
                mx: 1,
                borderRadius: R,
                cursor: 'pointer',

                bgcolor: active
                    ? T.accentLight
                    : 'transparent',

                '&:hover': {
                    bgcolor: active
                        ? T.accentLight
                        : T.bgHover,
                },
            }}
        >
            <Avatar
                sx={{
                    width: 40,
                    height: 40,
                    bgcolor: '#CBD5E1',
                    color: 'white',
                }}
            >
                {isGroup ? (
                    <GroupsIcon
                        sx={{
                            fontSize: 16,
                        }}
                    />
                ) : (
                    chat.nombre?.[0]?.toUpperCase()
                )}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
                <Typography
                    noWrap
                    fontSize={13}
                    fontWeight={600}
                    color={
                        active
                            ? T.accent
                            : T.textSecond
                    }
                >
                    {chat.nombre}
                </Typography>

                {chat.ultimoMensajeContenido && (
                    <Typography
                        noWrap
                        fontSize={11}
                        sx={{
                            color: T.textMuted,
                        }}
                    >
                        {
                            chat.ultimoMensajeContenido
                        }
                    </Typography>
                )}

            </Box> 

        </Box>

    );
}