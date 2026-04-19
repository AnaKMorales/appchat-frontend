import { useState, useEffect } from 'react';
import { 
    Box, TextField, List, ListItem, 
    ListItemText, ListItemAvatar, Avatar, 
    Typography, Chip 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const BASE_URL = 'http://localhost:8080/appchat/api';

export default function Buscador({ onSeleccionarUsuario }) {
    const [query, setQuery] = useState('');
    const [usuarios, setUsuarios] = useState([]);
    const [todos, setTodos] = useState([]);

    useEffect(() => {
        fetch(`${BASE_URL}/usuarios`)
            .then(res => res.json())
            .then(data => {
                setTodos(data);
                setUsuarios(data);
            });
    }, []);

    const handleBuscar = (valor) => {
        setQuery(valor);
        if (valor.trim() === '') {
            setUsuarios(todos);
        } else {
            const filtrados = todos.filter(u =>
                u.nombre.toLowerCase().includes(valor.toLowerCase()) ||
                u.apellido.toLowerCase().includes(valor.toLowerCase()) ||
                u.email.toLowerCase().includes(valor.toLowerCase())
            );
            setUsuarios(filtrados);
        }
    };

    const colorEstado = (estado) => {
        switch (estado) {
            case 'EN_LINEA': return 'success';
            case 'OCUPADO': return 'warning';
            case 'INVISIBLE': return 'default';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <TextField
                fullWidth
                placeholder="Buscar por nombre o email..."
                value={query}
                onChange={e => handleBuscar(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'grey.500' }} /> }}
                sx={{ mb: 2 }}
            />
            {usuarios.length === 0 && (
                <Typography color="text.secondary" textAlign="center">
                    No se encontraron usuarios
                </Typography>
            )}
            <List>
                {usuarios.map(u => (
                    <ListItem 
                        key={u.id} 
                        button 
                        onClick={() => onSeleccionarUsuario && onSeleccionarUsuario(u)}
                        sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: 'grey.100' } }}
                    >
                        <ListItemAvatar>
                            <Avatar>{u.nombre[0]}{u.apellido[0]}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={`${u.nombre} ${u.apellido}`}
                            secondary={u.email}
                        />
                        <Chip 
                            label={u.estado} 
                            color={colorEstado(u.estado)} 
                            size="small" 
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}