import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Layout from './components/Layout';
import { getUsuarios, guardarPublicKey } from './services/api';
import { initKeys } from './services/crypto';

function decodeJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch { return null; }
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [cryptoState, setCryptoState] = useState(null);

  useEffect(() => {
    if (!token) { setUsuarioActual(null); setCryptoState(null); return; }
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

  // Inicializar claves E2E cuando el usuario está disponible
  useEffect(() => {
    if (!usuarioActual || !token) return;
    initKeys(usuarioActual.id)
      .then(async (keys) => {
        setCryptoState(keys);
        console.log('[E2E] Keys initialized, publicKeyB64 (primeros 40 chars):', keys.publicKeyB64?.substring(0, 40));
        console.log('[E2E] usuarioActual.publicKey en DB:', usuarioActual.publicKey?.substring(0, 40) ?? 'NULL');
        // Subir la clave pública si cambió o no estaba registrada
        if (keys.publicKeyB64 !== usuarioActual.publicKey) {
          console.log('[E2E] Guardando nueva publicKey en servidor...');
          try {
            await guardarPublicKey(usuarioActual.id, keys.publicKeyB64, token);
            console.log('[E2E] publicKey guardada OK');
          } catch(e) {
            console.error('[E2E] ERROR al guardar publicKey:', e?.message ?? e);
          }
        } else {
          console.log('[E2E] publicKey ya actualizada, no se necesita subir');
        }
      })
      .catch((e) => { console.error('[E2E] initKeys falló:', e); });
  }, [usuarioActual?.id, token]);

  const handleLogin = (t) => {
    localStorage.setItem('token', t);
    setToken(t);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUsuarioActual(null);
    setCryptoState(null);
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
                cryptoState={cryptoState}
              />
            } />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;