import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import BottomTabBar from './BottomTabBar';
import { TABS_POR_ROL } from './tabsConfig';

import PerfilScreen from '../screens/common/PerfilScreen';

import MesaSeleccionScreen from '../screens/mesero/MesaSeleccionScreen';
import PedidoScreen from '../screens/mesero/PedidoScreen';
import MisCuentasScreen from '../screens/mesero/MisCuentasScreen';
import EstadoCuentaScreen from '../screens/mesero/EstadoCuentaScreen';

import CuentasPorCobrarScreen from '../screens/caja/CuentasPorCobrarScreen';
import CobroScreen from '../screens/caja/CobroScreen';
import TicketScreen from '../screens/caja/TicketScreen';
import CompraSuministrosScreen from '../screens/caja/CompraSuministrosScreen';

import ColaPedidosScreen from '../screens/cocina/ColaPedidosScreen';
import DetalleItemScreen from '../screens/cocina/DetalleItemScreen';
import StockScreen from '../screens/cocina/StockScreen';

const SCREEN_COMPONENTS = {
  Perfil: PerfilScreen,
  MesaSeleccion: MesaSeleccionScreen,
  Pedido: PedidoScreen,
  MisCuentas: MisCuentasScreen,
  EstadoCuenta: EstadoCuentaScreen,
  CuentasPorCobrar: CuentasPorCobrarScreen,
  Cobro: CobroScreen,
  Ticket: TicketScreen,
  CompraSuministros: CompraSuministrosScreen,
  ColaPedidos: ColaPedidosScreen,
  DetalleItem: DetalleItemScreen,
  Stock: StockScreen,
};

export default function AppNavigator({ session, onLogout }) {
  const tabs = TABS_POR_ROL[session.rol] || [];

  const [activeKey, setActiveKey] = useState(tabs[0]?.key);
  const [stacks, setStacks] = useState(() => {
    const inicial = {};
    tabs.forEach((tab) => {
      inicial[tab.key] = [{ screen: tab.root, params: {} }];
    });
    return inicial;
  });

  const stackActual = stacks[activeKey] || [];
  const actual = stackActual[stackActual.length - 1];

  const navigate = (screen, params = {}, options = {}) => {
    setStacks((prev) => {
      const stack = prev[activeKey] || [];
      let siguienteStack;
      if (options.reset) {
        siguienteStack = [{ screen, params }];
      } else if (options.replace) {
        siguienteStack = [...stack.slice(0, -1), { screen, params }];
      } else {
        siguienteStack = [...stack, { screen, params }];
      }
      return { ...prev, [activeKey]: siguienteStack };
    });
  };

  const goBack = () => {
    setStacks((prev) => {
      const stack = prev[activeKey] || [];
      if (stack.length <= 1) return prev;
      return { ...prev, [activeKey]: stack.slice(0, -1) };
    });
  };

  const cambiarTab = (key) => setActiveKey(key);

  const ScreenComponent = SCREEN_COMPONENTS[actual?.screen];

  return (
    <View style={styles.flex}>
      <View style={styles.content}>
        {ScreenComponent ? (
          <ScreenComponent
            session={session}
            onLogout={onLogout}
            params={actual.params}
            navigate={navigate}
            goBack={stackActual.length > 1 ? goBack : undefined}
          />
        ) : null}
      </View>
      <BottomTabBar tabs={tabs} activeKey={activeKey} onSelect={cambiarTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
});
