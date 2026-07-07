import React from 'react';
import { useAuth } from '../AuthContext';
import {
  LayoutDashboard, Users, Shield, Package, Coffee, BookOpen, BarChart2, LogOut
} from 'lucide-react';

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'usuarios',    label: 'Usuarios',     icon: Users           },
  { id: 'roles',       label: 'Roles',        icon: Shield          },
  { id: 'suministros', label: 'Suministros',  icon: Package         },
  { id: 'menu',        label: 'Menú',         icon: Coffee          },
  { id: 'recetas',     label: 'Recetas',      icon: BookOpen        },
  { id: 'reportes',    label: 'Reportes',     icon: BarChart2       },
];

export const Sidebar = ({ activeTab, onNavigate }) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  // Todos los items siempre visibles (panel solo para admin)
  const items = NAV;

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Coffee size={20} color="#fff" />
        </div>
        <div className="sidebar-brand-text">
          <h2>CoffeeCode</h2>
          <span>Cafetería</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item${activeTab === item.id ? ' active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button className="nav-item" onClick={logout} style={{ color: 'var(--danger)' }}>
          <LogOut size={17} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};
