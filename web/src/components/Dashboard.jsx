import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { TrendingUp, ShoppingCart, AlertTriangle, Clock, CheckCircle, Circle } from 'lucide-react';

export const Dashboard = () => {
  const [stats, setStats]       = useState(null);
  const [cuentas, setCuentas]   = useState([]);
  const [suministros, setSuministros] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, c, inv] = await Promise.all([
          api.getEstadisticas(1),
          api.getCuentas('activo'),
          api.getSuministros(),
        ]);
        setStats(s);
        setCuentas(Array.isArray(c) ? c : []);
        setSuministros(Array.isArray(inv) ? inv : []);
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const bajosMinimo = suministros.filter(s => s.stock_actual <= s.stock_minimo);

  const estadoBadge = (estado) => {
    const map = {
      'activo':      { cls: 'badge-primary', label: 'En preparación' },
      'listo':       { cls: 'badge-success', label: 'Listo' },
      'pendiente':   { cls: 'badge-warning', label: 'Pendiente' },
      'pagado':      { cls: 'badge-neutral', label: 'Pagado' },
    };
    const m = map[estado] || { cls: 'badge-neutral', label: estado };
    return <span className={`badge ${m.cls}`}>{m.label}</span>;
  };

  if (loading) return (
    <div className="loader-wrap"><div className="spinner" /><span>Cargando dashboard...</span></div>
  );

  const ventasDia   = stats?.resumen?.total_ganancias ?? 0;
  const totalPedidos = stats?.resumen?.total_pedidos ?? 0;

  return (
    <div className="fade-in">
      {/* Stat cards */}
      <div className="grid-3">
        <div className="stat-card green">
          <div>
            <div className="stat-card-label">Ventas del día</div>
            <div className="stat-card-value">${ventasDia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
            <div className="stat-card-sub">+12.5% vs ayer</div>
          </div>
          <TrendingUp size={32} color="var(--success)" />
        </div>

        <div className="stat-card yellow">
          <div>
            <div className="stat-card-label">Pedidos activos</div>
            <div className="stat-card-value">{cuentas.length}</div>
            <div className="stat-card-sub">En cola de preparación</div>
          </div>
          <ShoppingCart size={32} color="var(--warning)" />
        </div>

        <div className="stat-card red">
          <div>
            <div className="stat-card-label">Suministros bajo mínimo</div>
            <div className="stat-card-value">{bajosMinimo.length}</div>
            <div className="stat-card-sub">Requieren reabastecimiento</div>
          </div>
          <AlertTriangle size={32} color="var(--danger)" />
        </div>
      </div>

      {/* Grid inferior */}
      <div className="grid-2">
        {/* Pedidos en cola */}
        <div className="card">
          <div className="card-body" style={{ padding: '20px 24px 0' }}>
            <div className="section-title">Pedidos en Cola</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mesa</th>
                  <th>Productos</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {cuentas.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-light)' }}>Sin pedidos activos</td></tr>
                ) : (
                  cuentas.slice(0, 8).map((c, i) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{String(c.id).padStart(3, '0')}</td>
                      <td>Mesa {c.mesa_id || '—'}</td>
                      <td>{c.detalles?.length ?? 0} ítem(s)</td>
                      <td>{estadoBadge(c.estado)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas de inventario */}
        <div className="card card-body">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={16} color="var(--danger)" />
            Alertas de Inventario
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bajosMinimo.length === 0 ? (
              <div className="empty-state"><p>✓ Todos los suministros en niveles adecuados</p></div>
            ) : (
              bajosMinimo.slice(0, 6).map(s => {
                const critico = s.stock_actual <= s.stock_minimo * 0.5;
                return (
                  <div key={s.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', borderRadius: 6,
                    background: critico ? 'var(--danger-bg)' : 'var(--warning-bg)',
                    border: `1px solid ${critico ? '#fecaca' : '#fde68a'}`,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                        Stock actual: <strong>{s.stock_actual} {s.unidad}</strong> / Mínimo: {s.stock_minimo} {s.unidad}
                      </div>
                    </div>
                    <span className={`badge ${critico ? 'badge-danger' : 'badge-warning'}`}>
                      {critico ? 'Crítico' : 'Bajo'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
