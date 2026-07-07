import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Trash2, X, ChevronDown, BookOpen } from 'lucide-react';

export const Recetas = () => {
  const [productos, setProductos]     = useState([]);
  const [suministros, setSuministros] = useState([]);
  const [productoId, setProductoId]   = useState('');
  const [receta, setReceta]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingReceta, setLoadingReceta] = useState(false);
  const [modal, setModal]             = useState(false);
  const [form, setForm]               = useState({ suministro_id: '', cantidad: '' });
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s] = await Promise.all([api.getProductos(), api.getSuministros()]);
        setProductos(Array.isArray(p) ? p : []);
        setSuministros(Array.isArray(s) ? s : []);
        if (p.length > 0) setProductoId(String(p[0].id));
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!productoId) return;
    const fetchReceta = async () => {
      setLoadingReceta(true);
      try {
        const data = await api.getRecetasByProducto(productoId);
        setReceta(Array.isArray(data) ? data : []);
      } catch (_) { setReceta([]); }
      finally { setLoadingReceta(false); }
    };
    fetchReceta();
  }, [productoId]);

  const productoActual = productos.find(p => String(p.id) === productoId);

  const agregarInsumo = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.agregarReceta(productoId, {
        suministro_id: Number(form.suministro_id),
        cantidad: Number(form.cantidad),
      });
      setModal(false);
      // Reload receta
      const data = await api.getRecetasByProducto(productoId);
      setReceta(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al agregar insumo');
    } finally {
      setSaving(false);
    }
  };

  const eliminarInsumo = async (recetaId) => {
    if (!confirm('¿Quitar este insumo de la receta?')) return;
    try {
      await api.eliminarReceta(recetaId);
      const data = await api.getRecetasByProducto(productoId);
      setReceta(Array.isArray(data) ? data : []);
    } catch (err) { alert(err.message); }
  };

  const sumNombre = (id) => suministros.find(s => s.id === id)?.nombre || `#${id}`;
  const sumUnidad = (id) => suministros.find(s => s.id === id)?.unidad || '';

  if (loading) return <div className="loader-wrap"><div className="spinner" /><span>Cargando...</span></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-title">
          <h2>Gestión de Recetas</h2>
          <p>Configura las formulaciones de productos del menú</p>
        </div>
        <button className="btn btn-outline" id="btn-relacion-recetas" style={{ cursor: 'default', opacity: 0.7 }}>
          <BookOpen size={15} /> Relación Producto → Suministros
        </button>
      </div>

      {/* Selector de producto */}
      <div className="card card-body" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Seleccionar Producto del Menú</label>
            <div style={{ position: 'relative' }}>
              <select className="form-control" value={productoId} onChange={e => setProductoId(e.target.value)}
                style={{ paddingRight: 32, appearance: 'none' }}>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <ChevronDown size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-light)' }} />
            </div>
          </div>
          <div className="stat-card green" style={{ padding: '14px 18px', marginBottom: 0 }}>
            <div>
              <div className="stat-card-label">Ingredientes configurados</div>
              <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{receta.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla receta */}
      <div className="card">
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="toolbar">
            <div className="section-title" style={{ margin: 0 }}>
              Formulación de Receta: {productoActual?.nombre || '—'}
              <p style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-light)', marginTop: 2 }}>
                Define los insumos y cantidades necesarias para preparar este producto
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => { setForm({ suministro_id: '', cantidad: '' }); setError(''); setModal(true); }}>
              <Plus size={15} /> Añadir Insumo a la Receta
            </button>
          </div>
        </div>

        <div className="table-wrap">
          {loadingReceta ? (
            <div className="loader-wrap"><div className="spinner" /><span>Cargando receta...</span></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Suministro Asignado</th>
                  <th>Cantidad Requerida</th>
                  <th>Unidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {receta.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
                    Esta receta no tiene insumos configurados. Haz clic en "Añadir Insumo" para empezar.
                  </td></tr>
                ) : (
                  receta.map((r, i) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{String(i + 1).padStart(2, '0')}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1rem' }}>☕</span>
                          <span style={{ fontWeight: 600 }}>{sumNombre(r.suministro_id)}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{r.cantidad}</td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>{sumUnidad(r.suministro_id)}</span>
                      </td>
                      <td>
                        <button className="btn-icon del" onClick={() => eliminarInsumo(r.id)} title="Quitar insumo">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal agregar insumo */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>Añadir Insumo a la Receta</h3>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={agregarInsumo}>
              <div className="modal-body">
                {error && <div className="login-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Suministro</label>
                  <select className="form-control" required value={form.suministro_id}
                    onChange={e => setForm(f => ({ ...f, suministro_id: e.target.value }))}>
                    <option value="">Seleccionar insumo...</option>
                    {suministros.map(s => <option key={s.id} value={s.id}>{s.nombre} ({s.unidad})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cantidad requerida</label>
                  <input className="form-control" type="number" step="0.01" min="0.01" required value={form.cantidad}
                    onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
                    placeholder="Ej: 150 (en la unidad del insumo)" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Agregar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
