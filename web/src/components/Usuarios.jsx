import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';

const EMPTY = { nombre_completo: '', correo: '', password: '', rol_id: '', activo: true };

export const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filtro, setFiltro]     = useState('');
  const [modal, setModal]       = useState(null); // null | 'crear' | 'editar'
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([api.getUsuarios(), api.getRoles()]);
      setUsuarios(Array.isArray(u) ? u : []);
      setRoles(Array.isArray(r) ? r : []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtrados = usuarios.filter(u =>
    u.nombre_completo?.toLowerCase().includes(filtro.toLowerCase()) ||
    u.correo?.toLowerCase().includes(filtro.toLowerCase())
  );

  const abrirCrear = () => {
    setForm(EMPTY);
    setError('');
    setModal('crear');
  };

  const abrirEditar = (u) => {
    setForm({ nombre_completo: u.nombre_completo, correo: u.correo, password: '', rol_id: u.rol_id, activo: u.activo });
    setError('');
    setModal({ type: 'editar', id: u.id });
  };

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal === 'crear') {
        await api.crearUsuario({ ...form, rol_id: Number(form.rol_id) });
      } else {
        const payload = { nombre_completo: form.nombre_completo, correo: form.correo, rol_id: Number(form.rol_id), activo: form.activo };
        if (form.password) payload.password = form.password;
        await api.actualizarUsuario(modal.id, payload);
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
    if (!confirm('¿Eliminar este usuario?')) return;
    try { await api.actualizarUsuario(id, { activo: false }); load(); } catch (_) {}
  };

  const rolNombre = (id) => roles.find(r => r.id === id)?.nombre || '—';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-title">
          <h2>Gestión de Usuarios</h2>
          <p>Administra los usuarios del sistema</p>
        </div>
        <button className="btn btn-primary" onClick={abrirCrear} id="btn-agregar-usuario">
          <Plus size={16} /> Agregar Usuario
        </button>
      </div>

      <div className="card">
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="toolbar">
            <div className="section-title" style={{ margin: 0 }}>Lista de Usuarios</div>
            <div className="search-wrap">
              <Search size={14} />
              <input className="form-control" placeholder="Buscar usuario..." value={filtro}
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
                  <th>Nombre Completo</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-light)' }}>Sin resultados</td></tr>
                ) : (
                  filtrados.map((u, i) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{String(i + 1).padStart(3, '0')}</td>
                      <td style={{ fontWeight: 600 }}>{u.nombre_completo}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.correo}</td>
                      <td>{rolNombre(u.rol_id)}</td>
                      <td>
                        <span className={`badge ${u.activo ? 'badge-success' : 'badge-neutral'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-icon edit" onClick={() => abrirEditar(u)} title="Editar">
                            <Pencil size={15} />
                          </button>
                          <button className="btn-icon del" onClick={() => eliminar(u.id)} title="Desactivar">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
              <h3>{modal === 'crear' ? 'Agregar Usuario' : 'Editar Usuario'}</h3>
              <button className="btn-icon" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={guardar}>
              <div className="modal-body">
                {error && <div className="login-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Nombre completo</label>
                  <input className="form-control" required value={form.nombre_completo}
                    onChange={e => setForm(f => ({ ...f, nombre_completo: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Correo electrónico</label>
                  <input className="form-control" type="email" required value={form.correo}
                    onChange={e => setForm(f => ({ ...f, correo: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{modal === 'crear' ? 'Contraseña' : 'Nueva contraseña (opcional)'}</label>
                  <input className="form-control" type="password" required={modal === 'crear'} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select className="form-control" required value={form.rol_id}
                    onChange={e => setForm(f => ({ ...f, rol_id: e.target.value }))}>
                    <option value="">Seleccionar rol...</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                </div>
                {modal !== 'crear' && (
                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" id="activo-check" checked={form.activo}
                      onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} />
                    <label htmlFor="activo-check" className="form-label" style={{ marginBottom: 0 }}>Usuario activo</label>
                  </div>
                )}
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
