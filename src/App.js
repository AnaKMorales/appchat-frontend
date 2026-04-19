import { useState } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

    if (!token) {
        return <Login onLogin={setToken} />;
    }

    return (
        <Layout onSeleccionarUsuario={setUsuarioSeleccionado} />
    );
}

export default App;