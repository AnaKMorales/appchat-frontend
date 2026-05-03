import { useState, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import { getUsuarios } from './services/api';

function decodeJwtEmail(token) {
    try { return JSON.parse(atob(token.split('.')[1])).sub; }
    catch { return null; }
}

function App() {
    const [token, setToken] = useState(null);
    const [usuarioActual, setUsuarioActual] = useState(null);

    useEffect(() => {
        if (!token) { setUsuarioActual(null); return; }
        const email = decodeJwtEmail(token);
        if (!email) return;
        getUsuarios(token)
            .then(usuarios => {
                const yo = usuarios.find(u => u.email === email);
                if (yo) setUsuarioActual(yo);
            })
            .catch(() => {});
    }, [token]);

    const handleLogin = (t) => { localStorage.setItem('token', t); setToken(t); };
    if (!token) return <Login onLogin={handleLogin} />;
    
    return (
        <Layout
            token={token}
            usuarioActual={usuarioActual}
            onLogout={() => { setToken(null); setUsuarioActual(null); }}
        />
    );
}

export default App;
