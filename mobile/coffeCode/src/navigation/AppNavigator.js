import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';

// Shared
import HomeScreen from '../screens/shared/HomeScreen';
import PerfilScreen from '../screens/shared/PerfilScreen';

// Mesero
import ListaMesasScreen from '../screens/mesero/ListaMesasScreen';
import AbrirCuentaScreen from '../screens/mesero/AbrirCuentaScreen';
import MenuScreen from '../screens/mesero/MenuScreen';
import DetalleCuentaScreen from '../screens/mesero/DetalleCuentaScreen';
import MisCuentasScreen from '../screens/mesero/MisCuentasScreen';
import ConfirmarPedidoScreen from '../screens/mesero/ConfirmarPedidoScreen';

// Cocina
import DetalleItemScreen from '../screens/cocina/DetalleItemScreen';
import InventarioScreen from '../screens/cocina/InventarioScreen';
import AlertasStockScreen from '../screens/cocina/AlertasStockScreen';
import DetallePedidoCocinaScreen from '../screens/cocina/DetallePedidoCocinaScreen';
import ColaPedidosScreen from '../screens/cocina/ColaPedidosScreen';

// Caja
import RegistrarPagoScreen from '../screens/caja/RegistrarPagoScreen';
import TicketScreen from '../screens/caja/TicketScreen';
import RegistrarCompraScreen from '../screens/caja/RegistrarCompraScreen';
import HistorialComprasScreen from '../screens/caja/HistorialComprasScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false, animation: 'none' }}
      >
        {/* ── Auth ── */}
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* ── Shared ── */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />

        {/* ── Mesero ── */}
        <Stack.Screen name="ListaMesas" component={ListaMesasScreen} />
        <Stack.Screen name="AbrirCuenta" component={AbrirCuentaScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="DetalleCuenta" component={DetalleCuentaScreen} />
        <Stack.Screen name="MisCuentas" component={MisCuentasScreen} />
        <Stack.Screen name="ConfirmarPedido" component={ConfirmarPedidoScreen} />

        {/* ── Cocina ── */}
        <Stack.Screen name="DetalleItem" component={DetalleItemScreen} />
        <Stack.Screen name="Inventario" component={InventarioScreen} />
        <Stack.Screen name="AlertasStock" component={AlertasStockScreen} />
        <Stack.Screen name="DetallePedidoCocina" component={DetallePedidoCocinaScreen} />
        <Stack.Screen name="ColaPedidos" component={ColaPedidosScreen} />

        {/* ── Caja ── */}
        <Stack.Screen name="RegistrarPago" component={RegistrarPagoScreen} />
        <Stack.Screen name="Ticket" component={TicketScreen} />
        <Stack.Screen name="RegistrarCompra" component={RegistrarCompraScreen} />
        <Stack.Screen name="HistorialCompras" component={HistorialComprasScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
