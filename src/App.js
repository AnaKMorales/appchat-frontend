import { useState, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import { getUsuarios } from './services/api';

function decodeJwt(token) {
    try { return JSON.parse(atob(token.split('.')[1])); }
    catch { return null; }
}

function App() {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [usuarioActual, setUsuarioActual] = useState(null);

    useEffect(() => {
        if (!token) { setUsuarioActual(null); return; }
        const payload = decodeJwt(token);
        if (!payload) return;
        const email = payload.sub;
        getUsuarios(token)
            .then(usuarios => {
                const yo = usuarios.find(u => u.email === email);
                if (yo) setUsuarioActual(yo);
            })
            .catch(() => { handleLogout(); });
    }, [token]);

    const handleLogin = (t) => {
        localStorage.setItem('token', t);
        setToken(t);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUsuarioActual(null);
    };

    if (!token) return <Login onLogin={handleLogin} />;

    return (
        <Layout
            token={token}
            usuarioActual={usuarioActual}
            setUsuarioActual={setUsuarioActual}
            onLogout={handleLogout}
        />
    );
}

export default App;