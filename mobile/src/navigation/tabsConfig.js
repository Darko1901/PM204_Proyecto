export const TABS_POR_ROL = {
  mesero: [
    { key: 'mesas', label: 'Mesas', icon: 'restaurant-outline', root: 'MesaSeleccion' },
    { key: 'cuentas', label: 'Mis cuentas', icon: 'receipt-outline', root: 'MisCuentas' },
    { key: 'perfil', label: 'Perfil', icon: 'person-outline', root: 'Perfil' },
  ],
  caja: [
    { key: 'cobros', label: 'Cobros', icon: 'card-outline', root: 'CuentasPorCobrar' },
    { key: 'compras', label: 'Compras', icon: 'cart-outline', root: 'CompraSuministros' },
    { key: 'perfil', label: 'Perfil', icon: 'person-outline', root: 'Perfil' },
  ],
  cocina: [
    { key: 'cola', label: 'Cola', icon: 'flame-outline', root: 'ColaPedidos' },
    { key: 'stock', label: 'Stock', icon: 'file-tray-stacked-outline', root: 'Stock' },
    { key: 'perfil', label: 'Perfil', icon: 'person-outline', root: 'Perfil' },
  ],
};

export const NOMBRE_ROL = {
  mesero: 'Mesero',
  caja: 'Caja',
  cocina: 'Cocina',
};
