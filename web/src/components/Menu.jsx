import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';

const CATEGORIAS = ['Todas', 'Bebidas Calientes', 'Bebidas Frías', 'Postres', 'Snacks', 'Alimentos'];
const CAT_COLORS = {
  'Bebidas Calientes': 'badge-danger',
  'Bebidas Frías':     'badge-primary',
  'Postres':           'badge-warning',
  'Snacks':            'badge-accent',
  'Alimentos':         'badge-success',
};

const EMPTY = { nombre: '', descripcion: '', precio: '', costo_unitario: '', categoria: 'Bebidas Calientes', disponible: true };

export const Menu = () => {
  const [productos, setProductos]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filtro, setFiltro]         = useState('');
  const [catFiltro, setCatFiltro]   = useState('Todas');
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getProductos();
      setProductos(Array.isArray(data) ? data : []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtrados = productos.filter(p => {
    const matchFiltro = p.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
                        p.descripcion?.toLowerCase().includes(filtro.toLowerCase());
    const matchCat    = catFiltro === 'Todas' || p.categoria === catFiltro;
    return matchFiltro && matchCat;
  });

  const disponibles   = productos.filter(p => p.disponible).length;
  const noDisponibles = productos.length - disponibles;

  const abrirCrear  = () => { setForm(EMPTY); setError(''); setModal('crear'); };
  const abrirEditar = (p) => {
    setForm({ nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, costo_unitario: p.costo_unitario || '', categoria: p.categoria || 'Bebidas Calientes', disponible: p.disponible });
    setError('');
    setModal({ type: 'editar', id: p.id });
  };

  const toggleDisponible = async (p) => {
    try {
      await api.actualizarProducto(p.id, { disponible: !p.disponible });
      load();
    } catch (_) {}
  };

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, precio: Number(form.precio), costo_unitario: Number(form.costo_unitario) };
      if (modal === 'crear') {
        await api.crearProducto(payload);
      } else {
        await api.actualizarProducto(modal.id, payload);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este producto del menú?')) return;
    try { await api.eliminarProducto(id); load(); } catch (err) { alert(err.message); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-title">
          <h2>Gestión de Menú</h2>
          <p>Administra productos, precios y disponibilidad</p>
        </div>
        <button className="btn btn-primary" onClick={abrirCrear} id="btn-agregar-producto">
          <Plus size={15} /> Agregar Producto
        </button>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card green">
          <div>
            <div className="stat-card-label">Productos Disponibles</div>
            <div className="stat-card-value">{disponibles}</div>
          </div>
          <span style={{ fontSize: 32 }}>☕</span>
        </div>
        <div className="stat-card yellow">
          <div>
            <div className="stat-card-label">No Disponibles</div>
            <div className="stat-card-value">{noDisponibles}</div>
          </div>
          <span style={{ fontSize: 32 }}>!</span>
        </div>
        <div className="stat-card blue">
          <div>
            <div className="stat-card-label">Total Productos</div>
            <div className="stat-card-value">{productos.length}</div>
          </div>
          <span style={{ fontSize: 32 }}>$</span>
        </div>
      </div>

      {/* Filtro categorías */}
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: 10 }}>Filtrar por categoría:</span>
        <div className="chip-bar" style={{ display: 'inline-flex' }}>
          {CATEGORIAS.map(cat => (
            <button key={cat} className={`chip${catFiltro === cat ? ' active' : ''}`}
              onClick={() => setCatFiltro(cat)}>{cat}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="toolbar">
            <div>
              <div className="section-title" style={{ margin: 0 }}>Catálogo de Productos</div>
              <small style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>$ Los precios deben ser mayores a $0.00</small>
            </div>
            <div className="search-wrap">
              <Search size={14} />
              <input className="form-control" placeholder="Buscar producto..." value={filtro}
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
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Precio (USD)</th>
                  <th>Categoría</th>
                  <th>Disponible</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-light)' }}>Sin productos</td></tr>
                ) : filtrados.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{String(i + 1).padStart(3, '0')}</td>
                    <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion || '—'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>$ {Number(p.precio).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${CAT_COLORS[p.categoria] || 'badge-neutral'}`}>{p.categoria || '—'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label className="toggle">
                          <input type="checkbox" checked={p.disponible} onChange={() => toggleDisponible(p)} />
                          <span className="toggle-slider" />
                        </label>
                        <span style={{ fontSize: '0.8rem', color: p.disponible ? 'var(--success)' : 'var(--text-light)' }}>
                          {p.disponible ? 'Sí' : 'No'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon edit" onClick={() => abrirEditar(p)} title="Editar"><Pencil size={15} /></button>
                        <button className="btn-icon del" onClick={() => eliminar(p.id)} title="Eliminar"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>{modal === 'crear' ? 'Agregar Producto' : 'Editar Producto'}</h3>
              <button className="btn-icon" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={guardar}>
              <div className="modal-body">
                {error && <div className="login-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input className="form-control" required value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <input className="form-control" value={form.descripcion}
                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Precio (USD)</label>
                    <input className="form-control" type="number" step="0.01" min="0.01" required value={form.precio}
                      onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Costo unitario</label>
                    <input className="form-control" type="number" step="0.01" min="0" value={form.costo_unitario}
                      onChange={e => setForm(f => ({ ...f, costo_unitario: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select className="form-control" value={form.categoria}
                    onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                    {CATEGORIAS.filter(c => c !== 'Todas').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="disp-check" checked={form.disponible}
                    onChange={e => setForm(f => ({ ...f, disponible: e.target.checked }))} />
                  <label htmlFor="disp-check" className="form-label" style={{ marginBottom: 0 }}>Disponible en menú</label>
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
    </div>
  );
};
