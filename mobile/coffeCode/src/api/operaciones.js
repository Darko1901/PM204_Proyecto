import { api } from './client';

export async function getMesas() {
  return api.get('/mesas');
}

export async function getCuentas(params = {}) {
  const query = new URLSearchParams(params).toString();
  return api.get(`/cuentas${query ? `?${query}` : ''}`);
}

export async function getCuenta(cuentaId) {
  return api.get(`/cuentas/${cuentaId}`);
}

export async function createCuenta({ mesa_id, tipo, detalles }) {
  return api.post('/cuentas', { mesa_id, tipo, detalles });
}

export async function addDetalles(cuentaId, detalles) {
  return api.post(`/cuentas/${cuentaId}/detalles`, detalles);
}

// Solicitar cobro: abierta -> por_cobrar
export async function cerrarCuenta(cuentaId) {
  return api.patch(`/cuentas/${cuentaId}/cerrar`);
}

export async function pagarCuenta(cuentaId, metodo) {
  return api.post(`/cuentas/${cuentaId}/pagar`, { metodo });
}

export async function getTicket(cuentaId) {
  return api.get(`/cuentas/${cuentaId}/ticket`);
}