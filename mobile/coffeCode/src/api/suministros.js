import { api } from './client';

export async function getSuministros() {
  return api.get('/suministros');
}

export async function ajustarSuministro(suministroId, { cantidad, tipo, motivo }) {
  return api.post(`/suministros/${suministroId}/ajuste`, { cantidad, tipo, motivo });
}