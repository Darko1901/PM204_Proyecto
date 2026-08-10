export const productosIniciales = [
  { id: 1, nombre: 'Café Americano', descripcion: 'Café negro recién hecho', precio: 28, categoria: 'Bebidas calientes', disponible: true },
  { id: 2, nombre: 'Capuchino', descripcion: 'Espresso con leche espumada', precio: 38, categoria: 'Bebidas calientes', disponible: true },
  { id: 3, nombre: 'Latte Vainilla', descripcion: 'Espresso, leche y jarabe de vainilla', precio: 42, categoria: 'Bebidas calientes', disponible: true },
  { id: 4, nombre: 'Frappé de Moka', descripcion: 'Café helado con chocolate', precio: 48, categoria: 'Bebidas frías', disponible: true },
  { id: 5, nombre: 'Muffin de Arándano', descripcion: 'Horneado del día', precio: 32, categoria: 'Panadería', disponible: true },
  { id: 6, nombre: 'Sándwich Club', descripcion: 'Pan brioche, pavo y queso', precio: 55, categoria: 'Alimentos', disponible: true },
  { id: 7, nombre: 'Croissant de Jamón y Queso', descripcion: 'Horneado y gratinado', precio: 45, categoria: 'Panadería', disponible: false },
  { id: 8, nombre: 'Té Chai Latte', descripcion: 'Especias y leche vaporizada', precio: 36, categoria: 'Bebidas calientes', disponible: true },
];

export const suministrosIniciales = [
  { id: 1, nombre: 'Café molido', unidad: 'g', stock_actual: 4200, stock_minimo: 1000, activo: true },
  { id: 2, nombre: 'Leche entera', unidad: 'ml', stock_actual: 6500, stock_minimo: 3000, activo: true },
  { id: 3, nombre: 'Jarabe de vainilla', unidad: 'ml', stock_actual: 420, stock_minimo: 500, activo: true },
  { id: 4, nombre: 'Chocolate en polvo', unidad: 'g', stock_actual: 1800, stock_minimo: 500, activo: true },
  { id: 5, nombre: 'Harina', unidad: 'g', stock_actual: 5200, stock_minimo: 2000, activo: true },
  { id: 6, nombre: 'Arándanos', unidad: 'g', stock_actual: 350, stock_minimo: 400, activo: true },
  { id: 7, nombre: 'Pan brioche', unidad: 'pieza', stock_actual: 18, stock_minimo: 10, activo: true },
  { id: 8, nombre: 'Pavo rebanado', unidad: 'g', stock_actual: 1200, stock_minimo: 600, activo: true },
  { id: 9, nombre: 'Té chai (bolsas)', unidad: 'pieza', stock_actual: 40, stock_minimo: 20, activo: true },
];

export const recetasIniciales = [
  { producto_id: 1, suministro_id: 1, cantidad: 18 },
  { producto_id: 2, suministro_id: 1, cantidad: 18 },
  { producto_id: 2, suministro_id: 2, cantidad: 150 },
  { producto_id: 3, suministro_id: 1, cantidad: 18 },
  { producto_id: 3, suministro_id: 2, cantidad: 150 },
  { producto_id: 3, suministro_id: 3, cantidad: 20 },
  { producto_id: 4, suministro_id: 1, cantidad: 20 },
  { producto_id: 4, suministro_id: 4, cantidad: 30 },
  { producto_id: 4, suministro_id: 2, cantidad: 100 },
  { producto_id: 5, suministro_id: 5, cantidad: 90 },
  { producto_id: 5, suministro_id: 6, cantidad: 25 },
  { producto_id: 6, suministro_id: 7, cantidad: 1 },
  { producto_id: 6, suministro_id: 8, cantidad: 120 },
  { producto_id: 8, suministro_id: 9, cantidad: 1 },
  { producto_id: 8, suministro_id: 2, cantidad: 120 },
];

export const mesasIniciales = [
  { id: 1, numero: 1, capacidad: 2, activa: true },
  { id: 2, numero: 2, capacidad: 4, activa: true },
  { id: 3, numero: 3, capacidad: 4, activa: true },
  { id: 4, numero: 4, capacidad: 6, activa: true },
  { id: 5, numero: 5, capacidad: 2, activa: true },
  { id: 6, numero: 6, capacidad: 4, activa: true },
];

export const cuentasIniciales = [
  {
    id: 1,
    mesa_id: 2,
    mesero_nombre: 'Mesero 1',
    tipo: 'en_mesa',
    estado: 'abierta',
    total: 80,
    abierta_en: new Date().toISOString(),
    cerrada_en: null,
    detalles: [
      { id: 1, producto_id: 2, cantidad: 1, precio_unitario: 38, observaciones: '', estado: 'listo', creado_en: new Date().toISOString() },
      { id: 2, producto_id: 5, cantidad: 1, precio_unitario: 32, observaciones: 'Sin nueces', estado: 'entregado', creado_en: new Date().toISOString() },
      { id: 3, producto_id: 1, cantidad: 1, precio_unitario: 28, observaciones: '', estado: 'pendiente', creado_en: new Date().toISOString() },
    ],
  },
  {
    id: 2,
    mesa_id: 4,
    mesero_nombre: 'Mesero 2',
    tipo: 'en_mesa',
    estado: 'por_cobrar',
    total: 118,
    abierta_en: new Date().toISOString(),
    cerrada_en: null,
    detalles: [
      { id: 4, producto_id: 6, cantidad: 2, precio_unitario: 55, observaciones: '', estado: 'entregado', creado_en: new Date().toISOString() },
      { id: 5, producto_id: 1, cantidad: 1, precio_unitario: 8, observaciones: 'Promo', estado: 'entregado', creado_en: new Date().toISOString() },
    ],
  },
  {
    id: 3,
    mesa_id: null,
    mesero_nombre: 'Mesero 3',
    tipo: 'para_llevar',
    estado: 'por_cobrar',
    total: 48,
    abierta_en: new Date().toISOString(),
    cerrada_en: null,
    detalles: [
      { id: 6, producto_id: 4, cantidad: 1, precio_unitario: 48, observaciones: '', estado: 'entregado', creado_en: new Date().toISOString() },
    ],
  },
];

export const comprasIniciales = [
  {
    id: 1,
    proveedor: 'Distribuidora Querétaro',
    total: 850,
    comprado_en: new Date(Date.now() - 86400000).toISOString(),
    lineas: [
      { suministro_id: 1, cantidad: 3000, costo_unitario: 0.18 },
      { suministro_id: 2, cantidad: 8000, costo_unitario: 0.035 },
    ],
  },
];
