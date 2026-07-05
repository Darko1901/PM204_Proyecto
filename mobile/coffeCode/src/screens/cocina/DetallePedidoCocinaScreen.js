import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import ScalePressable from '../../components/ScalePressable';
import { mockColaCocina, mockCuentas } from '../../data/mockData';

export default function DetallePedidoCocinaScreen({ route, navigation }) {
  const { pedido, usuario } = route.params || {};
  const [items, setItems] = useState(pedido?.items || []);
  const [loadingItemId, setLoadingItemId] = useState(null);

  const actualizarEstadoItem = (itemId, nuevoEstado) => {
    setLoadingItemId(itemId);
    setTimeout(() => {
      // Actualizar en el mock global en memoria
      const itemReal = mockColaCocina.find(i => i.id === itemId);
      if (itemReal) {
        itemReal.estado = nuevoEstado;

        // Sincronizar estado en mockCuentas
        const cuentaObj = mockCuentas.find(c => c.id === itemReal.cuenta_id);
        if (cuentaObj && cuentaObj.detalles) {
          const det = cuentaObj.detalles.find(d => 
            d.producto.nombre === itemReal.producto.nombre && 
            d.estado !== 'entregado'
          );
          if (det) {
            det.estado = nuevoEstado;
          }
        }
      }
      // Actualizar en el estado local de la pantalla
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, estado: nuevoEstado } : i));
      setLoadingItemId(null);
    }, 600);
  };

  const entregarPedido = () => {
    items.forEach(item => {
      const real = mockColaCocina.find(i => i.id === item.id);
      if (real) {
        real.estado = 'entregado';

        // Sincronizar estado en mockCuentas
        const cuentaObj = mockCuentas.find(c => c.id === real.cuenta_id);
        if (cuentaObj && cuentaObj.detalles) {
          const det = cuentaObj.detalles.find(d => 
            d.producto.nombre === real.producto.nombre && 
            d.estado !== 'entregado'
          );
          if (det) {
            det.estado = 'entregado';
          }
        }
      }
    });
    Alert.alert(
      'Pedido Entregado',
      'Todos los productos de la orden han sido marcados como entregados.',
      [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
    );
  };

  const deMesa = pedido?.tipo === 'en_mesa';
  const labelMesa = deMesa ? `Mesa ${pedido?.mesaNumero ?? '?'}` : 'Para Llevar';

  // Calcular estado general localmente
  const tieneEnPrep = items.some(i => i.estado === 'en_preparacion');
  const todosListos = items.length > 0 && items.every(i => i.estado === 'listo' || i.estado === 'entregado');
  
  let estadoGeneral = 'pendiente';
  if (todosListos) {
    estadoGeneral = 'listo';
  } else if (tieneEnPrep || items.some(i => i.estado === 'listo')) {
    estadoGeneral = 'en_preparacion';
  }

  const estadoColors = {
    pendiente: colors.warning,
    en_preparacion: colors.info,
    listo: colors.success,
    entregado: colors.textMuted,
  };

  const estadoLabels = {
    pendiente: 'Pendiente',
    en_preparacion: 'En Prep.',
    listo: 'Listo',
    entregado: 'Entregado',
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de Pedido</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View>
            <Text style={styles.infoSubtitle}>Origen de Orden</Text>
            <Text style={styles.infoTitle}>{labelMesa}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: estadoColors[estadoGeneral] + '22', borderColor: estadoColors[estadoGeneral] + '44', borderWidth: 1 }]}>
            <Text style={[styles.badgeText, { color: estadoColors[estadoGeneral] }]}>
              {estadoLabels[estadoGeneral]}
            </Text>
          </View>
        </View>

        {/* Productos Title */}
        <Text style={styles.sectionTitle}>Productos en Comanda</Text>

        {/* List of Products */}
        <View style={styles.itemsContainer}>
          {items.map((item) => {
            const isPendiente = item.estado === 'pendiente';
            const isEnPrep = item.estado === 'en_preparacion';
            const isListo = item.estado === 'listo';
            const isEntregado = item.estado === 'entregado';

            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemRow}>
                  {/* Cantidad y Nombre */}
                  <View style={styles.itemHeaderLeft}>
                    <Text style={styles.itemCant}>{item.cantidad}x</Text>
                    <View style={styles.itemMeta}>
                      <Text style={styles.itemName}>{item.producto.nombre}</Text>
                      <Text style={styles.itemCat}>{item.producto.categoria}</Text>
                    </View>
                  </View>

                  {/* Estado Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: estadoColors[item.estado] + '22' }]}>
                    <Text style={[styles.statusBadgeText, { color: estadoColors[item.estado] }]}>
                      {estadoLabels[item.estado]}
                    </Text>
                  </View>
                </View>

                {/* Observaciones / Notas */}
                {item.observaciones && (
                  <View style={styles.obsBox}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.primaryLight} />
                    <Text style={styles.obsText} numberOfLines={2}>
                      {item.observaciones}
                    </Text>
                  </View>
                )}

                {/* Botón de acción */}
                {!isEntregado && (
                  <ScalePressable
                    style={[
                      styles.actionBtn,
                      isPendiente && { backgroundColor: colors.info + '22' },
                      isEnPrep && { backgroundColor: colors.success + '22' },
                      isListo && { backgroundColor: colors.primary + '22' },
                      loadingItemId !== null && { opacity: 0.5 }
                    ]}
                    onPress={() => {
                      if (isPendiente) actualizarEstadoItem(item.id, 'en_preparacion');
                      else if (isEnPrep) actualizarEstadoItem(item.id, 'listo');
                      else if (isListo) actualizarEstadoItem(item.id, 'entregado');
                    }}
                    disabled={loadingItemId !== null}
                  >
                    {loadingItemId === item.id ? (
                      <ActivityIndicator 
                        size="small" 
                        color={isPendiente ? colors.info : isEnPrep ? colors.success : colors.primary} 
                      />
                    ) : (
                      <>
                        {isPendiente && (
                          <>
                            <Ionicons name="play-outline" size={16} color={colors.info} />
                            <Text style={[styles.actionBtnText, { color: colors.info }]}>Iniciar Preparación</Text>
                          </>
                        )}
                        {isEnPrep && (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                            <Text style={[styles.actionBtnText, { color: colors.success }]}>Marcar como Listo</Text>
                          </>
                        )}
                        {isListo && (
                          <>
                            <Ionicons name="paper-plane-outline" size={16} color={colors.primary} />
                            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Entregar Producto</Text>
                          </>
                        )}
                      </>
                    )}
                  </ScalePressable>
                )}
              </View>
            );
          })}
        </View>

        {/* Botón de Acción Global */}
        <ScalePressable
          style={styles.btnListoTodo}
          onPress={entregarPedido}
        >
          <Ionicons name="paper-plane" size={20} color={colors.bg} style={{ marginRight: 8 }} />
          <Text style={styles.btnListoTodoText}>Marcar pedido como Entregado</Text>
        </ScalePressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  scroll: { paddingBottom: spacing.xxl },

  infoCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  itemsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  itemCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemCant: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.primary,
  },
  itemMeta: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemCat: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },

  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  obsBox: {
    backgroundColor: '#201610',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 0.5,
    borderColor: colors.primary + '22',
  },
  obsText: {
    fontSize: fontSize.sm,
    color: colors.primaryLight,
    fontWeight: '600',
    flex: 1,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.md,
    paddingVertical: 10,
    marginTop: spacing.md,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  btnListoTodo: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: spacing.sm,
  },
  btnListoTodoText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: '700',
  },
});
