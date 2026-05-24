import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
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

  return (
    <BrowserRouter>
      <Routes>
        {!token ? (
          <>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <>
            <Route path="/*" element={
              <Layout
                token={token}
                usuarioActual={usuarioActual}
                setUsuarioActual={setUsuarioActual}
                onLogout={handleLogout}
              />
            } />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;