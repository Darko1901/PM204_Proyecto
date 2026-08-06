import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { FileText, FileSpreadsheet, Calendar, ListFilter } from 'lucide-react';

/* ── Gráfico de líneas SVG ─────────────────────────────────────── */
const LineChart = ({ data, color, label }) => {
  if (!data || data.length < 2) return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>Sin datos</div>;
  const W = 480, H = 200, PAD = 40;
  const maxV = Math.max(...data.map(d => d.monto), 1);
  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: H - PAD - (d.monto / maxV) * (H - PAD * 2),
  }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const fill = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    + ` L ${pts[pts.length - 1].x} ${H - PAD} L ${pts[0].x} ${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
        const y = H - PAD - r * (H - PAD * 2);
        return <line key={i} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#eee" strokeWidth={1} />;
      })}
      {/* Fill */}
      <path d={fill} fill={color} fillOpacity={0.08} />
      {/* Line */}
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Points (every nth) */}
      {pts.filter((_, i) => data.length <= 10 || i % Math.ceil(data.length / 8) === 0).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} stroke="#fff" strokeWidth={2} />
      ))}
      {/* X labels */}
      {data.filter((_, i) => data.length <= 7 || i % Math.ceil(data.length / 6) === 0).map((d, i) => {
        const idx = data.indexOf(d);
        const p = pts[idx];
        return <text key={i} x={p.x} y={H - PAD + 16} fontSize={9} textAnchor="middle" fill="var(--text-light)">{d.fecha?.slice(5)}</text>;
      })}
      {/* Y labels */}
      {[0, 0.5, 1].map((r, i) => {
        const y = H - PAD - r * (H - PAD * 2);
        return <text key={i} x={PAD - 6} y={y + 4} fontSize={9} textAnchor="end" fill="var(--text-light)">{Math.round(r * maxV / 1000)}k</text>;
      })}
    </svg>
  );
};

/* ── Gráfico de barras SVG ─────────────────────────────────────── */
const BarChart = ({ ganancias, gastos }) => {
  const W = 380, H = 180, PAD = 40;
  // Agrupar por mes
  const meses = {};
  ganancias.forEach(g => {
    const m = g.fecha?.slice(0, 7); // YYYY-MM
    if (!meses[m]) meses[m] = { ganancia: 0, gasto: 0 };
    meses[m].ganancia += g.monto;
  });
  gastos.forEach(g => {
    const m = g.fecha?.slice(0, 7);
    if (!meses[m]) meses[m] = { ganancia: 0, gasto: 0 };
    meses[m].gasto += g.monto;
  });
  const keys = Object.keys(meses).sort().slice(-6);
  if (keys.length === 0) return null;

  const maxV = Math.max(...keys.map(k => Math.max(meses[k].ganancia, meses[k].gasto)), 1);
  const bw = (W - PAD * 2) / (keys.length * 3);
  const mesLabel = (k) => { const d = new Date(k + '-01'); return d.toLocaleString('es-MX', { month: 'short' }); };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      {[0, 0.5, 1].map((r, i) => {
        const y = H - PAD - r * (H - PAD * 2);
        return <line key={i} x1={PAD} y1={y} x2={W - 10} y2={y} stroke="#eee" strokeWidth={1} />;
      })}
      {keys.map((k, i) => {
        const x = PAD + i * (W - PAD * 2) / keys.length;
        const gH = (meses[k].ganancia / maxV) * (H - PAD * 2);
        const gaH = (meses[k].gasto / maxV) * (H - PAD * 2);
        return (
          <g key={k}>
            <rect x={x + 2} y={H - PAD - gH} width={bw} height={gH} fill="var(--primary)" fillOpacity={0.7} rx={2} />
            <rect x={x + bw + 4} y={H - PAD - gaH} width={bw} height={gaH} fill="#fca5a5" rx={2} />
            <text x={x + bw} y={H - PAD + 14} fontSize={9} textAnchor="middle" fill="var(--text-light)">{mesLabel(k)}</text>
          </g>
        );
      })}
    </svg>
  );
};

/* ── Helpers de fecha (YYYY-MM-DD en huso local, para los <input type="date">) ── */
const pad2 = (n) => String(n).padStart(2, '0');
const toISODate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const TIPOS_REPORTE = [
  { value: 'pedidos', label: 'Pedidos' },
  { value: 'productos', label: 'Productos' },
  { value: 'inventario', label: 'Inventario' },
];

/* ── Vista principal ─────────────────────────────────────────────── */
export const Reportes = () => {
  // --- Datos de la sección "Estadísticas" (gráficas) ---
  const [stats, setStats]   = useState(null);
  const [productos, setProductos] = useState([]);
  const [suministros, setSuministros] = useState([]);
  const [dias, setDias]     = useState(30);
  const [loading, setLoading] = useState(true);

  // --- Filtros de la sección "Reportes" (servidor) ---
  const [tipoReporte, setTipoReporte]     = useState('pedidos');
  const [desde, setDesde]                 = useState('');
  const [hasta, setHasta]                 = useState('');
  const [tipoCuenta, setTipoCuenta]       = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [soloBajoMinimo, setSoloBajoMinimo]   = useState(false);
  const [busqueda, setBusqueda]           = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');

  // Debounce del texto de búsqueda: evita un fetch por cada tecla.
  useEffect(() => {
    const t = setTimeout(() => setBusquedaDebounced(busqueda), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  // --- Vista previa y descarga (servidor) ---
  const [preview, setPreview]           = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState('');
  const [descargando, setDescargando]   = useState(false);
  const [descargaError, setDescargaError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [dataStats, dataProd, dataSum] = await Promise.all([
        api.getEstadisticas(dias),
        api.getProductos(),
        api.getSuministros(),
      ]);
      setStats(dataStats);
      setProductos(Array.isArray(dataProd) ? dataProd : []);
      setSuministros(Array.isArray(dataSum) ? dataSum : []);
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [dias]);

  // Categorías reales del catálogo (para el select de "Productos"), sin pedir un endpoint nuevo.
  const categoriasDisponibles = useMemo(() => {
    const set = new Set(productos.map(p => p.categoria).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [productos]);

  // Filtros que de verdad aplican según el tipo de reporte elegido — los
  // mismos que se muestran en la UI (sección B3) viajan al API tal cual.
  const filtrosActuales = useMemo(() => {
    if (tipoReporte === 'pedidos') {
      return { tipo: 'pedidos', desde: desde || undefined, hasta: hasta || undefined, tipo_cuenta: tipoCuenta || undefined };
    }
    if (tipoReporte === 'productos') {
      return {
        tipo: 'productos',
        desde: desde || undefined,
        hasta: hasta || undefined,
        categoria: categoriaFiltro || undefined,
        busqueda: busquedaDebounced || undefined,
      };
    }
    return { tipo: 'inventario', solo_bajo_minimo: soloBajoMinimo, busqueda: busquedaDebounced || undefined };
  }, [tipoReporte, desde, hasta, tipoCuenta, categoriaFiltro, soloBajoMinimo, busquedaDebounced]);

  useEffect(() => {
    let vigente = true;
    (async () => {
      setPreviewLoading(true);
      setPreviewError('');
      try {
        const data = await api.getReportePreview(filtrosActuales);
        if (vigente) setPreview(data);
      } catch (err) {
        if (vigente) {
          setPreview(null);
          setPreviewError(err.message || 'Error al cargar la vista previa');
        }
      } finally {
        if (vigente) setPreviewLoading(false);
      }
    })();
    return () => { vigente = false; };
  }, [filtrosActuales]);

  const rangoHoy = () => { const t = toISODate(new Date()); setDesde(t); setHasta(t); };
  const rangoUltimosDias = (n) => {
    const hoy = new Date();
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - (n - 1));
    setDesde(toISODate(inicio));
    setHasta(toISODate(hoy));
  };
  const rangoEsteMes = () => {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    setDesde(toISODate(inicio));
    setHasta(toISODate(hoy));
  };

  const nombreArchivo = (ext) => {
    const hoy = new Date();
    const fecha = `${hoy.getFullYear()}${pad2(hoy.getMonth() + 1)}${pad2(hoy.getDate())}`;
    return `reporte_${tipoReporte}_${fecha}.${ext}`;
  };

  const descargar = async (formato) => {
    setDescargaError('');
    setDescargando(true);
    try {
      const blob = formato === 'pdf'
        ? await api.descargarReportePDF(filtrosActuales)
        : await api.descargarReporteXLSX(filtrosActuales);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo(formato);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDescargaError(err.message || 'Error al descargar el archivo');
    } finally {
      setDescargando(false);
    }
  };

  const fmt = (n) => `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-title">
          <h2>Reportes y Estadísticas</h2>
          <p>Análisis de ventas, ganancias y estado general del negocio</p>
        </div>
      </div>

      {/* ═══════════════════ SECCIÓN: ESTADÍSTICAS (gráficas) ═══════════════════ */}
      <div className="section-title" style={{ fontSize: '1rem', marginBottom: 12 }}>Estadísticas</div>

      <div className="card card-body" style={{ marginBottom: 20 }}>
        <div className="form-group" style={{ marginBottom: 0, minWidth: 160, maxWidth: 220 }}>
          <label className="form-label"><Calendar size={13} style={{ marginRight: 4 }} />Período (Gráficos)</label>
          <select className="form-control" value={dias} onChange={e => setDias(Number(e.target.value))}>
            <option value={7}>Última semana</option>
            <option value={15}>Últimos 15 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 3 meses</option>
            <option value={180}>Últimos 6 meses</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loader-wrap"><div className="spinner" /><span>Cargando estadísticas...</span></div>
      ) : !stats ? (
        <div className="empty-state"><p>No se pudieron cargar los datos.</p></div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <div className="stat-card green">
              <div>
                <div className="stat-card-label">Ventas Totales ({dias}d)</div>
                <div className="stat-card-value" style={{ fontSize: '1.6rem' }}>{fmt(stats.resumen.total_ganancias)}</div>
                <div className="stat-card-sub">Promedio: {fmt(stats.resumen.total_ganancias / Math.max(dias, 1))}/día</div>
              </div>
            </div>
            <div className="stat-card blue">
              <div>
                <div className="stat-card-label">Ganancias Netas</div>
                <div className="stat-card-value" style={{ fontSize: '1.6rem' }}>{fmt(stats.resumen.utilidad_neta)}</div>
                <div className="stat-card-sub">Promedio: {fmt(stats.resumen.utilidad_neta / Math.max(dias, 1))}/día</div>
              </div>
            </div>
            <div className="stat-card red">
              <div>
                <div className="stat-card-label">Gastos ({dias}d)</div>
                <div className="stat-card-value" style={{ fontSize: '1.6rem' }}>{fmt(stats.resumen.total_gastos)}</div>
                <div className="stat-card-sub">Promedio: {fmt(stats.resumen.total_gastos / Math.max(dias, 1))}/día</div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div className="chart-wrap">
              <div className="chart-title">
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', marginRight: 6 }} />
                Ventas Totales — Últimos {dias} días
              </div>
              <LineChart data={stats.ganancias_por_dia} color="var(--primary)" label="Ventas" />
            </div>

            <div className="chart-wrap">
              <div className="chart-title" style={{ display: 'flex', gap: 16 }}>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--primary)', opacity: 0.7, marginRight: 4 }} />Ganancias</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#fca5a5', marginRight: 4 }} />Gastos</span>
              </div>
              <BarChart ganancias={stats.ganancias_por_dia} gastos={stats.gastos_por_dia} />
            </div>
          </div>

          {/* Tablas de apoyo */}
          <div className="grid-2" style={{ alignItems: 'flex-start' }}>
            {/* Top productos */}
            <div className="card">
              <div className="card-body" style={{ paddingBottom: 0 }}>
                <div className="section-title">Top Productos Más Vendidos</div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Producto</th><th>Unidades</th><th>Ingresos</th></tr>
                  </thead>
                  <tbody>
                    {stats.ventas_por_producto?.length > 0 ? stats.ventas_por_producto.slice(0, 5).map((v, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{v.producto}</td>
                        <td>{v.cantidad}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{fmt(v.ingresos)}</td>
                      </tr>
                    )) : <tr><td colSpan="3" style={{ textAlign: 'center' }}>Sin ventas</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inventario Crítico */}
            <div className="card">
              <div className="card-body" style={{ paddingBottom: 0 }}>
                <div className="section-title">Inventario Crítico (Bajo Stock)</div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Insumo</th><th>Stock</th><th>Mínimo</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {suministros.filter(s => s.stock_actual <= s.stock_minimo).length > 0 ?
                      suministros.filter(s => s.stock_actual <= s.stock_minimo).map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.nombre}</td>
                        <td>{s.stock_actual.toFixed(2)} {s.unidad}</td>
                        <td>{s.stock_minimo.toFixed(2)}</td>
                        <td><span className="badge badge-error">Crítico</span></td>
                      </tr>
                    )) : <tr><td colSpan="4" style={{ textAlign: 'center' }}>Todo el inventario está OK</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════ SECCIÓN: REPORTES (servidor, con filtros) ═══════════════════ */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '32px 0 20px' }} />
      <div className="section-title" style={{ fontSize: '1rem', marginBottom: 12 }}>
        <ListFilter size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
        Reportes
      </div>

      <div className="card card-body" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
            <label className="form-label">Tipo de reporte</label>
            <select className="form-control" value={tipoReporte} onChange={e => setTipoReporte(e.target.value)}>
              {TIPOS_REPORTE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {(tipoReporte === 'pedidos' || tipoReporte === 'productos') && (
            <>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Desde</label>
                <input type="date" className="form-control" value={desde} onChange={e => setDesde(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Hasta</label>
                <input type="date" className="form-control" value={hasta} onChange={e => setHasta(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={rangoHoy}>Hoy</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => rangoUltimosDias(7)}>Últimos 7 días</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => rangoUltimosDias(30)}>Últimos 30 días</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={rangoEsteMes}>Este mes</button>
              </div>
            </>
          )}

          {tipoReporte === 'pedidos' && (
            <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
              <label className="form-label">Tipo de cuenta</label>
              <select className="form-control" value={tipoCuenta} onChange={e => setTipoCuenta(e.target.value)}>
                <option value="">Ambos</option>
                <option value="en_mesa">Mesa</option>
                <option value="para_llevar">Para llevar</option>
              </select>
            </div>
          )}

          {tipoReporte === 'productos' && (
            <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
              <label className="form-label">Categoría</label>
              <select className="form-control" value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}>
                <option value="">Todas</option>
                {categoriasDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {tipoReporte === 'inventario' && (
            <div className="form-group" style={{ marginBottom: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="chk-bajo-minimo" checked={soloBajoMinimo}
                onChange={e => setSoloBajoMinimo(e.target.checked)} />
              <label htmlFor="chk-bajo-minimo" className="form-label" style={{ marginBottom: 0 }}>
                Solo por debajo del mínimo
              </label>
            </div>
          )}

          {(tipoReporte === 'productos' || tipoReporte === 'inventario') && (
            <div className="form-group" style={{ marginBottom: 0, minWidth: 180 }}>
              <label className="form-label">
                {tipoReporte === 'productos' ? 'Buscar producto' : 'Buscar suministro'}
              </label>
              <input type="text" className="form-control" value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Nombre..." />
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
            <button className="btn btn-outline btn-sm" disabled={descargando} onClick={() => descargar('pdf')}>
              <FileText size={14} /> Descargar PDF
            </button>
            <button className="btn btn-outline btn-sm" style={{ color: 'var(--success)', borderColor: 'var(--success)' }}
              disabled={descargando} onClick={() => descargar('xlsx')}>
              <FileSpreadsheet size={14} /> Descargar XLSX
            </button>
          </div>
        </div>

        {descargaError && <div className="login-error" style={{ marginTop: 12 }}>{descargaError}</div>}
      </div>

      <div className="card">
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="toolbar">
            <div className="section-title" style={{ margin: 0 }}>Vista previa</div>
            {preview && !previewLoading && (
              <span className="badge badge-neutral">{preview.total_filas} registros</span>
            )}
          </div>
        </div>
        <div className="table-wrap">
          {previewLoading ? (
            <div className="loader-wrap"><div className="spinner" /><span>Cargando vista previa...</span></div>
          ) : previewError ? (
            <div className="empty-state"><p>{previewError}</p></div>
          ) : !preview || preview.filas.length === 0 ? (
            <div className="empty-state"><p>Sin registros para los filtros seleccionados</p></div>
          ) : (
            <table>
              <thead>
                <tr>{preview.columnas.map(col => <th key={col}>{col}</th>)}</tr>
              </thead>
              <tbody>
                {preview.filas.map((fila, i) => (
                  <tr key={i}>{fila.map((valor, j) => <td key={j}>{valor}</td>)}</tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
