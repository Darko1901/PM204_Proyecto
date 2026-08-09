import { api } from './client';
import { getCuentas } from './operaciones';

// Cola de cocina: estado separado por coma (pendiente,en_preparacion)
export async function getItems(estado) {
  const query = estado ? `?estado=${encodeURIComponent(estado)}` : '';
  return api.get(`/items${query}`);
}

// Cambio de estado (cocina/mesero). Al pasar a "listo", el API descuenta inventario.
export async function changeItemEstado(itemId, estado) {
  return api.patch(`/items/${itemId}/estado`, { estado });
}

// Cola de cocina "enriquecida": toma /cuentas (que traen producto_nombre y
// mesa_numero) y extrae los ítems en estados activos, ordenados por antigüedad.
export async function getColaCocina(estados = ['pendiente', 'en_preparacion']) {
  const cuentas = await getCuentas();
  const items = [];

  for (const cuenta of cuentas) {
    for (const d of cuenta.detalles || []) {
      if (estados.includes(d.estado)) {
        items.push({
          id: d.id,
          cuenta_id: cuenta.id,
          cuenta: {
            tipo: cuenta.tipo,
            mesa: { numero: cuenta.mesa_numero },
          },
          producto: {
            nombre: d.producto_nombre || d.producto?.nombre,
          },
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          estado: d.estado,
          observaciones: d.observaciones,
          creado_en: d.creado_en || cuenta.abierta_en,
        });
      }
    }
  }

  return items.sort((a, b) => new Date(a.creado_en) - new Date(b.creado_en));
}