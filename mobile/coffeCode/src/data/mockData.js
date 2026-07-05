// Datos simulados para el frontend de Coffee Code
// Estos datos imitan las respuestas del API REST

// ─── Auth ────────────────────────────────────────────────────────────────────
export const mockUsuarios = [
  {
    id: 1,
    nombre_completo: 'Carlos Ramírez',
    correo: 'mesero@coffecode.mx',
    rol: { id: 1, nombre: 'mesero' },
    activo: true,
  },
  {
    id: 2,
    nombre_completo: 'Ana González',
    correo: 'cocina@coffecode.mx',
    rol: { id: 2, nombre: 'cocina' },
    activo: true,
  },
  {
    id: 3,
    nombre_completo: 'Luis Herrera',
    correo: 'caja@coffecode.mx',
    rol: { id: 3, nombre: 'caja' },
    activo: true,
  },
  {
    id: 4,
    nombre_completo: 'María López',
    correo: 'admin@coffecode.mx',
    rol: { id: 4, nombre: 'administrador' },
    activo: true,
  },
];

// ─── Mesas ────────────────────────────────────────────────────────────────────
export const mockMesas = [
  { id: 1, numero: 1, capacidad: 2, activa: true, ocupada: false },
  { id: 2, numero: 2, capacidad: 4, activa: true, ocupada: true },
  { id: 3, numero: 3, capacidad: 4, activa: true, ocupada: false },
  { id: 4, numero: 4, capacidad: 6, activa: true, ocupada: true },
  { id: 5, numero: 5, capacidad: 2, activa: true, ocupada: false },
  { id: 6, numero: 6, capacidad: 8, activa: true, ocupada: false },
  { id: 7, numero: 7, capacidad: 4, activa: true, ocupada: true },
  { id: 8, numero: 8, capacidad: 2, activa: false, ocupada: false },
];

// ─── Catálogo ─────────────────────────────────────────────────────────────────
export const mockProductos = [
  { id: 1, nombre: 'Americano', descripcion: 'Café negro de especialidad', precio: 45, categoria: 'Bebidas Calientes', disponible: true },
  { id: 2, nombre: 'Cappuccino', descripcion: 'Espresso con leche vaporizada', precio: 65, categoria: 'Bebidas Calientes', disponible: true },
  { id: 3, nombre: 'Latte', descripcion: 'Espresso con leche cremosa', precio: 70, categoria: 'Bebidas Calientes', disponible: true },
  { id: 4, nombre: 'Cold Brew', descripcion: 'Café frío en infusión 12h', precio: 75, categoria: 'Bebidas Frías', disponible: true },
  { id: 5, nombre: 'Frappuccino', descripcion: 'Café helado con crema', precio: 85, categoria: 'Bebidas Frías', disponible: true },
  { id: 6, nombre: 'Matcha Latte', descripcion: 'Té verde con leche de avena', precio: 80, categoria: 'Bebidas Frías', disponible: true },
  { id: 7, nombre: 'Croissant', descripcion: 'Mantequilla francesa, recién horneado', precio: 45, categoria: 'Panadería', disponible: true },
  { id: 8, nombre: 'Cheesecake', descripcion: 'Queso crema con base de galleta', precio: 65, categoria: 'Postres', disponible: true },
  { id: 9, nombre: 'Brownie', descripcion: 'Chocolate belga intenso', precio: 55, categoria: 'Postres', disponible: false },
  { id: 10, nombre: 'Avocado Toast', descripcion: 'Pan artesanal con aguacate', precio: 95, categoria: 'Alimentos', disponible: true },
];

// ─── Cuentas ──────────────────────────────────────────────────────────────────
export const mockCuentas = [
  {
    id: 1,
    mesa_id: 2,
    mesa: { numero: 2 },
    mesero_id: 1,
    tipo: 'en_mesa',
    estado: 'abierta',
    total: 180.00,
    abierta_en: '2025-07-04T13:05:00Z',
    detalles: [
      { id: 1, producto: { nombre: 'Latte' }, cantidad: 2, precio_unitario: 70, estado: 'listo', observaciones: 'Sin azúcar' },
      { id: 2, producto: { nombre: 'Croissant' }, cantidad: 2, precio_unitario: 45, estado: 'entregado', observaciones: null },
    ],
  },
  {
    id: 2,
    mesa_id: 4,
    mesa: { numero: 4 },
    mesero_id: 1,
    tipo: 'en_mesa',
    estado: 'por_cobrar',
    total: 310.00,
    abierta_en: '2025-07-04T12:30:00Z',
    detalles: [
      { id: 3, producto: { nombre: 'Cappuccino' }, cantidad: 2, precio_unitario: 65, estado: 'entregado', observaciones: null },
      { id: 4, producto: { nombre: 'Americano' }, cantidad: 2, precio_unitario: 45, estado: 'entregado', observaciones: 'Extra shot' },
      { id: 5, producto: { nombre: 'Cheesecake' }, cantidad: 2, precio_unitario: 65, estado: 'entregado', observaciones: null },
    ],
  },
  {
    id: 3,
    mesa_id: null,
    mesa: null,
    mesero_id: 1,
    tipo: 'para_llevar',
    estado: 'por_cobrar',
    total: 155.00,
    abierta_en: '2025-07-04T13:10:00Z',
    detalles: [
      { id: 6, producto: { nombre: 'Cold Brew' }, cantidad: 1, precio_unitario: 75, estado: 'listo', observaciones: null },
      { id: 7, producto: { nombre: 'Avocado Toast' }, cantidad: 1, precio_unitario: 95, estado: 'listo', observaciones: 'Sin chile' },
    ],
  },
  {
    id: 4,
    mesa_id: 7,
    mesa: { numero: 7 },
    mesero_id: 1,
    tipo: 'en_mesa',
    estado: 'abierta',
    total: 160.00,
    abierta_en: '2025-07-04T13:00:00Z',
    detalles: [
      { id: 8, producto: { nombre: 'Matcha Latte' }, cantidad: 2, precio_unitario: 80, estado: 'en_preparacion', observaciones: 'Extra matcha' },
    ],
  },
];

