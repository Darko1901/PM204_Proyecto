const API_BASE_URL = 'http://localhost:8000';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMsg = 'Error en la petición';
    try {
      const errData = await response.json();
      errorMsg = errData.detail || errData.message || errorMsg;
      if (Array.isArray(errorMsg)) {
        // En caso de que FastAPI devuelva errores de validación en lista
        errorMsg = errorMsg.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', ');
      }
    } catch (e) {
      // Si no es JSON, capturar error genérico o texto
      try {
        const text = await response.text();
        if (text) errorMsg = text;
      } catch (_) {}
    }
    
    // Si da 410 o 401, limpiar token para forzar login
    if (response.status === 401) {
      localStorage.removeItem('token');
    }
    
    throw new Error(errorMsg);
  }
  
  if (response.status === 204) {
    return null;
  }
  return response.json();
};

export const api = {
  // --- AUTH ---
  login: async (username, password) => {
    // Form URL Encoded para OAuth2PasswordRequestForm
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    return handleResponse(response);
  },
  
  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // --- ROLES ---
  getRoles: async () => {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  crearRol: async (data) => {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  actualizarRol: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  eliminarRol: async (id) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'DELETE', headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getRecetasByProducto: async (productoId) => {
    const response = await fetch(`${API_BASE_URL}/productos/${productoId}/receta`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  agregarReceta: async (productoId, data) => {
    const response = await fetch(`${API_BASE_URL}/productos/${productoId}/receta`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  eliminarReceta: async (recetaId) => {
    const response = await fetch(`${API_BASE_URL}/productos/recetas/${recetaId}`, {
      method: 'DELETE', headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // --- USUARIOS ---
  getUsuarios: async (activo = null, rolId = null) => {
    let url = `${API_BASE_URL}/usuarios?limit=100`;
    if (activo !== null) url += `&activo=${activo}`;
    if (rolId !== null) url += `&rol_id=${rolId}`;
    
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  
  getUsuario: async (id) => {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  
  crearUsuario: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },
  
  actualizarUsuario: async (id, userData) => {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },
  
  cambiarEstadoUsuario: async (id, activo) => {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}/estado`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ activo }),
    });
    return handleResponse(response);
  },
  
  resetearPasswordUsuario: async (id, password) => {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}/password`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ password }),
    });
    return handleResponse(response);
  },

  // --- PRODUCTOS ---
  getProductos: async (categoria = null, disponible = null) => {
    let url = `${API_BASE_URL}/productos`;
    const params = [];
    if (categoria) params.push(`categoria=${encodeURIComponent(categoria)}`);
    if (disponible !== null) params.push(`disponible=${disponible}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  
  getProducto: async (id) => {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  
  crearProducto: async (productData) => {
    const response = await fetch(`${API_BASE_URL}/productos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData),
    });
    return handleResponse(response);
  },
  
  actualizarProducto: async (id, productData) => {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(productData),
    });
    return handleResponse(response);
  },
  
  eliminarProducto: async (id) => {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // --- INSUMOS / SUMINISTROS ---
  getSuministros: async (activo = null) => {
    let url = `${API_BASE_URL}/suministros`;
    if (activo !== null) url += `?activo=${activo}`;
    
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  
  crearSuministro: async (sumData) => {
    const response = await fetch(`${API_BASE_URL}/suministros`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(sumData),
    });
    return handleResponse(response);
  },
  
  actualizarSuministro: async (id, sumData) => {
    const response = await fetch(`${API_BASE_URL}/suministros/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(sumData),
    });
    return handleResponse(response);
  },
  
  ajustarInventario: async (id, cantidad, tipo, motivo) => {
    const response = await fetch(`${API_BASE_URL}/suministros/${id}/ajuste`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ cantidad, tipo, motivo }),
    });
    return handleResponse(response);
  },
  
  getMovimientosInventario: async (sumId = null, tipo = null) => {
    let url = `${API_BASE_URL}/suministros/movimientos`;
    const params = [];
    if (sumId) params.push(`suministro_id=${sumId}`);
    if (tipo) params.push(`tipo=${tipo}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // --- COMPRAS (GASTOS INSUMOS) ---
  getCompras: async () => {
    const response = await fetch(`${API_BASE_URL}/compras`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  
  getCompra: async (id) => {
    const response = await fetch(`${API_BASE_URL}/compras/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  
  registrarCompra: async (compraData) => {
    const response = await fetch(`${API_BASE_URL}/compras`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(compraData),
    });
    return handleResponse(response);
  },

  // --- MESAS Y POS ---
  getMesas: async () => {
    const response = await fetch(`${API_BASE_URL}/mesas`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  
  crearMesa: async (numero, capacidad = 4) => {
    const response = await fetch(`${API_BASE_URL}/mesas?numero=${numero}&capacidad=${capacidad}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  
  getCuentas: async (estado = null) => {
    let url = `${API_BASE_URL}/cuentas`;
    if (estado) url += `?estado=${estado}`;
    
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  
  getCuenta: async (id) => {
    const response = await fetch(`${API_BASE_URL}/cuentas/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  
  crearCuenta: async (cuentaData) => {
    const response = await fetch(`${API_BASE_URL}/cuentas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(cuentaData),
    });
    return handleResponse(response);
  },
  
  agregarDetallesCuenta: async (cuentaId, detalles) => {
    const response = await fetch(`${API_BASE_URL}/cuentas/${cuentaId}/detalles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(detalles),
    });
    return handleResponse(response);
  },
  
  actualizarDetalleCuenta: async (detalleId, updateData) => {
    const response = await fetch(`${API_BASE_URL}/cuentas/detalles/${detalleId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updateData),
    });
    return handleResponse(response);
  },
  
  cerrarCuenta: async (cuentaId) => {
    const response = await fetch(`${API_BASE_URL}/cuentas/${cuentaId}/cerrar`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  
  pagarCuenta: async (cuentaId, metodoPago) => {
    const response = await fetch(`${API_BASE_URL}/cuentas/${cuentaId}/pagar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ metodo: metodoPago }),
    });
    return handleResponse(response);
  },
  
  getTicket: async (cuentaId) => {
    const response = await fetch(`${API_BASE_URL}/cuentas/${cuentaId}/ticket`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // --- PEDIDOS (historial de cuentas) ---
  getPedidos: async (estado = 'pagado') => {
    let url = `${API_BASE_URL}/cuentas`;
    if (estado) url += `?estado=${estado}`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // --- ESTADISTICAS ---
  getEstadisticas: async (dias = 30) => {
    const response = await fetch(`${API_BASE_URL}/estadisticas?dias=${dias}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};
