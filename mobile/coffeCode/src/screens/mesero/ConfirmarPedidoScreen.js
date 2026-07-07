import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StatusBar, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import ScalePressable from '../../components/ScalePressable';
import { mockCuentas, mockColaCocina, mockMesas } from '../../data/mockData';

export default function ConfirmarPedidoScreen({ route, navigation }) {
  const { cuenta, carrito, usuario } = route.params || {};
  const [items, setItems] = useState(
    (carrito || []).map(c => ({
      ...c,
      nota: ''
    }))
  );
  const [enviando, setEnviando] = useState(false);

  const totalCarrito = items.reduce((s, c) => s + c.precio * c.cantidad, 0);
  const totalItems = items.reduce((s, c) => s + c.cantidad, 0);

  const handleUpdateNota = (idx, text) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, nota: text } : item));
  };

  const handleEnviarPedido = () => {
    setEnviando(true);
    setTimeout(() => {
      setEnviando(false);
      Alert.alert(
        'Pedido Enviado',
        'El pedido se ha enviado a cocina correctamente.',
        [
          {
            text: 'Aceptar',
            onPress: () => {
              const nuevosDetalles = [
                ...(cuenta.detalles || []),
                ...items.map((c, i) => ({
                  id: (cuenta.detalles?.length || 0) + i + 1,
                  producto: { nombre: c.nombre },
                  cantidad: c.cantidad,
                  precio_unitario: c.precio,
                  estado: 'pendiente',
                  observaciones: c.nota.trim() !== '' ? c.nota.trim() : null,
                }))
              ];
              const cuentaActualizada = {
                ...cuenta,
                detalles: nuevosDetalles,
                total: (cuenta.total || 0) + totalCarrito
              };

              // Actualizar o insertar cuenta en el mock de cuentas
              const cuentaIdx = mockCuentas.findIndex(c => c.id === cuenta.id);
              if (cuentaIdx !== -1) {
                mockCuentas[cuentaIdx] = cuentaActualizada;
              } else {
                mockCuentas.push(cuentaActualizada);
              }

              // Ocupar mesa si aplica
              if (cuenta.tipo === 'en_mesa' && cuenta.mesa) {
                const mesaObj = mockMesas.find(m => m.id === cuenta.mesa.id);
                if (mesaObj) {
                  mesaObj.ocupada = true;
                }
              }

              // Agregar items a la cola de cocina
              items.forEach((c, idx) => {
                mockColaCocina.push({
                  id: Date.now() + idx,
                  cuenta_id: cuenta.id,
                  cuenta: {
                    mesa: cuenta.mesa ? { numero: cuenta.mesa.numero } : null,
                    tipo: cuenta.tipo,
                  },
                  producto: {
                    nombre: c.nombre,
                    categoria: c.categoria || 'Bebidas Calientes',
                  },
                  cantidad: c.cantidad,
                  precio_unitario: c.precio,
                  estado: 'pendiente',
                  observaciones: c.nota.trim() !== '' ? c.nota.trim() : null,
                  creado_en: new Date().toISOString(),
                });
              });
              
              navigation.reset({
                index: 1,
                routes: [
                  { name: 'Home', params: { usuario } },
                  { name: 'DetalleCuenta', params: { cuenta: cuentaActualizada, usuario } },
                ],
              });
            }
          }
        ]
      );
    }, 1000);
  };

  const getMesaLabel = () => {
    if (cuenta?.tipo === 'en_mesa') {
      return `Mesa ${cuenta.mesa?.numero ?? '?'}`;
    }
    return 'Para Llevar';
  };

  const formattedDate = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={enviando}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar Pedido</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Ticket Container */}
        <View style={styles.ticketCard}>
          {/* Top Notch Decor */}
          <View style={styles.notchContainer}>
            {Array.from({ length: 18 }).map((_, i) => (
              <View key={i} style={styles.notchCircle} />
            ))}
          </View>

          <View style={styles.ticketContent}>
            {/* Logo & Header */}
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketLogo}>COFFEE CODE</Text>
              <Text style={styles.ticketSubtitle}>PEDIDO DE COCINA</Text>
              <View style={styles.dashedDivider} />
            </View>

            {/* Meta Details */}
            <View style={styles.metaSection}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Fecha:</Text>
                <Text style={styles.metaVal}>{formattedDate}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Mesero:</Text>
                <Text style={styles.metaVal}>{usuario?.nombre_completo ?? 'Empleado'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Destino:</Text>
                <Text style={styles.metaValHighlight}>{getMesaLabel()}</Text>
              </View>
            </View>

            <View style={styles.dashedDivider} />

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCol, styles.colCant]}>Cant</Text>
              <Text style={[styles.tableHeaderCol, styles.colProd]}>Producto</Text>
              <Text style={[styles.tableHeaderCol, styles.colTotal, { textAlign: 'right' }]}>Subtotal</Text>
            </View>

            {/* Item Rows */}
            {items.map((item, idx) => (
              <View key={idx} style={styles.itemContainer}>
                <View style={styles.itemRow}>
                  <Text style={[styles.itemCant, styles.colCant]}>{item.cantidad}x</Text>
                  <Text style={[styles.itemProd, styles.colProd]} numberOfLines={1}>{item.nombre}</Text>
                  <Text style={[styles.itemTotal, styles.colTotal]}>
                    ${(item.precio * item.cantidad).toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.noteInputRow}>
                  <Ionicons name="chatbubble-ellipses-outline" size={13} color="#7A6C5E" />
                  <TextInput
                    placeholder="Instrucciones (ej. sin azúcar, hielo...)"
                    placeholderTextColor="#A59585"
                    value={item.nota}
                    onChangeText={(text) => handleUpdateNota(idx, text)}
                    style={styles.noteInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            ))}

            <View style={styles.dashedDivider} />

            {/* Summary */}
            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Artículos:</Text>
                <Text style={styles.summaryVal}>{totalItems} u.</Text>
              </View>
              <View style={[styles.summaryRow, { marginTop: spacing.xs }]}>
                <Text style={styles.totalLabel}>TOTAL PEDIDO</Text>
                <Text style={styles.totalVal}>${totalCarrito.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Bottom Jagged Decor */}
          <View style={styles.notchContainerBottom}>
            {Array.from({ length: 18 }).map((_, i) => (
              <View key={i} style={styles.notchCircleBottom} />
            ))}
          </View>
        </View>

        {/* Action Button */}
        <ScalePressable
          style={[styles.btnEnviar, enviando && styles.btnEnviarDisabled]}
          onPress={handleEnviarPedido}
          disabled={enviando}
        >
          {enviando ? (
            <ActivityIndicator size="small" color={colors.bg} />
          ) : (
            <>
              <Ionicons name="restaurant-outline" size={20} color={colors.bg} style={{ marginRight: 8 }} />
              <Text style={styles.btnEnviarText}>Enviar Pedido a Cocina</Text>
            </>
          )}
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

  ticketCard: {
    backgroundColor: '#FDFBF9',
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  ticketContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  ticketHeader: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  ticketLogo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A0F0A',
    letterSpacing: 2,
    marginBottom: 4,
  },
  ticketSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A6C5E',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  dashedDivider: {
    width: '100%',
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: '#D0C2B4',
    marginVertical: spacing.md,
  },
  metaSection: {
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#7A6C5E',
  },
  metaVal: {
    fontSize: 12,
    color: '#1A0F0A',
    fontWeight: '500',
  },
  metaValHighlight: {
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  tableHeaderCol: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A6C5E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFECE9',
    paddingVertical: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  noteInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 42, // Alinea el campo de texto debajo del nombre del producto
    marginTop: 2,
    marginBottom: 6,
  },
  noteInput: {
    flex: 1,
    fontSize: 11,
    color: '#554336',
    padding: 0,
    margin: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: '#D0C2B4',
    borderStyle: 'dashed',
  },
  itemCant: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  itemProd: {
    fontSize: 13,
    color: '#1A0F0A',
    fontWeight: '500',
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A0F0A',
    textAlign: 'right',
  },
  colCant: { width: 42 },
  colProd: { flex: 1, paddingHorizontal: 4 },
  colTotal: { width: 75 },

  summarySection: {
    marginTop: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7A6C5E',
  },
  summaryVal: {
    fontSize: 12,
    color: '#1A0F0A',
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A0F0A',
    letterSpacing: 0.5,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A0F0A',
  },

  /* Notch Jagged Decor Styles */
  notchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: -6,
    left: 0,
    right: 0,
    height: 12,
  },
  notchCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.bg,
  },
  notchContainerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    height: 12,
  },
  notchCircleBottom: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.bg,
  },

  btnEnviar: {
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
  },
  btnEnviarDisabled: {
    backgroundColor: colors.primaryDark,
    opacity: 0.8,
  },
  btnEnviarText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: '700',
  },
});
