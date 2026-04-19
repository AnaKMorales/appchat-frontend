import { useState, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import { getUsuarios } from './services/api';

function decodeJwtEmail(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub;
    } catch {
        return null;
    }
}

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [usuarioActual, setUsuarioActual] = useState(null);

    useEffect(() => {
        if (!token) return;
        const email = decodeJwtEmail(token);
        if (!email) return;

        getUsuarios(token)
            .then(usuarios => {
                const yo = usuarios.find(u => u.email === email);
                if (yo) setUsuarioActual(yo);
            })
            .catch(() => {});
    }, [token]);

    const handleLogin = (nuevoToken) => {
        setToken(nuevoToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUsuarioActual(null);
    };

    if (!token) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <Layout
            token={token}
            usuarioActual={usuarioActual}
            onLogout={handleLogout}
        />
    );
}

export default App;
