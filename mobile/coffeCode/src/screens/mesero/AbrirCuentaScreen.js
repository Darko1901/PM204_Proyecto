import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../theme/colors';

export default function AbrirCuentaScreen({ route, navigation }) {
  const { mesa, usuario } = route.params;
  const [tipo, setTipo] = useState('en_mesa');
  const [loading, setLoading] = useState(false);

  const handleAbrir = () => {
    setLoading(true);
    // Simula POST /cuentas
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Cuenta abierta',
        `Cuenta ${tipo === 'en_mesa' ? `Mesa ${mesa?.numero}` : 'Para Llevar'} abierta correctamente.`,
        [
          {
            text: 'Agregar productos',
            onPress: () => navigation.navigate('Menu', {
              cuenta: { id: Date.now(), mesa, tipo, estado: 'abierta', total: 0, detalles: [], mesero_id: usuario?.id },
              usuario,
            }),
          },
        ],
      );
    }, 800);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Abrir Cuenta</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Tipo de cuenta */}
        <Text style={styles.sectionTitle}>Tipo de cuenta</Text>
        <View style={styles.tipoRow}>
          <TouchableOpacity
            style={[styles.tipoBtn, tipo === 'en_mesa' && styles.tipoBtnActive]}
            onPress={() => setTipo('en_mesa')}
          >
            <Ionicons
              name="restaurant"
              size={24}
              color={tipo === 'en_mesa' ? colors.bg : colors.textSecondary}
            />
            <Text style={[styles.tipoBtnText, tipo === 'en_mesa' && styles.tipoBtnTextActive]}>
              En Mesa
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tipoBtn, tipo === 'para_llevar' && styles.tipoBtnActive]}
            onPress={() => setTipo('para_llevar')}
          >
            <Ionicons
              name="bag"
              size={24}
              color={tipo === 'para_llevar' ? colors.bg : colors.textSecondary}
            />
            <Text style={[styles.tipoBtnText, tipo === 'para_llevar' && styles.tipoBtnTextActive]}>
              Para Llevar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info de mesa (solo en_mesa) */}
        {tipo === 'en_mesa' && mesa && (
          <>
            <Text style={styles.sectionTitle}>Mesa seleccionada</Text>
            <View style={styles.mesaCard}>
              <View style={styles.mesaIcon}>
                <Ionicons name="restaurant" size={32} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.mesaNum}>Mesa {mesa.numero}</Text>
                <View style={styles.capacidadRow}>
                  <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.capacidadText}>Hasta {mesa.capacidad} personas</Text>
                </View>
                <View style={[styles.libBadge]}>
                  <Text style={styles.libText}>Disponible</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Resumen */}
        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.resumenCard}>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Tipo</Text>
            <Text style={styles.resumenValor}>
              {tipo === 'en_mesa' ? 'En Mesa' : 'Para Llevar'}
            </Text>
          </View>
          {tipo === 'en_mesa' && mesa && (
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Mesa</Text>
              <Text style={styles.resumenValor}>#{mesa.numero}</Text>
            </View>
          )}
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Mesero</Text>
            <Text style={styles.resumenValor}>{usuario?.nombre_completo?.split(' ')[0] ?? 'Tú'}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Estado inicial</Text>
            <Text style={[styles.resumenValor, { color: colors.success }]}>Abierta</Text>
          </View>
        </View>

        {/* Botón */}
        <TouchableOpacity
          style={[styles.abrirBtn, loading && { opacity: 0.6 }]}
          onPress={handleAbrir}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color={colors.bg} />
            : <>
                <Ionicons name="add-circle" size={20} color={colors.bg} />
                <Text style={styles.abrirBtnText}>Abrir Cuenta</Text>
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
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  tipoRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  tipoBtn: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipoBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tipoBtnText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textSecondary },
  tipoBtnTextActive: { color: colors.bg },
  mesaCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  mesaIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mesaNum: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary },
  capacidadRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginVertical: spacing.xs },
  capacidadText: { fontSize: fontSize.sm, color: colors.textMuted },
  libBadge: {
    backgroundColor: colors.success + '22',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  libText: { fontSize: fontSize.xs, color: colors.success, fontWeight: '600' },
  resumenCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resumenLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  resumenValor: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: '600' },
  abrirBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  abrirBtnText: { color: colors.bg, fontWeight: '700', fontSize: fontSize.md },
});
