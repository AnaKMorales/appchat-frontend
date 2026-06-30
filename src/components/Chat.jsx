import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, TextField, IconButton, Avatar, CircularProgress, Tooltip, InputAdornment, Chip, MenuItem, Collapse, Badge, Stack, Snackbar, Alert, Fade} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ReplyIcon from '@mui/icons-material/Reply';
import AttachFileIcon from '@mui/icons-material/AttachFile';
//import { getMensajes } from '../services/api';
import PushPinIcon from '@mui/icons-material/PushPin';
import {
    getMensajes,
    fijarMensaje,
    desfijarMensaje,
    getMensajesFijados,
    getUsuarios,
    subirAdjunto,
} from '../services/api';
import { encryptMsg, decryptMsg, isE2E } from '../services/crypto';


import CONFIG from '../services/config';
const WS_URL = CONFIG.WS_URL;
const API_URL = CONFIG.BASE_URL;

const REACCIONES_RAPIDAS = ['👍', '❤️', '😂', '😮', '🔥'];


function formatNombreMensaje(mensaje) {
    return `${mensaje?.emisorNombre ?? ''} ${mensaje?.emisorApellido ?? ''}`.trim() || mensaje?.emisorEmail || 'Usuario';
}

function fechaComparable(fecha) {
    const d = new Date(fecha);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function obtenerFechaISO(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
}

function construirAdjuntoUrl(mensaje, token) {
    const base = mensaje?.adjuntoUrl || `${API_URL}/chats/adjuntos/${mensaje?.id}`;
    return `${base}?token=${encodeURIComponent(token || '')}`;
}

function reaccionKey(reaccion) {
    if (!reaccion) return '';
    if (reaccion.id != null) return `id-${reaccion.id}`;
    return `tmp-${reaccion.tipo ?? ''}-${reaccion.usuarioId ?? ''}`;
}

function mensajeKey(mensaje) {
    if (!mensaje) return '';
    if (mensaje.id != null) return `id-${mensaje.id}`;
    if (mensaje._key) return `key-${mensaje._key}`;
    return [
        `c:${mensaje.contenido ?? ''}`,
        `e:${mensaje.emisorId ?? ''}`,
        `p:${mensaje.parentId ?? ''}`,
        `f:${mensaje.fechaEnvio ?? ''}`,
    ].join('|');
}

function idMensajeFijado(item) {
    if (!item) return null;
    return item.mensajeId ?? item.id ?? null;
}

function deduplicarMensajes(lista = []) {
    const mapa = new Map();
    for (const mensaje of lista) {
        const clave = mensajeKey(mensaje);
        if (!clave) continue;
        const anterior = mapa.get(clave);
        if (!anterior) {
            mapa.set(clave, mensaje);
            continue;
        }

        const combinado = {
            ...anterior,
            ...mensaje,
            reacciones: unirReacciones(anterior.reacciones, mensaje.reacciones),
        };
        delete combinado._optimista;
        mapa.set(clave, combinado);
    }
    return Array.from(mapa.values());
}

function unirReacciones(actuales = [], nuevas = []) {
    const mapa = new Map();
    [...actuales, ...nuevas].forEach((reaccion) => {
        if (!reaccion) return;
        mapa.set(reaccionKey(reaccion), reaccion);
    });
    return Array.from(mapa.values());
}

export default function Chat({ token, chat, usuarioActual, onVolver, cryptoState }) {
    const [mensaje, setMensaje] = useState('');
    const [mensajes, setMensajes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [wsConectado, setWsConectado] = useState(false);
    const [filtros, setFiltros] = useState({ contenido: '', fecha: '', usuario: '' });
    const [buscadorAbierto, setBuscadorAbierto] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [mensajesFijados, setMensajesFijados] = useState([]);
    const [pinActualIndex, setPinActualIndex] = useState(0);
    const [pinVisible, setPinVisible] = useState(true);
    const [accionesMensajeId, setAccionesMensajeId] = useState(null);
    const wsRef = useRef(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const [pinAnimadoId, setPinAnimadoId] = useState(null);
    const mensajeRefs = useRef({});
    const [mensajeResaltadoId, setMensajeResaltadoId] = useState(null);
    const [notificacion, setNotificacion] = useState({
        open: false,
        mensaje: '',
        severity: 'info'
    });
    const [subiendoAdjunto, setSubiendoAdjunto] = useState(false);

    const [usuariosMap, setUsuariosMap] = useState({});

    // Mapa de contenido descifrado { msgId: plaintext }
    const [decryptedContents, setDecryptedContents] = useState({});

    const { chatId, tipo, nombre } = chat;
    const esGrupo = tipo === 'GRUPO';
    const pinActual = mensajesFijados[pinActualIndex] ?? null;

    const upsertMensaje = useCallback((incoming) => {
        if (!incoming) return;

        setMensajes(prev => {
            const claveIncoming = mensajeKey(incoming);
            const idx = prev.findIndex(actual => mensajeKey(actual) === claveIncoming || (
                actual._optimista
                && incoming._optimista !== true
                && actual.emisorId === incoming.emisorId
                && (actual.parentId ?? null) === (incoming.parentId ?? null)
                && (actual.contenido === incoming.contenido || isE2E(incoming.contenido))
            ));

            if (idx === -1) {
                return [...prev, { ...incoming, reacciones: incoming.reacciones || [] }];
            }

            const actual = prev[idx];
            const combinado = {
                ...actual,
                ...incoming,
                reacciones: unirReacciones(actual.reacciones, incoming.reacciones),
            };
            delete combinado._optimista;

            const copia = [...prev];
            copia[idx] = combinado;
            return deduplicarMensajes(copia);
        });
    }, []);

    // Upsert: reemplaza cualquier reacción previa del mismo usuario+tipo (evita duplicados tmp/id)
    const agregarReaccionLocal = useCallback((messageId, reaccion) => {
        if (!messageId || !reaccion) return;
        setMensajes(prev => prev.map(msg => {
            if (msg.id != messageId) return msg;
            const sinDup = (msg.reacciones || []).filter(r =>
                !(r.tipo === reaccion.tipo && r.usuarioId == reaccion.usuarioId)
            );
            return { ...msg, reacciones: [...sinDup, reaccion] };
        }));
    }, []);

    const quitarReaccionLocal = useCallback((messageId, reaccion) => {
        if (!messageId || !reaccion) return;
        setMensajes(prev => prev.map(msg => {
            if (msg.id != messageId) return msg;
            return {
                ...msg,
                reacciones: (msg.reacciones || []).filter(r =>
                    !(r.tipo === reaccion.tipo && r.usuarioId == reaccion.usuarioId)
                ),
            };
        }));
    }, []);

    useEffect(() => {
        if (!chatId || !token) return;

        setCargando(true);
        setMensajes([]);
        setReplyTo(null);

        getUsuarios(token).then(lista => {
            const map = {};
            lista.forEach(u => { map[u.id] = u; });
            setUsuariosMap(map);
        }).catch(() => {});

        getMensajes(chatId, token)
            .then(h => {
                const lista = Array.isArray(h?.mensajes) ? h.mensajes : [];
                setMensajes(deduplicarMensajes(lista.map(m => ({ ...m, reacciones: m.reacciones || [] }))));
            })
            .catch(() => {})
            .finally(() => setCargando(false));
    
        getMensajesFijados(chatId, token)
            .then(data => {
                setMensajesFijados(Array.isArray(data) ? data : []);
            })
            .catch(() => {});

        const ws = new WebSocket(`${WS_URL}?token=${token}&ngrok-skip-browser-warning=1`);
        wsRef.current = ws;

        ws.onopen = () => { setWsConectado(true); };
        ws.onclose = () => { setWsConectado(false); };
        ws.onerror = () => { setWsConectado(false); };

        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);

                if (data?.type === 'ERROR') return;

                if (data?.type === 'REACTION_ADDED') {
                    const reaction = data.reaction;
                    if (!data.messageId || !reaction) return;
                    // Filtrar reacciones de otros chats (loose == para tolerar número vs string)
                    if (data.chatId != null && data.chatId != chatId) return;
                    agregarReaccionLocal(data.messageId, reaction);
                    return;
                }

                if (data?.type === 'REACTION_REMOVED') {
                    const reaction = data.reaction;
                    if (!data.messageId || !reaction) return;
                    if (data.chatId != null && data.chatId != chatId) return;
                    quitarReaccionLocal(data.messageId, reaction);
                    return;
                }

                if (!data?.contenido) return;
                // Filtrar mensajes de otros chats (loose != para number vs string)
                if (data.chatId != null && data.chatId != chatId) return;

                upsertMensaje({ ...data, reacciones: data.reacciones || [] });
            } catch {
                return;
            }
        };

        return () => {
            ws.close();
        };
    }, [chatId, token, upsertMensaje, agregarReaccionLocal, quitarReaccionLocal]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);
    
    useEffect(() => {
        if (pinActualIndex >= mensajesFijados.length) {
            setPinActualIndex(0);
        }
    }, [mensajesFijados, pinActualIndex]);

    // Descifrar mensajes E2E cuando llegan nuevos o cambia el mapa de usuarios
    useEffect(() => {
        if (!cryptoState?.privateKey || mensajes.length === 0) return;
        let cancelled = false;
        const decrypt = async () => {
            const nuevos = {};
            for (const m of mensajes) {
                if (!m.id || !isE2E(m.contenido)) continue;
                if (decryptedContents[m.id] !== undefined) continue;
                const senderPubKey = usuariosMap[m.emisorId]?.publicKey;
                if (!senderPubKey) continue;
                try {
                    const plain = await decryptMsg(
                        m.contenido,
                        usuarioActual?.id,
                        cryptoState.privateKey,
                        senderPubKey
                    );
                    if (plain !== null) nuevos[m.id] = plain;
                } catch { /* ignorar */ }
            }
            if (!cancelled && Object.keys(nuevos).length > 0) {
                setDecryptedContents(prev => ({ ...prev, ...nuevos }));
            }
        };
        decrypt();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mensajes, cryptoState?.privateKey, usuariosMap]);

    // Devuelve el texto a mostrar para un mensaje (descifrado si aplica)
    const getDisplayContent = (m) => {
        if (m._optimista) return m.contenido;
        if (decryptedContents[m.id] !== undefined) return decryptedContents[m.id];
        if (isE2E(m.contenido)) return '🔒 Mensaje cifrado';
        return m.contenido;
    };

    const enviar = useCallback(async () => {
        const texto = mensaje.trim();
        if (!texto) return;

        // El mensaje optimista siempre muestra el texto plano
        const msgOptimista = {
            id: null,
            contenido: texto,
            emisorId: usuarioActual?.id,
            emisorNombre: usuarioActual?.nombre,
            emisorApellido: usuarioActual?.apellido,
            fechaEnvio: new Date().toISOString(),
            parentId: replyTo?.id ?? null,
            reacciones: [],
            _optimista: true,
        };

        upsertMensaje(msgOptimista);
        setMensaje('');
        setReplyTo(null);
        inputRef.current?.focus();

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            // Cifrar si hay claves disponibles para los participantes
            let contenidoFinal = texto;
            if (cryptoState?.privateKey) {
                // Construir mapa de claves: participantIds del DTO, o fallback por tipo de chat
                let targetIds = chat.participantIds || [];
                if (targetIds.length === 0) {
                    if (!esGrupo && chat.usuarioInterlocutorId) {
                        // Chat directo: yo + el interlocutor
                        targetIds = [usuarioActual?.id, chat.usuarioInterlocutorId];
                    } else {
                        // Grupo sin lista: todos los usuarios con clave pública
                        targetIds = Object.keys(usuariosMap).map(Number);
                    }
                }
                const pubKeys = {};
                for (const uid of targetIds) {
                    const pk = usuariosMap[uid]?.publicKey;
                    if (pk) pubKeys[String(uid)] = pk;
                }
                // Mi propia clave para poder releer mis mensajes enviados
                if (cryptoState.publicKeyB64) {
                    pubKeys[String(usuarioActual?.id)] = cryptoState.publicKeyB64;
                }
                if (Object.keys(pubKeys).length >= 2) {
                    try {
                        contenidoFinal = await encryptMsg(texto, cryptoState.privateKey, pubKeys);
                    } catch { /* fallback a texto plano */ }
                }
            }

            const payload = { chatId, contenido: contenidoFinal };
            if (replyTo?.id != null) payload.parentId = replyTo.id;
            wsRef.current.send(JSON.stringify(payload));
        }
    }, [mensaje, chatId, usuarioActual, replyTo, upsertMensaje, cryptoState, chat, usuariosMap]);

    const manejarSeleccionArchivo = useCallback(async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || !chatId || !token) return;

        const max = 10 * 1024 * 1024;
        if (file.size > max) {
            setNotificacion({ open: true, mensaje: 'El archivo supera 10MB', severity: 'warning' });
            return;
        }

        try {
            setSubiendoAdjunto(true);
            await subirAdjunto(chatId, file, token, replyTo?.id ?? null);
            setReplyTo(null);
            setNotificacion({ open: true, mensaje: 'Adjunto enviado', severity: 'success' });
        } catch (e) {
            setNotificacion({ open: true, mensaje: 'No se pudo enviar el adjunto', severity: 'error' });
        } finally {
            setSubiendoAdjunto(false);
        }
    }, [chatId, token, replyTo]);

    // Sin update optimista: esperamos REACTION_ADDED/REMOVED del servidor para actualizar estado
    const reaccionar = useCallback((mensajeObjetivo, emoji) => {
        if (!mensajeObjetivo?.id || !emoji) return;
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({
            accion: 'REACCION',
            mensajeId: mensajeObjetivo.id,
            contenido: emoji,
            chatId: Number(chatId),
        }));
    }, [chatId]);

    const togglePinMensaje = async (mensajeObjetivo) => {
        if (!mensajeObjetivo?.id) return;

        const yaFijado = mensajesFijados.some(m => idMensajeFijado(m) === mensajeObjetivo.id);

        try {
            if (yaFijado) {
                await desfijarMensaje(chatId, mensajeObjetivo.id, token);

                setMensajesFijados(prev =>
                    prev.filter(m => idMensajeFijado(m) !== mensajeObjetivo.id)
                );
        
                setNotificacion({
                    open: true,
                    mensaje: 'Mensaje desfijado',
                    severity: 'success'
                });
            } else {
                await fijarMensaje(chatId, mensajeObjetivo.id, token);

                setPinAnimadoId(mensajeObjetivo.id);

                setTimeout(() => {
                    setPinAnimadoId(null);
                }, 700);

                const nuevos = await getMensajesFijados(chatId, token);
                setMensajesFijados(Array.isArray(nuevos) ? nuevos : []);
                setNotificacion({
                    open: true,
                    mensaje: 'Mensaje fijado',
                    severity: 'success'
                });
            }
        } catch (e) {
            console.error(e);

            let mensaje = 'No se pudo realizar la acción.';
            let severity = 'error';

            if (e.message.includes('400')) {
                mensaje = 'Solo se pueden fijar hasta 3 mensajes por chat.';
            } else if (e.message.includes('403')) {
                mensaje = 'No tienes permisos para fijar mensajes.';
            } else if (e.message.includes('409')) {
                mensaje = 'El mensaje ya está fijado.';
                severity = 'warning';
            }

            setNotificacion({
                open: true,
                mensaje,
                severity
            });
        }
    };
    
    const cambiarPin = (direccion) => {
        if (mensajesFijados.length <= 1) return;

        setPinVisible(false);

        setTimeout(() => {
            setPinActualIndex(prev =>
                direccion === 'next'
                    ? (prev + 1) % mensajesFijados.length
                    : (prev - 1 + mensajesFijados.length) % mensajesFijados.length
            );

            setPinVisible(true);
        }, 150);
    };

    const siguientePin = () => cambiarPin('next');
    const anteriorPin = () => cambiarPin('prev');
    
    const irAMensajeFijado = (mensajeId) => {
    const elemento = mensajeRefs.current[mensajeId];

    if (!elemento) return;

    elemento.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });

    setMensajeResaltadoId(mensajeId);

    setTimeout(() => {
        setMensajeResaltadoId(null);
        }, 1400);
    };

    const formatHora = (f) =>
        f ? new Date(f).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    const formatFecha = (f) => {
        if (!f) return '';
        const d = new Date(f);
        if (Number.isNaN(d.getTime())) return '';
        const hoy = new Date();
        if (d.toDateString() === hoy.toDateString()) return 'Hoy';
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        if (d.toDateString() === ayer.toDateString()) return 'Ayer';
        return d.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' });
    };

    const mensajeCoincideFiltros = (m) => {
        const contenido = filtros.contenido.trim().toLowerCase();
        const usuario = filtros.usuario.trim();
        const fecha = filtros.fecha;
        const textoMensaje = `${m.contenido ?? ''}`.toLowerCase();
        const textoUsuario = `${m.emisorNombre ?? ''} ${m.emisorApellido ?? ''} ${m.emisorEmail ?? ''} ${m.emisorId ?? ''}`.toLowerCase();

        if (contenido && !textoMensaje.includes(contenido)) return false;
        if (usuario && String(m.emisorId ?? '') !== usuario) return false;
        if (fecha && obtenerFechaISO(m.fechaEnvio) !== fecha) return false;
        if (!usuario && filtros.usuario.trim() && !textoUsuario.includes(usuario)) return false;
        return true;
    };

    const filtrosActivos = [filtros.contenido, filtros.fecha, filtros.usuario].filter(Boolean).length;

    const mensajesOrdenados = deduplicarMensajes([...mensajes]).sort((a, b) => fechaComparable(a.fechaEnvio) - fechaComparable(b.fechaEnvio));

    const mensajesPorId = new Map();
    for (const m of mensajesOrdenados) {
        if (m.id != null) mensajesPorId.set(m.id, m);
    }

    let mensajesVisibles = mensajesOrdenados;
    if (filtrosActivos > 0) {
        const idsVisibles = new Set();
        const visitadosDesc = new Set();

        const agregarDescendientes = (mensajeActual) => {
            if (!mensajeActual?.id || visitadosDesc.has(mensajeActual.id)) return;
            visitadosDesc.add(mensajeActual.id);
            idsVisibles.add(mensajeActual.id);

            for (const candidato of mensajesOrdenados) {
                if (candidato.parentId === mensajeActual.id) {
                    agregarDescendientes(candidato);
                }
            }
        };

        const agregarAncestros = (mensajeActual) => {
            let cursor = mensajeActual;
            const visitadosAsc = new Set();
            while (cursor?.parentId != null) {
                if (visitadosAsc.has(cursor.parentId)) break;
                visitadosAsc.add(cursor.parentId);
                const padre = mensajesPorId.get(cursor.parentId);
                if (!padre) break;
                if (padre.id != null) idsVisibles.add(padre.id);
                cursor = padre;
            }
        };

        mensajesOrdenados.filter(mensajeCoincideFiltros).forEach(mensajeActual => {
            if (mensajeActual.id != null) {
                idsVisibles.add(mensajeActual.id);
                agregarAncestros(mensajeActual);
                agregarDescendientes(mensajeActual);
            }
        });

        mensajesVisibles = mensajesOrdenados.filter(mensajeActual => {
            if (mensajeActual.id == null) return mensajeCoincideFiltros(mensajeActual);
            return idsVisibles.has(mensajeActual.id);
        });
    }

    const mensajesParaRender = mensajesVisibles.map(mensajeActual => {
        let depth = 0;
        let cursor = mensajeActual;
        const visitados = new Set();

        while (cursor?.parentId != null) {
            if (visitados.has(cursor.parentId)) break;
            visitados.add(cursor.parentId);
            const padre = mensajesPorId.get(cursor.parentId);
            if (!padre) break;
            depth += 1;
            cursor = padre;
            if (depth >= 3) break;
        }

        return { data: mensajeActual, depth };
    });

    const usuariosParaFiltro = Array.from(new Map(mensajesOrdenados.filter(m => m.emisorId).map(m => [m.emisorId, m])).values());

    const renderReacciones = (reacciones = []) => {
        const grupos = new Map();
        reacciones.forEach(reaccion => {
            const tipo = reaccion?.tipo;
            if (!tipo) return;
            const actual = grupos.get(tipo) || { tipo, count: 0, mine: false };
            actual.count += 1;
            if (reaccion.usuarioId === usuarioActual?.id) actual.mine = true;
            grupos.set(tipo, actual);
        });
        return Array.from(grupos.values());
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'white' }}>
            <Box sx={{ px: 3, py: 1.75, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <Tooltip title="Volver">
                    <IconButton size="small" onClick={onVolver} sx={{ color: '#94A3B8', mr: 0.5 }}>
                        <ArrowBackIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Avatar
                    src={!esGrupo ? (Object.values(usuariosMap).find(u => `${u.nombre} ${u.apellido}` === nombre)?.fotoPerfil || undefined) : undefined}
                    sx={{
                        width: 36,
                        height: 36,
                        bgcolor: '#2563EB',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: 13,
                        borderRadius: '50%',
                    }}
                >
                    {esGrupo
                        ? <GroupsIcon sx={{ fontSize: 18, color: '#FFFFFF' }} />
                        : nombre?.[0]}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={600} fontSize={15} color="#1E293B" noWrap>{nombre}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: wsConectado ? '#22C55E' : '#94A3B8' }} />
                        <Typography variant="caption" color="#94A3B8">
                            {wsConectado ? 'Conectado' : 'Reconectando...'}
                        </Typography>
                        {cryptoState?.privateKey && (
                            <Tooltip title="Cifrado extremo a extremo activo">
                                <Typography variant="caption" sx={{ color: '#22C55E', fontWeight: 700, ml: 0.5 }}>
                                    🔒 E2E
                                </Typography>
                            </Tooltip>
                        )}
                    </Box>
                </Box>
                <Tooltip title="Filtros">
                    <IconButton size="small" onClick={() => setBuscadorAbierto(b => !b)} sx={{ color: '#94A3B8' }}>
                        <Badge color="primary" badgeContent={filtrosActivos} invisible={filtrosActivos === 0}>
                            <SearchIcon />
                        </Badge>
                    </IconButton>
                </Tooltip>
            </Box>
            {mensajesFijados.length > 0 && pinActual && (
            <Box
                sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: 1,
                    bgcolor: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                <IconButton size="small" onClick={anteriorPin} sx={{ color: '#64748B' }}>
                    ‹
                </IconButton>

                <Fade in={pinVisible} timeout={150}>
                    <Box
                        onClick={() => irAMensajeFijado(idMensajeFijado(pinActual))}
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.25,
                            py: 0.8,
                            bgcolor: 'white',
                            border: '1px solid #E2E8F0',
                            borderRadius: 2,
                            boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
                            '&:hover': {
                                bgcolor: '#F1F5F9'
                            }
                        }}
                    >
                        <PushPinIcon sx={{ fontSize: 17, color: '#2563EB', flexShrink: 0 }} />

                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    fontWeight: 700,
                                    color: '#64748B',
                                    display: 'block',
                                    lineHeight: 1.2
                                }}
                            >
                                Fijado {pinActualIndex + 1}/{mensajesFijados.length}
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#1E293B',
                                    fontSize: 13,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                {pinActual.contenido}
                            </Typography>
                        </Box>
                    </Box>
                </Fade>

                <IconButton size="small" onClick={siguientePin} sx={{ color: '#64748B' }}>
                    ›
                </IconButton>
            </Box>
        )}
            <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 3, bgcolor: '#F8FAFC', position: 'relative' }}>
                <Collapse in={buscadorAbierto} timeout={200} unmountOnExit>
                    <Box sx={{ position: 'absolute', top: 12, right: 24, zIndex: 40, width: { xs: 'calc(100% - 48px)', sm: 360 }, p: 1.25, bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, boxShadow: '0 8px 20px rgba(2,6,23,0.08)' }}>
                        <Stack spacing={1}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Buscar por contenido"
                                value={filtros.contenido}
                                onChange={e => setFiltros(prev => ({ ...prev, contenido: e.target.value }))}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F8FAFC', borderRadius: 2 } }}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="Fecha"
                                InputLabelProps={{ shrink: true }}
                                value={filtros.fecha}
                                onChange={e => setFiltros(prev => ({ ...prev, fecha: e.target.value }))}
                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F8FAFC', borderRadius: 2 } }}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                select
                                label="Usuario"
                                value={filtros.usuario}
                                onChange={e => setFiltros(prev => ({ ...prev, usuario: e.target.value }))}
                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F8FAFC', borderRadius: 2 } }}
                            >
                                <MenuItem value="">Todos los usuarios</MenuItem>
                                {usuariosParaFiltro.map(usuario => (
                                    <MenuItem key={usuario.emisorId} value={String(usuario.emisorId)}>
                                        {formatNombreMensaje(usuario)}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Stack>

                        {(filtros.contenido || filtros.fecha || filtros.usuario) && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.25 }}>
                                {filtros.contenido && (
                                    <Chip
                                        label={`Contenido: ${filtros.contenido}`}
                                        size="small"
                                        onDelete={() => setFiltros(prev => ({ ...prev, contenido: '' }))}
                                    />
                                )}
                                {filtros.fecha && (
                                    <Chip
                                        label={`Fecha: ${filtros.fecha}`}
                                        size="small"
                                        onDelete={() => setFiltros(prev => ({ ...prev, fecha: '' }))}
                                    />
                                )}
                                {filtros.usuario && (
                                    <Chip
                                        label={`Usuario: ${usuariosParaFiltro.find(u => String(u.emisorId) === filtros.usuario)?.emisorNombre ?? filtros.usuario}`}
                                        size="small"
                                        onDelete={() => setFiltros(prev => ({ ...prev, usuario: '' }))}
                                    />
                                )}
                                <Chip
                                    icon={<ClearIcon />}
                                    label="Limpiar filtros"
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setFiltros({ contenido: '', fecha: '', usuario: '' })}
                                />
                            </Box>
                        )}
                    </Box>
                </Collapse>

                {cargando ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                        <CircularProgress size={28} sx={{ color: '#2563EB' }} />
                    </Box>
                ) : mensajesParaRender.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 10 }}>
                        <Typography variant="body2" color="#94A3B8">
                            {mensajes.length === 0
                                ? 'Aún no hay mensajes. ¡Empezá la conversación!'
                                : 'No hay resultados para los filtros actuales.'}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {(() => {
                            let fechaRenderActual = null;
                            return mensajesParaRender.map((item, i) => {
                                const m = item.data;
                                const depth = item.depth || 0;
                                const propio = m.emisorId === usuarioActual?.id;
                                const mensajePadre = m.parentId != null ? mensajesPorId.get(m.parentId) : null;
                                const resumenReacciones = renderReacciones(m.reacciones || []);
                                const estaFijado = mensajesFijados.some(p => idMensajeFijado(p) === m.id);
                                const animandoPin = pinAnimadoId === m.id;
                                const etiquetaFecha = formatFecha(m.fechaEnvio);
                                const mostrarSeparador = etiquetaFecha !== fechaRenderActual;
                                fechaRenderActual = etiquetaFecha;

                                return (
                                    <Box
                                        key={m.id ?? m._key ?? i}
                                        ref={(el) => {
                                            if (m.id != null && el) {
                                                mensajeRefs.current[m.id] = el;
                                            }
                                        }}
                                        sx={{ mb: 1.5 }}
                                    >
                                        {mostrarSeparador && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
                                                <Box sx={{ flex: 1, height: 1, bgcolor: '#E2E8F0' }} />
                                                <Typography fontSize={11} color="#94A3B8" fontWeight={500}>{etiquetaFecha}</Typography>
                                                <Box sx={{ flex: 1, height: 1, bgcolor: '#E2E8F0' }} />
                                            </Box>
                                        )}

                                        <Box sx={{ display: 'flex', justifyContent: propio ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 1, pl: depth ? 2 : 0 }}>
                                            {!propio && (
                                                <Avatar
                                                    src={usuariosMap[m.emisorId]?.fotoPerfil || undefined}
                                                    sx={{ width: 26, height: 26, fontSize: 10, fontWeight: 700, bgcolor: '#334155', mb: 0.25, flexShrink: 0 }}
                                                >
                                                    {!usuariosMap[m.emisorId]?.fotoPerfil && (m.emisorNombre?.[0] || '?')}
                                                </Avatar>
                                            )}
                                            <Box
                                                onMouseEnter={() => setAccionesMensajeId(m.id)}
                                                onMouseLeave={() => setAccionesMensajeId(null)}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    setAccionesMensajeId(prev => prev === m.id ? null : m.id);
                                                }}
                                                onTouchStart={() => {
                                                    clearTimeout(window.longPressTimer);
                                                    window.longPressTimer = setTimeout(() => {
                                                        setAccionesMensajeId(prev => prev === m.id ? null : m.id);
                                                    }, 450);
                                                }}
                                                onTouchEnd={() => {
                                                    clearTimeout(window.longPressTimer);
                                                }}
                                                sx={{ maxWidth: { xs: '90%', sm: '65%' }, width: 'fit-content' }}
                                            >
                                                {esGrupo && !propio && (
                                                    <Typography fontSize={11} fontWeight={600} color="#64748B" sx={{ mb: 0.25, px: 0.5 }}>
                                                        {m.emisorNombre} {m.emisorApellido}
                                                    </Typography>
                                                )}

{mensajePadre ? (
                                    <Box sx={{ mb: 0.75, p: 1, borderLeft: '3px solid #2563EB', bgcolor: 'rgba(37,99,235,0.06)', borderRadius: 1.5 }}>
                                        <Typography variant="caption" sx={{ display: 'block', color: '#2563EB', fontWeight: 700 }}>
                                            En respuesta a {formatNombreMensaje(mensajePadre)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {mensajePadre.contenido}
                                        </Typography>
                                    </Box>
                                ) : m.parentId != null && m.parentContenido ? (
                                    <Box sx={{ mb: 0.75, p: 1, borderLeft: '3px solid #2563EB', bgcolor: 'rgba(37,99,235,0.06)', borderRadius: 1.5 }}>
                                        <Typography variant="caption" sx={{ display: 'block', color: '#2563EB', fontWeight: 700 }}>
                                            En respuesta a {m.parentEmisorNombre || 'Usuario'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {m.parentContenido}
                                        </Typography>
                                    </Box>
                                ) : null}

                                                <Box sx={{
                                                    px: 2, py: 1,
                                                    bgcolor: propio ? '#2563EB' : 'white',
                                                    border: mensajeResaltadoId === m.id
                                                        ? '2px solid #F59E0B'
                                                        : '1px solid transparent',
                                                    color: propio ? 'white' : '#1E293B',
                                                    borderRadius: propio ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                    boxShadow: mensajeResaltadoId === m.id
                                                        ? '0 0 0 4px rgba(245,158,11,0.22), 0 8px 18px rgba(245,158,11,0.25)'
                                                        : '0 1px 3px rgba(0,0,0,0.07)',
                                                    opacity: m._optimista ? 0.75 : 1,
                                                    transform: mensajeResaltadoId === m.id
                                                        ? 'scale(1.03)'
                                                        : 'scale(1)',
                                                    position: 'relative',
                                                    py: 1,
                                                    transition: 'all 0.25s ease',
                                                }}>
                                                    {(m.tipo === 'IMAGEN' && m.adjuntoUrl) ? (
                                                        <Box>
                                                            <Box
                                                                component="img"
                                                                src={construirAdjuntoUrl(m, token)}
                                                                alt={m.adjuntoNombre || 'imagen'}
                                                                sx={{ display: 'block', maxWidth: { xs: 220, sm: 320 }, maxHeight: 280, borderRadius: 2, mb: 0.5, cursor: 'pointer' }}
                                                                onClick={() => window.open(construirAdjuntoUrl(m, token), '_blank')}
                                                            />
                                                            <Typography variant="caption" sx={{ color: propio ? 'rgba(255,255,255,0.85)' : '#64748B' }}>
                                                                {m.adjuntoNombre || 'Imagen'}
                                                            </Typography>
                                                        </Box>
                                                    ) : (m.tipo === 'VIDEO' && m.adjuntoUrl) ? (
                                                        <Box>
                                                            <Box
                                                                component="video"
                                                                src={construirAdjuntoUrl(m, token)}
                                                                controls
                                                                sx={{ display: 'block', maxWidth: { xs: 240, sm: 360 }, maxHeight: 280, borderRadius: 2, mb: 0.5, bgcolor: '#000' }}
                                                            />
                                                            <Typography variant="caption" sx={{ color: propio ? 'rgba(255,255,255,0.85)' : '#64748B' }}>
                                                                {m.adjuntoNombre || 'Video'}
                                                            </Typography>
                                                        </Box>
                                                    ) : (m.tipo === 'ARCHIVO' && m.adjuntoUrl) ? (
                                                        <Box>
                                                            <Typography variant="body2" sx={{ lineHeight: 1.55, fontSize: 14, fontWeight: 600 }}>
                                                                {m.adjuntoNombre || m.contenido || 'Archivo'}
                                                            </Typography>
                                                            <Typography
                                                                component="a"
                                                                href={construirAdjuntoUrl(m, token)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                sx={{ display: 'inline-block', mt: 0.5, fontSize: 12, color: propio ? '#DBEAFE' : '#2563EB', textDecoration: 'underline' }}
                                                            >
                                                                Abrir / descargar
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="body2" sx={{ lineHeight: 1.55, fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                            {getDisplayContent(m)}
                                                        </Typography>
                                                    )}
                                                </Box>

                                                {resumenReacciones.length > 0 && (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75, px: 0.5 }}>
                                                        {resumenReacciones.map(reaccion => (
                                                            <Chip
                                                                key={`${m.id}-${reaccion.tipo}`}
                                                                size="small"
                                                                label={`${reaccion.tipo} ${reaccion.count}`}
                                                                onClick={() => reaccionar(m, reaccion.tipo)}
                                                                variant={reaccion.mine ? 'filled' : 'outlined'}
                                                                sx={{
                                                                    height: 24,
                                                                    fontSize: 13,
                                                                    cursor: 'pointer',
                                                                    bgcolor: reaccion.mine ? 'rgba(37,99,235,0.15)' : 'white',
                                                                    borderColor: reaccion.mine ? '#2563EB' : '#E2E8F0',
                                                                    fontWeight: reaccion.mine ? 700 : 400,
                                                                    '&:hover': { bgcolor: 'rgba(37,99,235,0.1)' },
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                )}

                                                <Stack
                                                    direction="row"
                                                    spacing={0.5}
                                                    sx={{
                                                        mt: accionesMensajeId === m.id ? 0.75 : 0,
                                                        maxHeight: accionesMensajeId === m.id ? 40 : 0,
                                                        opacity: accionesMensajeId === m.id ? 1 : 0,
                                                        overflow: 'hidden',
                                                        flexWrap: 'wrap',
                                                        alignItems: 'center',
                                                        pointerEvents: accionesMensajeId === m.id ? 'auto' : 'none',
                                                        transform: accionesMensajeId === m.id
                                                            ? 'translateY(0)'
                                                            : 'translateY(-4px)',
                                                        transition: 'all 0.18s ease',
                                                    }}
                                                >
                                                    <Tooltip title="Responder">
                                                        <IconButton size="small" onClick={() => setReplyTo(m)} sx={{ color: '#94A3B8', bgcolor: 'rgba(148,163,184,0.08)', '&:hover': { bgcolor: 'rgba(37,99,235,0.08)', color: '#2563EB' } }}>
                                                            <ReplyIcon sx={{ fontSize: 15 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title={estaFijado ? 'Desfijar mensaje' : 'Fijar mensaje'}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => togglePinMensaje(m)}
                                                            sx={{
                                                                color: estaFijado ? '#2563EB' : '#94A3B8',
                                                                bgcolor: estaFijado
                                                                    ? 'rgba(37,99,235,0.10)'
                                                                    : 'rgba(148,163,184,0.08)',
                                                                transform: animandoPin ? 'scale(1.25) rotate(-12deg)' : 'scale(1)',
                                                                transition: 'all 0.25s ease',
                                                                '&:hover': {
                                                                    bgcolor: 'rgba(37,99,235,0.12)',
                                                                    color: '#2563EB'
                                                                }
                                                            }}
                                                        >
                                                            <PushPinIcon sx={{ fontSize: 15 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {REACCIONES_RAPIDAS.map(emoji => (
                                                        <Tooltip key={`${m.id}-${emoji}`} title={`Reaccionar con ${emoji}`}>
                                                            <IconButton size="small" onClick={() => reaccionar(m, emoji)} sx={{ fontSize: 13, width: 28, height: 28, bgcolor: 'white', border: '1px solid #E2E8F0', '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' } }}>
                                                                {emoji}
                                                            </IconButton>
                                                        </Tooltip>
                                                    ))}
                                                </Stack>

                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: propio ? 'flex-end' : 'flex-start',
                                                        gap: 0.4,
                                                        mt: 0.4,
                                                        px: 0.5,
                                                        color: '#94A3B8',
                                                    }}
                                                >
                                                    {estaFijado && (
                                                        <PushPinIcon
                                                            sx={{
                                                                fontSize: 12,
                                                                color: '#94A3B8',
                                                                transform: 'rotate(-20deg)',
                                                            }}
                                                        />
                                                    )}

                                                    <Typography variant="caption" sx={{ fontSize: 11, color: '#94A3B8' }}>
                                                        {formatHora(m.fechaEnvio)}
                                                        {m._optimista && ' · enviando...'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                );
                            });
                        })()}
                        <div ref={bottomRef} />
                    </>
                )}
            </Box>

            <Box sx={{ px: 3, py: 2, bgcolor: 'white', borderTop: '1px solid #E2E8F0' }}>
                {replyTo && (
                    <Box sx={{ mb: 1, p: 1, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" sx={{ display: 'block', color: '#2563EB', fontWeight: 700 }}>
                                Respondiendo a {formatNombreMensaje(replyTo)}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {replyTo.contenido}
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setReplyTo(null)} sx={{ color: '#94A3B8', flexShrink: 0 }}>
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#F1F5F9', borderRadius: 3, px: 2, py: 0.5, border: '1px solid #E2E8F0' }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        style={{ display: 'none' }}
                        onChange={manejarSeleccionArchivo}
                    />
                    <IconButton
                        onClick={() => fileInputRef.current?.click()}
                        disabled={subiendoAdjunto}
                        size="small"
                        sx={{
                            width: 34,
                            height: 34,
                            color: subiendoAdjunto ? '#94A3B8' : '#2563EB',
                            flexShrink: 0
                        }}
                    >
                        <AttachFileIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <TextField
                        inputRef={inputRef}
                        fullWidth
                        placeholder={`Mensaje en ${nombre}...`}
                        value={mensaje}
                        onChange={e => setMensaje(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                        variant="standard"
                        multiline
                        maxRows={4}
                        InputProps={{ disableUnderline: true }}
                        sx={{ '& .MuiInputBase-input': { py: 1, fontSize: 14, color: '#1E293B' } }}
                    />
                    <IconButton
                        onClick={enviar}
                        disabled={!mensaje.trim() || subiendoAdjunto}
                        size="small"
                        sx={{ width: 34, height: 34, bgcolor: (mensaje.trim() && !subiendoAdjunto) ? '#2563EB' : 'transparent', color: (mensaje.trim() && !subiendoAdjunto) ? 'white' : '#CBD5E1', '&:hover': { bgcolor: (mensaje.trim() && !subiendoAdjunto) ? '#1D4ED8' : 'transparent' }, '&.Mui-disabled': { bgcolor: 'transparent', color: '#CBD5E1' }, transition: 'all 0.15s', flexShrink: 0 }}
                    >
                        <SendIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                </Box>
            </Box>
            <Snackbar
                open={notificacion.open}
                autoHideDuration={3000}
                onClose={() => setNotificacion(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={notificacion.severity}
                    variant="filled"
                    onClose={() => setNotificacion(prev => ({ ...prev, open: false }))}
                >
                    {notificacion.mensaje}
                </Alert>
            </Snackbar>
        </Box>
    );
}
