import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import ScalePressable from '../../components/ScalePressable';
import { mockMesas, mockColaCocina, mockCuentas } from '../../data/mockData';

const ROL_CONFIG = {
  mesero: {
    icon: 'restaurant-outline',
    color: '#5B9BD5',
    label: 'Módulo Mesero',
    desc: 'Mesas, cuentas y pedidos',
    route: 'Mesero',
    acciones: [
      { icon: 'restaurant-outline', label: 'Mis Mesas', route: 'ListaMesas' },
      { icon: 'receipt-outline', label: 'Mis Cuentas', route: 'MisCuentas' },
      { icon: 'book-outline', label: 'Ver Menú', route: 'Menu' },
    ],
  },
  cocina: {
    icon: 'flame-outline',
    color: '#F0A500',
    label: 'Módulo Cocina',
    desc: 'Pedidos, preparación e inventario',
    route: 'Cocina',
    acciones: [
      { icon: 'list-outline', label: 'Cola de Pedidos', route: 'ColaPedidos' },
      { icon: 'cube-outline', label: 'Inventario', route: 'Inventario' },
      { icon: 'warning-outline', label: 'Alertas Stock', route: 'AlertasStock' },
    ],
  },
  caja: {
    icon: 'cash-outline',
    color: '#4CAF7D',
    label: 'Módulo Caja',
    desc: 'Cobros, gastos y compras',
    route: 'Caja',
    acciones: [
      { icon: 'cash-outline', label: 'Cuentas x Cobrar', route: 'CuentasPorCobrar' },
      { icon: 'cart-outline', label: 'Registrar Compra', route: 'RegistrarCompra' },
      { icon: 'document-text-outline', label: 'Historial Compras', route: 'HistorialCompras' },
    ],
  },
  administrador: {
    icon: 'settings-outline',
    color: colors.primary,
    label: 'Administrador',
    desc: 'Gestión completa del sistema',
    route: null,
    acciones: [],
  },
};

const ESTADO_ITEMS_COLORS = {
  pendiente: colors.textMuted,
  en_preparacion: colors.warning,
  listo: colors.success,
  entregado: colors.info,
  cancelado: colors.danger,
};