// ─── Cola Cocina ──────────────────────────────────────────────────────────────
export const mockColaCocina = [
  {
    id: 8,
    cuenta_id: 1,
    cuenta: { mesa: { numero: 2 }, tipo: 'en_mesa' },
    producto: { nombre: 'Frappuccino', categoria: 'Bebidas Frías' },
    cantidad: 1,
    precio_unitario: 85,
    estado: 'pendiente',
    observaciones: 'Leche de avena',
    creado_en: '2025-07-04T13:12:00Z',
  },
  {
    id: 9,
    cuenta_id: 7,
    cuenta: { mesa: null, tipo: 'para_llevar' },
    producto: { nombre: 'Americano', categoria: 'Bebidas Calientes' },
    cantidad: 2,
    precio_unitario: 45,
    estado: 'en_preparacion',
    observaciones: null,
    creado_en: '2025-07-04T13:08:00Z',
  },
  {
    id: 10,
    cuenta_id: 7,
    cuenta: { mesa: null, tipo: 'para_llevar' },
    producto: { nombre: 'Croissant', categoria: 'Panadería' },
    cantidad: 1,
    precio_unitario: 45,
    estado: 'pendiente',
    observaciones: null,
    creado_en: '2025-07-04T13:08:00Z',
  },
  {
    id: 11,
    cuenta_id: 4,
    cuenta: { mesa: { numero: 7 }, tipo: 'en_mesa' },
    producto: { nombre: 'Matcha Latte', categoria: 'Bebidas Frías' },
    cantidad: 2,
    precio_unitario: 80,
    estado: 'en_preparacion',
    observaciones: 'Extra matcha',
    creado_en: '2025-07-04T13:02:00Z',
  },
];

// ─── Suministros ──────────────────────────────────────────────────────────────
export const mockSuministros = [
  { id: 1, nombre: 'Café Espresso', unidad: 'kg', stock_actual: 8.5, stock_minimo: 5.0, activo: true },
  { id: 2, nombre: 'Leche Entera', unidad: 'L', stock_actual: 12.0, stock_minimo: 8.0, activo: true },
  { id: 3, nombre: 'Leche de Avena', unidad: 'L', stock_actual: 2.5, stock_minimo: 4.0, activo: true },
  { id: 4, nombre: 'Azúcar', unidad: 'kg', stock_actual: 6.0, stock_minimo: 3.0, activo: true },
  { id: 5, nombre: 'Matcha Powder', unidad: 'g', stock_actual: 180, stock_minimo: 200, activo: true },
  { id: 6, nombre: 'Crema Batida', unidad: 'L', stock_actual: 1.2, stock_minimo: 2.0, activo: true },
  { id: 7, nombre: 'Harina', unidad: 'kg', stock_actual: 10.0, stock_minimo: 5.0, activo: true },
  { id: 8, nombre: 'Mantequilla', unidad: 'kg', stock_actual: 3.0, stock_minimo: 2.0, activo: true },
  { id: 9, nombre: 'Queso Crema', unidad: 'kg', stock_actual: 1.5, stock_minimo: 2.0, activo: true },
  { id: 10, nombre: 'Aguacate', unidad: 'pz', stock_actual: 8, stock_minimo: 6, activo: true },
];

// ─── Compras ──────────────────────────────────────────────────────────────────
export const mockCompras = [
  {
    id: 1,
    proveedor: 'Café de Origen MX',
    total: 850.00,
    comprado_en: '2025-07-04T09:00:00Z',
    detalles: [
      { suministro: { nombre: 'Café Espresso' }, cantidad: 5, costo_unitario: 170 },
    ],
  },
  {
    id: 2,
    proveedor: 'Lácteos La Vaca',
    total: 420.00,
    comprado_en: '2025-07-03T10:30:00Z',
    detalles: [
      { suministro: { nombre: 'Leche Entera' }, cantidad: 12, costo_unitario: 25 },
      { suministro: { nombre: 'Crema Batida' }, cantidad: 4, costo_unitario: 60 },
    ],
  },
  {
    id: 3,
    proveedor: 'Distribuidora Vegana MX',
    total: 310.00,
    comprado_en: '2025-07-02T11:00:00Z',
    detalles: [
      { suministro: { nombre: 'Leche de Avena' }, cantidad: 6, costo_unitario: 45 },
      { suministro: { nombre: 'Matcha Powder' }, cantidad: 0.2, costo_unitario: 400 },
    ],
  },
];

// ─── Tickets ──────────────────────────────────────────────────────────────────
export const mockTickets = [
  { id: 1, folio: 'TKT-0001', cuenta_id: 2, total: 310.00, emitido_en: '2025-07-04T12:55:00Z' },
  { id: 2, folio: 'TKT-0002', cuenta_id: 3, total: 155.00, emitido_en: '2025-07-04T11:30:00Z' },
];
