import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  comprasIniciales,
  cuentasIniciales,
  mesasIniciales,
  productosIniciales,
  recetasIniciales,
  suministrosIniciales,
} from './mockData';

const MockDataContext = createContext(null);

const TRANSICIONES_ITEM = {
  pendiente: ['en_preparacion', 'cancelado'],
  en_preparacion: ['listo', 'cancelado'],
  listo: ['entregado'],
};

const TRANSICIONES_CUENTA = {
  abierta: ['por_cobrar', 'cancelada'],
  por_cobrar: ['abierta', 'pagada', 'cancelada'],
};

let nextIds = { cuenta: 100, item: 1000, compra: 100, ticket: 1000 };

function recalcularTotal(cuenta) {
  return cuenta.detalles
    .filter((d) => d.estado !== 'cancelado')
    .reduce((sum, d) => sum + d.precio_unitario * d.cantidad, 0);
}

export function MockDataProvider({ children }) {
  const [productos, setProductos] = useState(productosIniciales);
  const [suministros, setSuministros] = useState(suministrosIniciales);
  const [recetas] = useState(recetasIniciales);
  const [mesas] = useState(mesasIniciales);
  const [cuentas, setCuentas] = useState(cuentasIniciales);
  const [compras, setCompras] = useState(comprasIniciales);
  const [tickets, setTickets] = useState([]);
  const [ultimaAlerta, setUltimaAlerta] = useState(null);

  const mesaTieneCuentaAbierta = (mesaId) =>
    cuentas.some((c) => c.mesa_id === mesaId && ['abierta', 'por_cobrar'].includes(c.estado));

  const abrirCuenta = ({ tipo, mesa_id, mesero_nombre }) => {
    const nueva = {
      id: nextIds.cuenta++,
      mesa_id: tipo === 'en_mesa' ? mesa_id : null,
      mesero_nombre,
      tipo,
      estado: 'abierta',
      total: 0,
      abierta_en: new Date().toISOString(),
      cerrada_en: null,
      detalles: [],
    };
    setCuentas((prev) => [nueva, ...prev]);
    return nueva;
  };

  const agregarItem = (cuentaId, { producto_id, cantidad, observaciones }) => {
    setCuentas((prev) =>
      prev.map((c) => {
        if (c.id !== cuentaId) return c;
        const producto = productos.find((p) => p.id === producto_id);
        const detalle = {
          id: nextIds.item++,
          producto_id,
          cantidad,
          precio_unitario: producto ? producto.precio : 0,
          observaciones: observaciones || '',
          estado: 'pendiente',
          creado_en: new Date().toISOString(),
        };
        const detalles = [...c.detalles, detalle];
        return { ...c, detalles, total: recalcularTotal({ ...c, detalles }) };
      })
    );
  };

  const descontarInventario = (productoId, cantidadVendida) => {
    const lineas = recetas.filter((r) => r.producto_id === productoId);
    setSuministros((prev) =>
      prev.map((s) => {
        const linea = lineas.find((l) => l.suministro_id === s.id);
        if (!linea) return s;
        const nuevoStock = Math.max(0, s.stock_actual - linea.cantidad * cantidadVendida);
        if (nuevoStock < s.stock_minimo) {
          setUltimaAlerta(`Stock bajo: ${s.nombre} (${nuevoStock}${s.unidad} restantes)`);
        }
        return { ...s, stock_actual: nuevoStock };
      })
    );
  };

  const cambiarEstadoItem = (cuentaId, itemId, nuevoEstado) => {
    let cambioValido = false;
    let productoAfectado = null;
    let cantidadAfectada = 0;

    setCuentas((prev) =>
      prev.map((c) => {
        if (c.id !== cuentaId) return c;
        const detalles = c.detalles.map((d) => {
          if (d.id !== itemId) return d;
          const permitido = TRANSICIONES_ITEM[d.estado] || [];
          if (!permitido.includes(nuevoEstado)) return d;
          cambioValido = true;
          if (nuevoEstado === 'listo') {
            productoAfectado = d.producto_id;
            cantidadAfectada = d.cantidad;
          }
          return { ...d, estado: nuevoEstado };
        });
        return { ...c, detalles, total: recalcularTotal({ ...c, detalles }) };
      })
    );

    if (cambioValido && productoAfectado) {
      descontarInventario(productoAfectado, cantidadAfectada);
    }
    return cambioValido;
  };

  const cambiarEstadoCuenta = (cuentaId, nuevoEstado) => {
    let ok = false;
    setCuentas((prev) =>
      prev.map((c) => {
        if (c.id !== cuentaId) return c;
        const permitido = TRANSICIONES_CUENTA[c.estado] || [];
        if (!permitido.includes(nuevoEstado)) return c;
        ok = true;
        return {
          ...c,
          estado: nuevoEstado,
          cerrada_en: ['pagada', 'cancelada'].includes(nuevoEstado) ? new Date().toISOString() : c.cerrada_en,
        };
      })
    );
    return ok;
  };

  const cobrarCuenta = (cuentaId, { metodo, monto }) => {
    const cuenta = cuentas.find((c) => c.id === cuentaId);
    if (!cuenta || cuenta.estado !== 'por_cobrar') return { ok: false, error: 'La cuenta no está lista para cobro' };
    if (monto < cuenta.total) return { ok: false, error: 'El monto recibido es menor al total' };

    const folio = `TCK-${String(cuentaId).padStart(6, '0')}-${Date.now().toString().slice(-6)}`;
    const ticket = {
      id: nextIds.ticket++,
      cuenta_id: cuentaId,
      folio,
      total: cuenta.total,
      metodo,
      monto_recibido: monto,
      cambio: Math.max(0, monto - cuenta.total),
      emitido_en: new Date().toISOString(),
      mesero_nombre: cuenta.mesero_nombre,
      detalles: cuenta.detalles,
    };
    setTickets((prev) => [ticket, ...prev]);
    cambiarEstadoCuenta(cuentaId, 'pagada');
    return { ok: true, ticket };
  };

  const registrarCompra = ({ proveedor, lineas }) => {
    const total = lineas.reduce((sum, l) => sum + l.cantidad * l.costo_unitario, 0);
    const compra = {
      id: nextIds.compra++,
      proveedor,
      total,
      comprado_en: new Date().toISOString(),
      lineas,
    };
    setCompras((prev) => [compra, ...prev]);
    setSuministros((prev) =>
      prev.map((s) => {
        const linea = lineas.find((l) => l.suministro_id === s.id);
        if (!linea) return s;
        return { ...s, stock_actual: s.stock_actual + linea.cantidad };
      })
    );
    return compra;
  };

  const value = useMemo(
    () => ({
      productos,
      suministros,
      recetas,
      mesas,
      cuentas,
      compras,
      tickets,
      ultimaAlerta,
      mesaTieneCuentaAbierta,
      abrirCuenta,
      agregarItem,
      cambiarEstadoItem,
      cambiarEstadoCuenta,
      cobrarCuenta,
      registrarCompra,
    }),
    [productos, suministros, recetas, mesas, cuentas, compras, tickets, ultimaAlerta]
  );

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
}

export function useMockData() {
  const ctx = useContext(MockDataContext);
  if (!ctx) throw new Error('useMockData debe usarse dentro de MockDataProvider');
  return ctx;
}
