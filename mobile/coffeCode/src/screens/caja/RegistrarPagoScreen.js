import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import { getTicket, pagarCuenta } from '../../api/operaciones';

const METODOS = [
  { key: 'efectivo', label: 'Efectivo', icon: 'cash-outline' },
  { key: 'tarjeta', label: 'Tarjeta', icon: 'card-outline' },
];

export default function RegistrarPagoScreen({ route, navigation }) {
  const { cuenta, usuario } = route.params;
  const [metodo, setMetodo] = useState('efectivo');
  const [cantidadPagada, setCantidadPagada] = useState('');
  const [loading, setLoading] = useState(false);

  const esInvalidoEfectivo = metodo === 'efectivo' && (cantidadPagada === '' || parseFloat(cantidadPagada) < cuenta.total);

  const handleCobrar = async () => {
    setLoading(true);
    try {
      await pagarCuenta(cuenta.id, metodo);
      const ticket = await getTicket(cuenta.id);

      const pagadoCon = metodo === 'efectivo' ? parseFloat(cantidadPagada) : cuenta.total;
      const cambio = metodo === 'efectivo' ? pagadoCon - cuenta.total : 0;

      navigation.replace('Ticket', {
        ticket: {
          ...ticket,
          metodo,
          cuenta,
          pagadoCon,
          cambio,
        },
        usuario,
      });
    } catch (e) {
      Alert.alert('Error', e?.message || 'No se pudo procesar el cobro.');
      setLoading(false);
    }
  };

  const getPresets = () => {
    const total = cuenta.total;
    const presets = [total];
    if (total < 50) presets.push(50);
    if (total < 100) presets.push(100);
    if (total < 200) presets.push(200);
    if (total < 500) presets.push(500);
    if (total < 1000) presets.push(1000);
    return [...new Set(presets)].sort((a, b) => a - b).slice(0, 4);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar Pago</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Resumen cuenta */}
        <View style={styles.cuentaCard}>
          <View style={styles.cuentaHeader}>
            <Ionicons
              name={cuenta.tipo === 'en_mesa' ? 'restaurant' : 'bag'}
              size={18}
              color={colors.primary}
            />
            <Text style={styles.cuentaTitulo}>
              {cuenta.tipo === 'en_mesa'
                ? `Mesa ${cuenta.mesa_numero ?? cuenta.mesa?.numero}`
                : 'Para Llevar'}
            </Text>
          </View>
          {cuenta.detalles.map((d, i) => (
            <View key={i} style={styles.detalleRow}>
              <Text style={styles.detalleNombre} numberOfLines={1} ellipsizeMode="tail">
                {d.producto_nombre || d.producto?.nombre} ×{d.cantidad}
              </Text>
              <Text style={styles.detallePrecio}>${(d.precio_unitario * d.cantidad).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalLinea} />
          <View style={styles.detalleRow}>
            <Text style={styles.totalLabel}>Total a Cobrar</Text>
            <Text style={styles.totalValor}>${cuenta.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Método de pago */}
        <Text style={styles.sectionTitle}>Método de pago</Text>
        <View style={styles.metodosGrid}>
          {METODOS.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[styles.metodoBtn, metodo === m.key && styles.metodoBtnActive]}
              onPress={() => {
                setMetodo(m.key);
                if (m.key !== 'efectivo') setCantidadPagada('');
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={m.icon}
                size={24}
                color={metodo === m.key ? colors.bg : colors.textSecondary}
              />
              <Text style={[styles.metodoBtnText, metodo === m.key && styles.metodoBtnTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Calculadora de Cambio para Efectivo */}
        {metodo === 'efectivo' && (
          <View style={styles.efectivoCard}>
            <Text style={styles.efectivoTitle}>Calculadora de Cambio</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Cantidad Recibida ($)</Text>
              <TextInput
                style={styles.efectivoInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={cantidadPagada}
                onChangeText={setCantidadPagada}
              />
            </View>

            {/* Accesos rápidos de denominaciones */}
            <View style={styles.presetsRow}>
              {getPresets().map(val => (
                <TouchableOpacity
                  key={val}
                  style={styles.presetBtn}
                  onPress={() => setCantidadPagada(val.toFixed(2))}
                >
                  <Text style={styles.presetBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {val === cuenta.total ? 'Exacto' : `$${val}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {cantidadPagada !== '' && (
              <View style={styles.cambioRow}>
                {parseFloat(cantidadPagada) >= cuenta.total ? (
                  <>
                    <Text style={styles.cambioLabel}>Cambio a regresar:</Text>
                    <Text style={styles.cambioValor}>
                      ${(parseFloat(cantidadPagada) - cuenta.total).toFixed(2)}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.cambioLabel, { color: colors.danger }]}>Restante / Falta:</Text>
                    <Text style={[styles.cambioValor, { color: colors.danger }]}>
                      ${(cuenta.total - parseFloat(cantidadPagada)).toFixed(2)}
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {/* Resumen pago */}
        <View style={styles.resumenCard}>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Método</Text>
            <Text style={styles.resumenValor}>
              {METODOS.find(m => m.key === metodo)?.label}
            </Text>
          </View>
          <View style={styles.resumenDivider} />
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Cajero</Text>
            <Text style={styles.resumenValor}>{usuario?.nombre_completo?.split(' ')[0] ?? 'Tú'}</Text>
          </View>
          <View style={styles.resumenDivider} />
          <View style={styles.resumenRow}>
            <Text style={[styles.resumenLabel, { fontSize: fontSize.md }]}>Total</Text>
            <Text style={[styles.resumenValor, { fontSize: fontSize.xl, color: colors.primary }]}>
              ${cuenta.total.toFixed(2)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmarBtn, (loading || esInvalidoEfectivo) && { opacity: 0.5 }]}
          onPress={handleCobrar}
          disabled={loading || esInvalidoEfectivo}
        >
          {loading
            ? <ActivityIndicator color={colors.bg} />
            : <>
                <Ionicons name="checkmark-circle" size={20} color={colors.bg} />
                <Text style={styles.confirmarBtnText}>
                  {esInvalidoEfectivo ? 'Cantidad Insuficiente' : 'Confirmar Cobro'}
                </Text>
              </>
          }
        </TouchableOpacity>
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
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  cuentaCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cuentaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  cuentaTitulo: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  detalleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  detalleNombre: { flex: 1, flexShrink: 1, marginRight: spacing.sm, color: colors.textSecondary, fontSize: fontSize.sm },
  detallePrecio: { flexShrink: 0, color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '600' },
  totalLinea: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalLabel: { flexShrink: 0, color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700' },
  totalValor: { flexShrink: 1, textAlign: 'right', color: colors.primary, fontSize: fontSize.xl, fontWeight: '700' },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  metodosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metodoBtn: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  metodoBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  metodoBtnText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  metodoBtnTextActive: { color: colors.bg },
  efectivoCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  efectivoTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  efectivoInput: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: colors.bgCardLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  presetBtnText: {
    color: colors.primaryLight,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  cambioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  cambioLabel: {
    flexShrink: 1,
    marginRight: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  cambioValor: {
    flexShrink: 0,
    textAlign: 'right',
    fontSize: fontSize.xl,
    color: colors.success,
    fontWeight: '700',
  },
  resumenCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  resumenLabel: { flexShrink: 1, marginRight: spacing.sm, color: colors.textMuted, fontSize: fontSize.sm },
  resumenValor: { flexShrink: 0, textAlign: 'right', color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '600' },
  resumenDivider: { height: 1, backgroundColor: colors.border },
  confirmarBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
  },
  confirmarBtnText: { color: colors.bg, fontWeight: '700', fontSize: fontSize.md },
});