const ESTADO_ITEMS_LABELS = {
  pendiente: 'Pendiente',
  en_preparacion: 'En prep.',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export default function HomeScreen({ route, navigation }) {
  const { usuario } = route.params;
  const rolNombre = usuario.rol.nombre;
  const config = ROL_CONFIG[rolNombre] || ROL_CONFIG.administrador;
  const isFocused = useIsFocused();

  // Agrupar pedidos activos por cuenta_id
  const pedidosActivosRaw = mockColaCocina.filter(i => i.estado !== 'listo' && i.estado !== 'entregado');
  const pedidosAgrupados = [];

  pedidosActivosRaw.forEach(item => {
    let grupo = pedidosAgrupados.find(g => g.cuenta_id === item.cuenta_id);
    if (!grupo) {
      grupo = {
        cuenta_id: item.cuenta_id,
        tipo: item.cuenta.tipo,
        mesaNumero: item.cuenta.mesa?.numero,
        estadoGeneral: item.estado,
        items: []
      };
      pedidosAgrupados.push(grupo);
    }
    grupo.items.push(item);
    
    // Si algún producto de la mesa ya está en preparación, marcar el estatus general como en_preparacion
    if (item.estado === 'en_preparacion') {
      grupo.estadoGeneral = 'en_preparacion';
    }
  });

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.saludo}>{saludo},</Text>
          <Text style={styles.nombre}>{usuario.nombre_completo.split(' ')[0]}</Text>
        </View>
        <ScalePressable
          style={styles.perfilBtn}
          onPress={() => navigation.navigate('Perfil', { usuario })}
        >
          <View style={[styles.avatarCircle, { borderColor: config.color }]}>
            <Ionicons name={config.icon} size={22} color={config.color} />
          </View>
        </ScalePressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          (rolNombre === 'mesero' || rolNombre === 'cocina' || rolNombre === 'caja') && styles.scrollBottomPadding
        ]}
      >



        {/* Accesos rápidos / Mesas Activas */}
        {/* Módulo Mesero - Mesas Activas */}
        {rolNombre === 'mesero' && (
          <>
            <Text style={styles.sectionTitle}>Mesas Activas</Text>
            {mockMesas.filter(m => m.activa && m.ocupada).length > 0 ? (
              <View style={styles.pedidosList}>
                {mockMesas
                  .filter(m => m.activa && m.ocupada)
                  .map((item) => {
                    const cuentaMesa = mockCuentas.find(c => c.mesa_id === item.id && c.estado !== 'pagada' && c.estado !== 'cancelada');
                    const estadoLabel = cuentaMesa
                      ? (cuentaMesa.estado === 'por_cobrar' ? 'Por cobrar' : 'Abierta')
                      : 'Ocupada';
                    const estadoColor = cuentaMesa
                      ? (cuentaMesa.estado === 'por_cobrar' ? colors.warning : colors.success)
                      : colors.danger;

                    return (
                      <ScalePressable
                        key={item.id}
                        style={styles.pedidoItemCard}
                        onPress={() => navigation.navigate('DetalleCuenta', { mesa: item, usuario })}
                      >
                        <View style={styles.pedidoHeader}>
                          <Text style={styles.pedidoTitle}>Mesa {item.numero}</Text>
                          <View style={[styles.pedidoStatusBadge, { backgroundColor: estadoColor + '22' }]}>
                            <Text style={[styles.pedidoStatusText, { color: estadoColor }]}>
                              {estadoLabel}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.pedidoDivider} />

                        {cuentaMesa && cuentaMesa.detalles && cuentaMesa.detalles.length > 0 ? (
                          <View style={styles.pedidoItemsList}>
                            {cuentaMesa.detalles.map((d, i) => {
                              const itemColor = ESTADO_ITEMS_COLORS[d.estado] || colors.textMuted;
                              const itemLabel = ESTADO_ITEMS_LABELS[d.estado] || d.estado;
                              return (
                                <View key={d.id || i} style={styles.pedidoItemRow}>
                                  <Text style={styles.pedidoItemBullet}>•</Text>
                                  <View style={[styles.pedidoItemContent, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                                    <Text style={styles.pedidoItemText}>
                                      {d.cantidad}x {d.producto.nombre}
                                    </Text>
                                    <View style={[styles.estadoItemBadge, { backgroundColor: itemColor + '15' }]}>
                                      <Text style={[styles.estadoItemText, { color: itemColor }]}>
                                        {itemLabel}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        ) : (
                          <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic' }}>
                            Sin productos asignados
                          </Text>
                        )}
                      </ScalePressable>
                    );
                  })}
              </View>
            ) : (
              <View style={styles.emptyMesasContainer}>
                <Ionicons name="cafe-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyMesasTitle}>No hay mesas ocupadas</Text>
                <Text style={styles.emptyMesasSubtitle}>Todas las mesas se encuentran libres.</Text>
              </View>
            )}
          </>
        )}

        {/* Módulo Cocina - Pedidos Activos */}
        {rolNombre === 'cocina' && (
          <>
            {/* Listado de Pedidos Activos Agrupados */}
            <Text style={styles.sectionTitle}>Pedidos Activos</Text>
            {pedidosAgrupados.length > 0 ? (
              <View style={styles.pedidosList}>
                {pedidosAgrupados.map((pedido) => {
                  const deMesa = pedido.tipo === 'en_mesa';
                  const labelMesa = deMesa ? `Mesa ${pedido.mesaNumero ?? '?'}` : 'Para Llevar';
                  const estadoColor = pedido.estadoGeneral === 'pendiente' ? colors.warning : colors.info;
                  const estadoLabel = pedido.estadoGeneral === 'pendiente' ? 'Pendiente' : 'En prep.';

                  return (
                    <ScalePressable
                      key={pedido.cuenta_id}
                      style={styles.pedidoItemCard}
                      onPress={() => navigation.navigate('DetallePedidoCocina', { pedido, usuario })}
                    >
                      {/* Cabecera del pedido */}
                      <View style={styles.pedidoHeader}>
                        <Text style={styles.pedidoTitle}>{labelMesa}</Text>
                        <View style={[styles.pedidoStatusBadge, { backgroundColor: estadoColor + '22' }]}>
                          <Text style={[styles.pedidoStatusText, { color: estadoColor }]}>
                            {estadoLabel}
                          </Text>
                        </View>
                      </View>

                      {/* Línea divisoria */}
                      <View style={styles.pedidoDivider} />

                      {/* Listado de productos de la comanda */}
                      <View style={styles.pedidoItemsList}>
                        {pedido.items.map((prod) => (
                          <View key={prod.id} style={styles.pedidoItemRow}>
                            <Text style={styles.pedidoItemBullet}>•</Text>
                            <View style={styles.pedidoItemContent}>
                              <Text style={styles.pedidoItemText}>
                                {prod.cantidad}x {prod.producto.nombre}
                              </Text>
                              {prod.observaciones && (
                                <Text style={styles.pedidoItemObs}>
                                  Nota: {prod.observaciones}
                                </Text>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    </ScalePressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyMesasContainer}>
                <Ionicons name="checkmark-circle-outline" size={32} color={colors.success} />
                <Text style={styles.emptyMesasTitle}>¡Todo al día!</Text>
                <Text style={styles.emptyMesasSubtitle}>No hay pedidos activos en cocina.</Text>
              </View>
            )}
          </>
        )}

        {/* Módulo Caja - Cuentas por Cobrar */}
        {rolNombre === 'caja' && (
          <>
            <Text style={styles.sectionTitle}>Cuentas por Cobrar</Text>
            
            {/* Resumen rápido de caja */}
            <View style={styles.cajaResumenCard}>
              <View style={styles.cajaResumenItem}>
                <Text style={styles.cajaResumenNum}>
                  {mockCuentas.filter(c => c.estado === 'por_cobrar').length}
                </Text>
                <Text style={styles.cajaResumenLbl}>Cuentas</Text>
              </View>
              <View style={styles.cajaResumenDivider} />
              <View style={styles.cajaResumenItem}>
                <Text style={[styles.cajaResumenNum, { color: colors.primary }]}>
                  ${mockCuentas.filter(c => c.estado === 'por_cobrar').reduce((s, c) => s + c.total, 0).toFixed(2)}
                </Text>
                <Text style={styles.cajaResumenLbl}>Total pendiente</Text>
              </View>
            </View>

            {/* Listado de cuentas */}
            {mockCuentas.filter(c => c.estado === 'por_cobrar').length > 0 ? (
              <View style={styles.cajaCuentasList}>
                {mockCuentas
                  .filter(c => c.estado === 'por_cobrar')
                  .map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.cajaCard}
                      onPress={() => navigation.navigate('RegistrarPago', { cuenta: item, usuario })}
                      activeOpacity={0.75}
                    >
                      {/* Header de la tarjeta */}
                      <View style={styles.cajaCardHeader}>
                        <View style={styles.cajaCardTipoRow}>
                          <Ionicons
                            name={item.tipo === 'en_mesa' ? 'restaurant' : 'bag'}
                            size={16}
                            color={colors.primary}
                          />
                          <Text style={styles.cajaCardTitulo}>
                            {item.tipo === 'en_mesa' ? `Mesa ${item.mesa?.numero}` : 'Para Llevar'}
                          </Text>
                        </View>
                        <View style={styles.cajaEsperandoBadge}>
                          <Ionicons name="time-outline" size={12} color={colors.warning} />
                          <Text style={styles.cajaEsperandoText}>
                            {(() => {
                              const mins = Math.floor((new Date() - new Date(item.abierta_en)) / 60000);
                              if (mins < 60) return `${mins} min`;
                              return `${Math.floor(mins / 60)}h ${mins % 60}m`;
                            })()}
                          </Text>
                        </View>
                      </View>

                      {/* Ítems de la cuenta */}
                      <View style={styles.cajaItemsPreview}>
                        {item.detalles.map((d, i) => (
                          <View key={i} style={styles.cajaItemRow}>
                            <Text style={styles.cajaItemNombre}>{d.producto.nombre}</Text>
                            <Text style={styles.cajaItemQty}>×{d.cantidad}</Text>
                            <Text style={styles.cajaItemPrecio}>${(d.precio_unitario * d.cantidad).toFixed(2)}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Total + Acción */}
                      <View style={styles.cajaCardFooter}>
                        <View>
                          <Text style={styles.cajaTotalLabel}>Total</Text>
                          <Text style={styles.cajaTotalValor}>${item.total.toFixed(2)}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.cajaCobrarBtn}
                          onPress={() => navigation.navigate('RegistrarPago', { cuenta: item, usuario })}
                        >
                          <Ionicons name="cash-outline" size={16} color={colors.bg} />
                          <Text style={styles.cajaCobrarBtnText}>Cobrar</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            ) : (
              <View style={styles.cajaEmptyContainer}>
                <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                <Text style={styles.cajaEmptyTitle}>Todo cobrado</Text>
                <Text style={styles.cajaEmptySubtitle}>No hay cuentas pendientes de pago.</Text>
              </View>
            )}
          </>
        )}

        {/* Acceso Rápido General (Administrador) */}
        {rolNombre === 'administrador' && (
          <>
            <Text style={styles.sectionTitle}>Acceso Rápido</Text>
            <View style={styles.accionesGrid}>
              {config.acciones.map((accion, i) => (
                <ScalePressable
                  key={i}
                  style={styles.accionCard}
                  onPress={() => navigation.navigate(accion.route, { usuario })}
                >
                  <View style={[styles.accionIcon, { backgroundColor: config.color + '22' }]}>
                    <Ionicons name={accion.icon} size={26} color={config.color} />
                  </View>
                  <Text style={styles.accionLabel}>{accion.label}</Text>
                </ScalePressable>
              ))}
            </View>
          </>
        )}


      </ScrollView>

      {/* Botón Flotante de Crear Pedido (Solo para Mesero) */}
      {rolNombre === 'mesero' && (
        <ScalePressable
          style={styles.fabButton}
          onPress={() => navigation.navigate('ListaMesas', { usuario, soloDisponibles: true })}
        >
          <Ionicons name="add" size={28} color={colors.bg} />
        </ScalePressable>
      )}

      {/* Barra de Navegación Inferior para Cocina */}
      {rolNombre === 'cocina' && (
        <View style={styles.bottomBar}>
          <ScalePressable
            style={styles.bottomBarTab}
            onPress={() => {}} // Ya se encuentra en pedidos
          >
            <Ionicons name="list" size={22} color={colors.primary} />
            <Text style={[styles.bottomBarTabText, { color: colors.primary }]}>Pedidos</Text>
          </ScalePressable>

          <ScalePressable
            style={styles.bottomBarTab}
            onPress={() => navigation.navigate('Inventario', { usuario })}
          >
            <Ionicons name="cube-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.bottomBarTabText}>Inventario</Text>
          </ScalePressable>

          <ScalePressable
            style={styles.bottomBarTab}
            onPress={() => navigation.navigate('AlertasStock', { usuario })}
          >
            <Ionicons name="warning-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.bottomBarTabText}>Alertas</Text>
          </ScalePressable>
        </View>
      )}

      {/* Barra de Navegación Inferior para Caja */}
      {rolNombre === 'caja' && (
        <View style={styles.bottomBar}>
          <ScalePressable
            style={styles.bottomBarTab}
            onPress={() => {}} // Ya se encuentra en inicio
          >
            <Ionicons name="cash" size={22} color={colors.primary} />
            <Text style={[styles.bottomBarTabText, { color: colors.primary }]}>Cobros</Text>
          </ScalePressable>

          <ScalePressable
            style={styles.bottomBarTab}
            onPress={() => navigation.navigate('RegistrarCompra', { usuario })}
          >
            <Ionicons name="cart-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.bottomBarTabText}>Reg. Compra</Text>
          </ScalePressable>

          <ScalePressable
            style={styles.bottomBarTab}
            onPress={() => navigation.navigate('HistorialCompras', { usuario })}
          >
            <Ionicons name="document-text-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.bottomBarTabText}>Historial</Text>
          </ScalePressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + spacing.md,
    paddingBottom: spacing.md,
  },
  saludo: { fontSize: fontSize.sm, color: colors.textMuted },
  nombre: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary },
  perfilBtn: { padding: spacing.xs },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },

  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  scrollBottomPadding: { paddingBottom: 90 },

  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  accionesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  accionCard: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  accionIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  accionLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },

  mesasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
    marginBottom: spacing.lg,
  },
  mesaCard: {
    width: '48%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  mesaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mesaNumber: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  badgeDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    gap: 3,
  },
  dotDanger: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.danger,
  },
  badgeDangerText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.danger,
  },
  badgeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    gap: 3,
  },
  dotWarning: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.warning,
  },
  badgeWarningText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.warning,
  },
  mesaBody: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  mesaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  verCuentaText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyMesasContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  emptyMesasTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyMesasSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  pedidosList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  pedidoItemCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pedidoTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pedidoStatusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  pedidoStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pedidoDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  pedidoItemsList: {
    gap: 6,
  },
  pedidoItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pedidoItemBullet: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginRight: 6,
  },
  pedidoItemContent: {
    flex: 1,
  },
  pedidoItemText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  pedidoItemObs: {
    fontSize: 11,
    color: colors.primaryLight,
    marginTop: 2,
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: spacing.lg,
  },
  bottomBarTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    width: 70,
    height: '100%',
  },
  bottomBarTabText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  cajaResumenCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cajaResumenItem: { flex: 1, alignItems: 'center' },
  cajaResumenNum: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textPrimary },
  cajaResumenLbl: { fontSize: fontSize.xs, color: colors.textMuted },
  cajaResumenDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  cajaCuentasList: { gap: spacing.md, marginBottom: spacing.lg },
  cajaCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cajaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCardLight,
  },
  cajaCardTipoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cajaCardTitulo: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  cajaEsperandoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warning + '22',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  cajaEsperandoText: { fontSize: fontSize.xs, color: colors.warning, fontWeight: '600' },
  cajaItemsPreview: { padding: spacing.md, gap: spacing.xs },
  cajaItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cajaItemNombre: { flex: 1, fontSize: fontSize.sm, color: colors.textSecondary },
  cajaItemQty: { fontSize: fontSize.sm, color: colors.textMuted, marginRight: spacing.sm },
  cajaItemPrecio: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: '600', minWidth: 60, textAlign: 'right' },
  cajaCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  cajaTotalLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  cajaTotalValor: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary },
  cajaCobrarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cajaCobrarBtnText: { color: colors.bg, fontWeight: '700', fontSize: fontSize.sm },
  cajaEmptyContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  cajaEmptyTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  cajaEmptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  estadoItemBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  estadoItemText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
