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

const VISTAS = {
  dashboard:   { component: Dashboard,   roles: ['admin', 'cajero', 'mesero', 'cocinero'] },
  usuarios:    { component: Usuarios,    roles: ['admin'] },
  roles:       { component: Roles,       roles: ['admin'] },
  suministros: { component: Suministros, roles: ['admin', 'cajero', 'cocinero'] },
  menu:        { component: Menu,        roles: ['admin', 'cajero'] },
  recetas:     { component: Recetas,     roles: ['admin'] },
  reportes:    { component: Reportes,    roles: ['admin', 'cajero'] },
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
