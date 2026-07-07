import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Pencil, Trash2, X, Info } from 'lucide-react';

const EMPTY = { nombre: '', descripcion: '' };

export const Roles = () => {
  const [roles, setRoles]     = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [r, u] = await Promise.all([api.getRoles(), api.getUsuarios()]);
      setRoles(Array.isArray(r) ? r : []);
      setUsuarios(Array.isArray(u) ? u : []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const countByRol = (rolId) => usuarios.filter(u => u.rol_id === rolId).length;

  const abrirCrear = () => { setForm(EMPTY); setError(''); setModal('crear'); };
  const abrirEditar = (r) => { setForm({ nombre: r.nombre, descripcion: r.descripcion || '' }); setError(''); setModal({ type: 'editar', id: r.id }); };

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal === 'crear') {
        await api.crearRol(form);
      } else {
        await api.actualizarRol(modal.id, form);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (r) => {
    const cnt = countByRol(r.id);
    if (cnt > 0) {
      alert(`No se puede eliminar. Hay ${cnt} usuario(s) asignados a este rol.`);
      return;
    }
    if (!confirm(`¿Eliminar el rol "${r.nombre}"?`)) return;
    try { await api.eliminarRol(r.id); load(); } catch (err) { alert(err.message); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-title">
          <h2>Catálogo de Roles</h2>
          <p>Define y administra los roles del sistema</p>
        </div>
        <button className="btn btn-primary" onClick={abrirCrear} id="btn-agregar-rol">
          <Plus size={16} /> Agregar Rol
        </button>
      </div>

      <div className="notice notice-info">
        <Info size={16} />
        <span><strong>Nota importante:</strong> Los roles con usuarios asignados no pueden ser eliminados. Primero debes reasignar o desactivar a los usuarios asociados.</span>
      </div>

      <div className="card">
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="section-title">Roles del Sistema</div>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div className="loader-wrap"><div className="spinner" /><span>Cargando...</span></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre del Rol</th>
                  <th>Descripción</th>
                  <th>Usuarios</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r, i) => {
                  const cnt = countByRol(r.id);
                  const puedeEliminar = cnt === 0;
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{String(i + 1).padStart(2, '0')}</td>
                      <td style={{ fontWeight: 600 }}>{r.nombre}</td>
                      <td style={{ color: 'var(--text-muted)', maxWidth: 340 }}>{r.descripcion || '—'}</td>
                      <td>
                        <span className={`badge ${cnt > 0 ? 'badge-primary' : 'badge-neutral'}`}>{cnt}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-icon edit" onClick={() => abrirEditar(r)} title="Editar">
                            <Pencil size={15} />
                          </button>
                          <button
                            className="btn-icon del"
                            onClick={() => eliminar(r)}
                            title={puedeEliminar ? 'Eliminar' : 'Tiene usuarios asignados'}
                            style={{ opacity: puedeEliminar ? 1 : 0.3, cursor: puedeEliminar ? 'pointer' : 'not-allowed' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
              <h3>{modal === 'crear' ? 'Agregar Rol' : 'Editar Rol'}</h3>
              <button className="btn-icon" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={guardar}>
              <div className="modal-body">
                {error && <div className="login-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Nombre del rol</label>
                  <input className="form-control" required value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea className="form-control" rows={3} value={form.descripcion}
                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Describe las responsabilidades de este rol..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
