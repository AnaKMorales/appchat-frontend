import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, TextField, IconButton, Avatar, CircularProgress, Tooltip, InputAdornment, Chip, MenuItem, Collapse, Badge } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import TuneIcon from '@mui/icons-material/Tune';
import { getMensajes } from '../services/api';

import CONFIG from '../services/config';
const WS_URL = CONFIG.WS_URL;


export default function Chat({ token, chat, usuarioActual, onVolver }) {
    const [mensaje, setMensaje] = useState('');
    const [mensajes, setMensajes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [wsConectado, setWsConectado] = useState(false);
    const [filtros, setFiltros] = useState({ contenido: '', fecha: '', usuario: '' });
    const [buscadorAbierto, setBuscadorAbierto] = useState(false);
    const wsRef = useRef(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const idSetRef = useRef(new Set()); // evitar duplicados

    const { chatId, tipo, nombre } = chat;
    const esGrupo = tipo === 'GRUPO';

    const agregarMensaje = useCallback((msg) => {
        if (!msg || !msg.contenido) return;
        const key = msg.id ?? `tmp-${msg.contenido}-${msg.fechaEnvio}`;
        if (idSetRef.current.has(key)) return;
        idSetRef.current.add(key);
        setMensajes(prev => [...prev, msg]);
    }, []);

    useEffect(() => {
        if (!chatId || !token) return;
        setCargando(true);
        setMensajes([]);
        idSetRef.current = new Set();

        getMensajes(chatId, token)
            .then(h => {
                const lista = h?.mensajes || [];
                lista.forEach(m => idSetRef.current.add(m.id ?? m));
                setMensajes(lista);
            })
            .catch(() => {})
            .finally(() => setCargando(false));

        const ws = new WebSocket(`${WS_URL}?token=${token}`);
        ws.chatId = chatId;
        wsRef.current = ws;

        ws.onopen = () => { setWsConectado(true); };
        ws.onclose = () => { setWsConectado(false); };
        ws.onerror = () => { setWsConectado(false); };

        ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                if (msg.type === 'ERROR') return;
                // el servidor no incluye chatId en MensajeDTO, así que aceptamos todo mensaje con contenido
                if (!msg.contenido) return;
                // si tiene chatId explícito y no coincide, ignorar
                if (msg.chatId && msg.chatId !== chatId) return;

                setMensajes(prev => {
                    // reemplazar mensaje optimista propio si el contenido coincide
                    const idx = prev.findIndex(m => m._optimista && m.contenido === msg.contenido && m.emisorId === msg.emisorId);
                    if (idx !== -1) {
                        const nueva = [...prev];
                        nueva[idx] = msg;
                        idSetRef.current.add(msg.id);
                        return nueva;
                    }
                    // mensaje nuevo de otro usuario
                    if (msg.id && idSetRef.current.has(msg.id)) return prev;
                    if (msg.id) idSetRef.current.add(msg.id);
                    return [...prev, msg];
                });
            } catch {}
        };

        return () => { ws.close(); };
    }, [chatId, token, agregarMensaje]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    const enviar = useCallback(() => {
        const texto = mensaje.trim();
        if (!texto) return;

        // Mostrar inmediatamente en pantalla (optimistic update)
        const msgOptimista = {
            id: null,
            contenido: texto,
            emisorId: usuarioActual?.id,
            emisorNombre: usuarioActual?.nombre,
            emisorApellido: usuarioActual?.apellido,
            fechaEnvio: new Date().toISOString(),
            _optimista: true,
        };
        const keyOpt = `opt-${Date.now()}`;
        idSetRef.current.add(keyOpt);
        msgOptimista._key = keyOpt;
        setMensajes(prev => [...prev, msgOptimista]);
        setMensaje('');
        inputRef.current?.focus();

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ chatId, contenido: texto }));
        }
    }, [mensaje, chatId, usuarioActual]);

    const formatHora = (f) =>
        f ? new Date(f).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    const formatFecha = (f) => {
        if (!f) return '';
        const d = new Date(f);
        const hoy = new Date();
        if (d.toDateString() === hoy.toDateString()) return 'Hoy';
        const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
        if (d.toDateString() === ayer.toDateString()) return 'Ayer';
        return d.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' });
    };

    const obtenerFechaISO = (f) => {
        if (!f) return '';
        const d = new Date(f);
        if (Number.isNaN(d.getTime())) return '';
        return d.toISOString().slice(0, 10);
    };

    const usuariosUnicos = Array.from(
        new Map(
            mensajes
                .filter(m => m.emisorId)
                .map(m => [
                    m.emisorId,
                    {
                        id: m.emisorId,
                        nombre: `${m.emisorNombre ?? ''} ${m.emisorApellido ?? ''}`.trim() || m.emisorEmail || 'Usuario',
                    },
                ])
        ).values()
    );

    const mensajesFiltrados = mensajes.filter((m) => {
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
    });

    const filtrosActivos = [filtros.contenido, filtros.fecha, filtros.usuario].filter(Boolean).length;

    // Agrupar por fecha
    const agrupados = [];
    let fechaActual = null;
    for (const m of mensajesFiltrados) {
        const f = formatFecha(m.fechaEnvio);
        if (f !== fechaActual) {
            agrupados.push({ type: 'sep', label: f });
            fechaActual = f;
        }
        agrupados.push({ type: 'msg', data: m });
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'white' }}>
            {/* Header */}
            <Box sx={{ px: 3, py: 1.75, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <Tooltip title="Volver">
                    <IconButton size="small" onClick={onVolver} sx={{ color: '#94A3B8', mr: 0.5 }}>
                        <ArrowBackIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Avatar
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
                <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={600} fontSize={15} color="#1E293B">{nombre}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: wsConectado ? '#22C55E' : '#94A3B8' }} />
                        <Typography variant="caption" color="#94A3B8">
                            {wsConectado ? 'Conectado' : 'Reconectando...'}
                        </Typography>
                    </Box>
                </Box>
                <Tooltip title="Filtros">
                    <IconButton size="small" onClick={() => setBuscadorAbierto(b => !b)} sx={{ color: '#94A3B8' }}>
                        <Badge color="primary" badgeContent={filtrosActivos} invisible={filtrosActivos === 0}>
                            <TuneIcon />
                        </Badge>
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Mensajes */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 3, bgcolor: '#F8FAFC', position: 'relative' }}>
                <Collapse in={buscadorAbierto} timeout={200} unmountOnExit>
                    <Box sx={{ position: 'absolute', top: 12, right: 24, zIndex: 40, width: { xs: 'calc(100% - 48px)', sm: 360 }, p: 1.25, bgcolor: 'white', border: '1px solid #E2E8F0', borderRadius: 2, boxShadow: '0 8px 20px rgba(2,6,23,0.08)' }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr)' }, gap: 1 }}>
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
                                {usuariosUnicos.map(usuario => (
                                    <MenuItem key={usuario.id} value={String(usuario.id)}>
                                        {usuario.nombre}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
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
                                        label={`Usuario: ${usuariosUnicos.find(u => String(u.id) === filtros.usuario)?.nombre || filtros.usuario}`}
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
                ) : agrupados.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 10 }}>
                        <Typography variant="body2" color="#94A3B8">
                            {mensajes.length === 0
                                ? 'Aún no hay mensajes. ¡Empezá la conversación!'
                                : 'No hay resultados para los filtros actuales.'}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {agrupados.map((item, i) => {
                            if (item.type === 'sep') return (
                                <Box key={`sep-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
                                    <Box sx={{ flex: 1, height: 1, bgcolor: '#E2E8F0' }} />
                                    <Typography fontSize={11} color="#94A3B8" fontWeight={500}>{item.label}</Typography>
                                    <Box sx={{ flex: 1, height: 1, bgcolor: '#E2E8F0' }} />
                                </Box>
                            );
                            const m = item.data;
                            const propio = m.emisorId === usuarioActual?.id;
                            return (
                                <Box key={m.id ?? m._key ?? i} sx={{ display: 'flex', justifyContent: propio ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 1, mb: 1.5 }}>
                                    {!propio && (
                                        <Avatar sx={{ width: 26, height: 26, fontSize: 10, fontWeight: 700, bgcolor: '#334155', mb: 0.25, flexShrink: 0 }}>
                                            {m.emisorNombre?.[0] || '?'}
                                        </Avatar>
                                    )}
                                    <Box sx={{ maxWidth: '65%' }}>
                                        {esGrupo && !propio && (
                                            <Typography fontSize={11} fontWeight={600} color="#64748B" sx={{ mb: 0.25, px: 0.5 }}>
                                                {m.emisorNombre} {m.emisorApellido}
                                            </Typography>
                                        )}
                                        <Box sx={{
                                            px: 2, py: 1,
                                            bgcolor: propio ? '#2563EB' : 'white',
                                            color: propio ? 'white' : '#1E293B',
                                            borderRadius: propio ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                                            opacity: m._optimista ? 0.75 : 1,
                                        }}>
                                            <Typography variant="body2" sx={{ lineHeight: 1.55, fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                {m.contenido}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{ display: 'block', color: '#94A3B8', fontSize: 11, mt: 0.4, textAlign: propio ? 'right' : 'left', px: 0.5 }}>
                                            {formatHora(m.fechaEnvio)}
                                            {m._optimista && ' · enviando...'}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                        <div ref={bottomRef} />
                    </>
                )}
            </Box>

            {/* Input */}
            <Box sx={{ px: 3, py: 2, bgcolor: 'white', borderTop: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#F1F5F9', borderRadius: 3, px: 2, py: 0.5, border: '1px solid #E2E8F0' }}>
                    <TextField
                        inputRef={inputRef}
                        fullWidth
                        placeholder={`Mensaje en ${nombre}...`}
                        value={mensaje}
                        onChange={e => setMensaje(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                        variant="standard"
                        multiline maxRows={4}
                        InputProps={{ disableUnderline: true }}
                        sx={{ '& .MuiInputBase-input': { py: 1, fontSize: 14, color: '#1E293B' } }}
                    />
                    <IconButton onClick={enviar} disabled={!mensaje.trim()} size="small"
                        sx={{ width: 34, height: 34, bgcolor: mensaje.trim() ? '#2563EB' : 'transparent', color: mensaje.trim() ? 'white' : '#CBD5E1', '&:hover': { bgcolor: mensaje.trim() ? '#1D4ED8' : 'transparent' }, '&.Mui-disabled': { bgcolor: 'transparent', color: '#CBD5E1' }, transition: 'all 0.15s', flexShrink: 0 }}>
                        <SendIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
}
