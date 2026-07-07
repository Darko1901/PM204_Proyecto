import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { FileText, FileSpreadsheet, Calendar } from 'lucide-react';

/* ── Exportar PDF ─────────────────────────────────────────────── */
async function exportPDF(titulo, stats, ganancias, gastos, productos, pedidos, suministros) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text(titulo, 14, 18);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 25);
  
  // 1. Resumen Financiero
  doc.text("Resumen Financiero", 14, 35);
  autoTable(doc, {
    startY: 40,
    head: [['Fecha', 'Ventas ($)', 'Gastos ($)', 'Utilidad ($)']],
    body: ganancias.map((g, i) => [
      g.fecha,
      g.monto.toFixed(2),
      (gastos[i]?.monto || 0).toFixed(2),
      (g.monto - (gastos[i]?.monto || 0)).toFixed(2),
    ]),
    headStyles: { fillColor: [18, 83, 119], textColor: 255 },
    styles: { fontSize: 8 },
  });

  // 2. Inventario (Suministros)
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [['Insumo', 'Unidad', 'Stock Actual', 'Stock Mínimo', 'Estado']],
    body: suministros.map(s => [
      s.nombre,
      s.unidad,
      s.stock_actual.toFixed(2),
      s.stock_minimo.toFixed(2),
      s.stock_actual <= s.stock_minimo ? 'Crítico' : 'OK'
    ]),
    headStyles: { fillColor: [84, 112, 127], textColor: 255 },
    styles: { fontSize: 8 },
  });


  // 4. Pedidos (Cuentas)
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [['Folio / ID', 'Fecha', 'Tipo', 'Estado', 'Total ($)']],
    body: pedidos.map(p => [
      `#${String(p.id).padStart(4, '0')}`,
      new Date(p.abierta_en).toLocaleString('es-MX'),
      p.tipo,
      p.estado,
      p.total.toFixed(2)
    ]),
    headStyles: { fillColor: [112, 119, 160], textColor: 255 },
    styles: { fontSize: 8 },
  });

  doc.save(`${titulo}.pdf`);
}

async function exportXLSX(ganancias, gastos, productos, pedidos, suministros) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // Hoja 1: Financiero
  const rowsFin = ganancias.map((g, i) => ({
    Fecha: g.fecha,
    'Ventas ($)': g.monto,
    'Gastos ($)': gastos[i]?.monto || 0,
    'Utilidad ($)': g.monto - (gastos[i]?.monto || 0),
  }));
  const wsFin = XLSX.utils.json_to_sheet(rowsFin);
  XLSX.utils.book_append_sheet(wb, wsFin, 'Financiero');

  // Hoja 2: Inventario
  const rowsInv = suministros.map(s => ({
    Insumo: s.nombre,
    Unidad: s.unidad,
    'Stock Actual': s.stock_actual,
    'Stock Mínimo': s.stock_minimo,
    Estado: s.stock_actual <= s.stock_minimo ? 'Crítico' : 'OK'
  }));
  const wsInv = XLSX.utils.json_to_sheet(rowsInv);
  XLSX.utils.book_append_sheet(wb, wsInv, 'Inventario');


  // Hoja 4: Pedidos
  const rowsPed = pedidos.map(p => ({
    'Folio / ID': `#${String(p.id).padStart(4, '0')}`,
    Fecha: new Date(p.abierta_en).toLocaleString('es-MX'),
    Tipo: p.tipo,
    Estado: p.estado,
    'Total ($)': p.total
  }));
  const wsPed = XLSX.utils.json_to_sheet(rowsPed);
  XLSX.utils.book_append_sheet(wb, wsPed, 'Pedidos');

  XLSX.writeFile(wb, 'Reporte_CoffeeCode.xlsx');
}

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

/* ── Vista principal ─────────────────────────────────────────────── */
export const Reportes = () => {
  const [stats, setStats]   = useState(null);
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [suministros, setSuministros] = useState([]);
  const [dias, setDias]     = useState(30);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [dataStats, dataProd, dataPed, dataSum] = await Promise.all([
        api.getEstadisticas(dias),
        api.getProductos(),
        api.getPedidos('pagada'),
        api.getSuministros()
      ]);
      setStats(dataStats);
      setProductos(Array.isArray(dataProd) ? dataProd : []);
      setPedidos(Array.isArray(dataPed) ? dataPed : []);
      setSuministros(Array.isArray(dataSum) ? dataSum : []);
    } catch (err) {
      console.error("Error cargando reportes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [dias]);

  const fmt = (n) => `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-title">
          <h2>Reportes y Estadísticas</h2>
          <p>Análisis de ventas, ganancias y estado general del negocio</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card card-body" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
            <label className="form-label"><Calendar size={13} style={{ marginRight: 4 }} />Período (Gráficos)</label>
            <select className="form-control" value={dias} onChange={e => setDias(Number(e.target.value))}>
              <option value={7}>Última semana</option>
              <option value={15}>Últimos 15 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={90}>Últimos 3 meses</option>
              <option value={180}>Últimos 6 meses</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
            <button className="btn btn-outline btn-sm"
              onClick={() => stats && exportPDF('Reporte_CoffeeCode', stats, stats.ganancias_por_dia, stats.gastos_por_dia, productos, pedidos, suministros)}>
              <FileText size={14} /> Descargar PDF
            </button>
            <button className="btn btn-outline btn-sm" style={{ color: 'var(--success)', borderColor: 'var(--success)' }}
              onClick={() => stats && exportXLSX(stats.ganancias_por_dia, stats.gastos_por_dia, productos, pedidos, suministros)}>
              <FileSpreadsheet size={14} /> Descargar XLSX
            </button>
          </div>
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

          {/* Tablas de Reportes Adicionales */}
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
    </div>
  );
};

