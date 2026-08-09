import { api } from './client';

export async function getCompras() {
  return api.get('/compras');
}

export async function getCompra(compraId) {
  return api.get(`/compras/${compraId}`);
}

export async function createCompra({ proveedor, detalles }) {
  return api.post('/compras', { proveedor, detalles });
}