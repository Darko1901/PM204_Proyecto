import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Pencil, Trash2, X, Search, AlertTriangle, RefreshCw } from 'lucide-react';

const EMPTY = { nombre: '', unidad: 'g', stock_actual: 0, stock_minimo: 0, categoria: '', activo: true };

export const Suministros = () => {
  const [suministros, setSuministros] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filtro, setFiltro]           = useState('');
  const [modal, setModal]             = useState(null);
  const [ajusteModal, setAjusteModal] = useState(null);
  const [form, setForm]               = useState(EMPTY);
  const [ajuste, setAjuste]           = useState({ cantidad: 0, tipo: 'entrada', motivo: '' });
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getSuministros();
      setSuministros(Array.isArray(data) ? data : []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtrados = suministros.filter(s =>
    s.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
    s.categoria?.toLowerCase().includes(filtro.toLowerCase())
  );

  const bajoMinimo = suministros.filter(s => s.stock_actual <= s.stock_minimo).length;
  const adecuado   = suministros.length - bajoMinimo;

  const abrirCrear  = () => { setForm(EMPTY); setError(''); setModal('crear'); };
  const abrirEditar = (s) => {
    setForm({ nombre: s.nombre, unidad: s.unidad, stock_actual: s.stock_actual, stock_minimo: s.stock_minimo, categoria: s.categoria || '', activo: s.activo });
    setError('');
    setModal({ type: 'editar', id: s.id });
  };

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, stock_actual: Number(form.stock_actual), stock_minimo: Number(form.stock_minimo) };
      if (modal === 'crear') {
        await api.crearSuministro(payload);
      } else {
        await api.actualizarSuministro(modal.id, payload);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const guardarAjuste = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.ajustarInventario(ajusteModal.id, Number(ajuste.cantidad), ajuste.tipo, ajuste.motivo);
      setAjusteModal(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este suministro?')) return;
    try { await api.actualizarSuministro(id, { activo: false }); load(); } catch (_) {}
  };

  const estadoBadge = (s) => {
    if (s.stock_actual <= s.stock_minimo * 0.5) return <span className="badge badge-danger">Crítico</span>;
    if (s.stock_actual <= s.stock_minimo)       return <span className="badge badge-warning">Bajo</span>;
    return <span className="badge badge-success">OK</span>;
  };

  const rowClass = (s) => {
    if (s.stock_actual <= s.stock_minimo * 0.5) return 'row-critical';
    if (s.stock_actual <= s.stock_minimo)       return 'row-warning';
    return '';
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-title">
          <h2>Gestión de Suministros</h2>
          <p>Control de inventario y alertas de stock</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setAjusteModal('selector')} id="btn-ajuste-stock">
            <RefreshCw size={15} /> Ajustar Stock Manual
          </button>
          <button className="btn btn-primary" onClick={abrirCrear} id="btn-nuevo-suministro">
            <Plus size={15} /> Nuevo Suministro
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card red">
          <div>
            <div className="stat-card-label">Bajo Stock Mínimo</div>
            <div className="stat-card-value">{bajoMinimo}</div>
          </div>
          <AlertTriangle size={32} color="var(--danger)" />
        </div>
        <div className="stat-card green">
          <div>
            <div className="stat-card-label">Stock Adecuado</div>
            <div className="stat-card-value">{adecuado}</div>
          </div>
          <span style={{ fontSize: 32 }}>📦</span>
        </div>
        <div className="stat-card blue">
          <div>
            <div className="stat-card-label">Total Suministros</div>
            <div className="stat-card-value">{suministros.length}</div>
          </div>
          <span style={{ fontSize: 32 }}>#</span>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="toolbar">
            <div>
              <div className="section-title" style={{ margin: 0 }}>Inventario de Suministros</div>
              <small style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>
                <AlertTriangle size={11} /> Las filas resaltadas en rosa indican stock bajo mínimo
              </small>
            </div>
            <div className="search-wrap">
              <Search size={14} />
              <input className="form-control" placeholder="Buscar suministro..." value={filtro}
                onChange={e => setFiltro(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="loader-wrap"><div className="spinner" /><span>Cargando...</span></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre del Suministro</th>
                  <th>Unidad de Medida</th>
                  <th>Stock Actual</th>
                  <th>Stock Mínimo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((s, i) => (
                  <tr key={s.id} className={rowClass(s)}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{String(i + 1).padStart(3, '0')}</td>
                    <td style={{ fontWeight: 600 }}>{s.nombre}</td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>{s.unidad}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: s.stock_actual <= s.stock_minimo ? 'var(--danger)' : 'var(--text)' }}>
                      {s.stock_actual.toLocaleString()}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.stock_minimo.toLocaleString()}</td>
                    <td>{estadoBadge(s)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon edit" onClick={() => abrirEditar(s)} title="Editar"><Pencil size={15} /></button>
                        <button className="btn-icon" onClick={() => { setAjusteModal(s); setAjuste({ cantidad: 0, tipo: 'entrada', motivo: '' }); }} title="Ajustar stock"
                          style={{ color: 'var(--accent-2)' }}>
                          <RefreshCw size={15} />
                        </button>
                        <button className="btn-icon del" onClick={() => eliminar(s.id)} title="Eliminar"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>{modal === 'crear' ? 'Nuevo Suministro' : 'Editar Suministro'}</h3>
              <button className="btn-icon" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={guardar}>
              <div className="modal-body">
                {error && <div className="login-error">{error}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Nombre</label>
                    <input className="form-control" required value={form.nombre}
                      onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <input className="form-control" value={form.categoria}
                      onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unidad de medida</label>
                    <select className="form-control" value={form.unidad}
                      onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))}>
                      {['g', 'kg', 'ml', 'L', 'pieza', 'unidad', 'caja'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock actual</label>
                    <input className="form-control" type="number" min={0} value={form.stock_actual}
                      onChange={e => setForm(f => ({ ...f, stock_actual: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock mínimo</label>
                    <input className="form-control" type="number" min={0} value={form.stock_minimo}
                      onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ajuste stock */}
      {ajusteModal && ajusteModal !== 'selector' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAjusteModal(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>Ajuste de Stock — {ajusteModal.nombre}</h3>
              <button className="btn-icon" onClick={() => setAjusteModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={guardarAjuste}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tipo de movimiento</label>
                  <select className="form-control" value={ajuste.tipo}
                    onChange={e => setAjuste(a => ({ ...a, tipo: e.target.value }))}>
                    <option value="entrada">Entrada (aumentar)</option>
                    <option value="salida">Salida (disminuir)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cantidad ({ajusteModal.unidad})</label>
                  <input className="form-control" type="number" min={1} required value={ajuste.cantidad}
                    onChange={e => setAjuste(a => ({ ...a, cantidad: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Motivo</label>
                  <input className="form-control" value={ajuste.motivo}
                    onChange={e => setAjuste(a => ({ ...a, motivo: e.target.value }))}
                    placeholder="Ej: Compra a proveedor, merma..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setAjusteModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Aplicar Ajuste'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
