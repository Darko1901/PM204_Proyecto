import React from 'react';
import { useAuth } from '../AuthContext';

const PAGE_TITLES = {
  dashboard:   { title: 'Dashboard',   sub: 'Bienvenido al panel de administración' },
  usuarios:    { title: 'Usuarios',    sub: 'Gestión de usuarios del sistema' },
  roles:       { title: 'Roles',       sub: 'Administración de roles y permisos' },
  suministros: { title: 'Suministros', sub: 'Control de inventario' },
  menu:        { title: 'Menú',        sub: 'Gestión de productos y categorías' },
  recetas:     { title: 'Recetas',     sub: 'Administración de recetas' },
  reportes:    { title: 'Reportes',    sub: 'Análisis y estadísticas' },
};

export const Layout = ({ activeTab, children }) => {
  const { user } = useAuth();
  if (!user) return null;

  const page = PAGE_TITLES[activeTab] || { title: activeTab, sub: '' };
  const initials = user.nombre_completo
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <>
      {/* Top Header */}
      <header className="top-header">
        <div className="header-title">
          <h1>{page.title}</h1>
          <p>{page.sub}</p>
        </div>
        <div className="header-user">
          <div className="header-user-info">
            <div className="name">{user.nombre_completo}</div>
            <div className="email">{user.correo}</div>
          </div>
          <div className="avatar">{initials}</div>
        </div>
      </header>

      {/* Page content */}
      <main className="page-content fade-in">
        {children}
      </main>
    </>
  );
};
