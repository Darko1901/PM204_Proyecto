import { api } from './client';

export async function getProductos() {
  return api.get('/productos');
}