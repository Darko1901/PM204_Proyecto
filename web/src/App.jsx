import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { Login }       from './components/Login';
import { Sidebar }     from './components/Sidebar';
import { Layout }      from './components/Layout';
import { Dashboard }   from './components/Dashboard';
import { Usuarios }    from './components/Usuarios';
import { Roles }       from './components/Roles';
import { Suministros } from './components/Suministros';
import { Menu }        from './components/Menu';
import { Recetas }     from './components/Recetas';
import { Reportes }    from './components/Reportes';

// El portal completo es exclusivo para administrador (ver AuthContext /
// api/app/routers/auth.py), así que aquí ya no se filtra por rol.
const VISTAS = {
  dashboard:   { component: Dashboard },
  usuarios:    { component: Usuarios },
  roles:       { component: Roles },
  suministros: { component: Suministros },
  menu:        { component: Menu },
  recetas:     { component: Recetas },
  reportes:    { component: Reportes },
};

const Shell = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 14 }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
        <p style={{ color: 'var(--text-light)' }}>Iniciando sistema...</p>
      </div>
    );
  }

  if (!user) return <Login />;

  // Panel completo — acceso total para el administrador
  const vista = VISTAS[activeTab];
  const Comp  = vista?.component || Dashboard;

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onNavigate={setActiveTab} />
      <div className="main-area">
        <Layout activeTab={activeTab}>
          <Comp />
        </Layout>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
