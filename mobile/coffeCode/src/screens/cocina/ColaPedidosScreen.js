import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, LayoutAnimation, Platform, UIManager, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import { mockColaCocina, mockCuentas } from '../../data/mockData';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ESTADOS = ['todos', 'pendiente', 'en_preparacion'];

const ESTADO_CONFIG = {
  pendiente: { color: colors.warning, label: 'Pendiente', icon: 'time-outline' },
  en_preparacion: { color: colors.info, label: 'En prep.', icon: 'flame-outline' },
  listo: { color: colors.success, label: 'Listo', icon: 'checkmark-circle-outline' },
};

export default function ColaPedidosScreen({ route, navigation }) {
  const isFocused = useIsFocused();
  const [items, setItems] = useState(mockColaCocina);
  const [filtro, setFiltro] = useState('todos');
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    if (isFocused) {
      setItems([...mockColaCocina]);
    }
  }, [isFocused]);

  const itemsFiltrados = filtro === 'todos'
    ? items.filter(i => i.estado !== 'listo' && i.estado !== 'entregado')
    : items.filter(i => i.estado === filtro);

  const pendientesCount = items.filter(i => i.estado === 'pendiente').length;
  const enPrepCount = items.filter(i => i.estado === 'en_preparacion').length;

  const avanzarEstado = (item) => {
    const sig = item.estado === 'pendiente' ? 'en_preparacion' : 'listo';
    const label = sig === 'en_preparacion' ? 'En Preparación' : 'Listo';
    Alert.alert(
      'Actualizar estado',
      `¿Marcar "${item.producto.nombre}" como "${label}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            setLoadingId(item.id);
            setTimeout(() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              
              // Actualizar estado local
              setItems(prev =>
                prev.map(i => i.id === item.id ? { ...i, estado: sig } : i)
              );

              // 1. Actualizar global mockColaCocina
              const realCocinaItem = mockColaCocina.find(i => i.id === item.id);
              if (realCocinaItem) {
                realCocinaItem.estado = sig;
              }

              // 2. Actualizar en mockCuentas el detalle del producto correspondientemente
              const cuentaObj = mockCuentas.find(c => c.id === item.cuenta_id);
              if (cuentaObj && cuentaObj.detalles) {
                const det = cuentaObj.detalles.find(d => 
                  d.producto.nombre === item.producto.nombre && 
                  (sig === 'en_preparacion' ? d.estado === 'pendiente' : d.estado === 'en_preparacion' || d.estado === 'pendiente')
                );
                if (det) {
                  det.estado = sig;
                }
              }

              setLoadingId(null);
            }, 600);
          },
        },
      ],
    );
  };

  const tiempoTranscurrido = (fecha) => {
    const mins = Math.floor((new Date() - new Date(fecha)) / 60000);
    if (mins < 1) return 'Ahora';
    return `${mins} min`;
  };

  const renderItem = ({ item }) => {
    const config = ESTADO_CONFIG[item.estado];
    const urgente = item.estado === 'pendiente' && tiempoTranscurrido(item.creado_en) !== 'Ahora';

    return (
      <View style={[styles.card, urgente && styles.cardUrgente]}>
        {/* Franja de estado */}
        <View style={[styles.estadoFranja, { backgroundColor: config.color }]}>
          <Ionicons name={config.icon} size={14} color={colors.bg} />
          <Text style={styles.estadoFranjaText}>{config.label}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View>
              <Text style={styles.productoNombre}>{item.producto.nombre}</Text>
              <Text style={styles.productoCategoria}>{item.producto.categoria}</Text>
            </View>
            <View style={styles.cantidadBadge}>
              <Text style={styles.cantidadNum}>×{item.cantidad}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name={item.cuenta.tipo === 'en_mesa' ? 'restaurant-outline' : 'bag-outline'}
                size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {item.cuenta.tipo === 'en_mesa' ? `Mesa ${item.cuenta.mesa?.numero}` : 'Para Llevar'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.metaText, urgente && { color: colors.warning }]}>
                {tiempoTranscurrido(item.creado_en)}
              </Text>
            </View>
          </View>

          {item.observaciones && (
            <View style={styles.obsRow}>
              <Ionicons name="chatbubble-outline" size={13} color={colors.primary} />
              <Text style={styles.obsText}>{item.observaciones}</Text>
            </View>
          )}

          {/* Acción */}
          {item.estado !== 'listo' && (
            <TouchableOpacity
              style={[
                styles.avanzarBtn, 
                { backgroundColor: config.color + '22', borderColor: config.color + '44' },
                loadingId !== null && { opacity: 0.5 }
              ]}
              onPress={() => avanzarEstado(item)}
              activeOpacity={0.7}
              disabled={loadingId !== null}
            >
              {loadingId === item.id ? (
                <ActivityIndicator size="small" color={config.color} />
              ) : (
                <>
                  <Ionicons name="arrow-forward" size={14} color={config.color} />
                  <Text style={[styles.avanzarText, { color: config.color }]}>
                    {item.estado === 'pendiente' ? 'Iniciar preparación' : 'Marcar como listo'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cola de Pedidos</Text>
        <View style={styles.alertBadge}>
          <Text style={styles.alertBadgeText}>{pendientesCount + enPrepCount}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: colors.warning + '44' }]}>
          <Text style={[styles.statNum, { color: colors.warning }]}>{pendientesCount}</Text>
          <Text style={styles.statLbl}>Pendientes</Text>
        </View>
        <View style={[styles.statCard, { borderColor: colors.info + '44' }]}>
          <Text style={[styles.statNum, { color: colors.info }]}>{enPrepCount}</Text>
          <Text style={styles.statLbl}>En Preparación</Text>
        </View>
        <View style={[styles.statCard, { borderColor: colors.success + '44' }]}>
          <Text style={[styles.statNum, { color: colors.success }]}>
            {items.filter(i => i.estado === 'listo').length}
          </Text>
          <Text style={styles.statLbl}>Listos Hoy</Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosRow}>
        {ESTADOS.map(e => (
          <TouchableOpacity
            key={e}
            style={[styles.filtroBtn, filtro === e && styles.filtroBtnActive]}
            onPress={() => setFiltro(e)}
          >
            <Text style={[styles.filtroBtnText, filtro === e && styles.filtroBtnTextActive]}>
              {e === 'todos' ? 'Activos' : ESTADO_CONFIG[e].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={itemsFiltrados}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.emptyText}>¡Sin pedidos pendientes!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  headerTitle: { flex: 1, fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  alertBadge: {
    backgroundColor: colors.danger,
    borderRadius: radius.full,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  alertBadgeText: { color: colors.white, fontSize: fontSize.xs, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  statNum: { fontSize: fontSize.xl, fontWeight: '700' },
  statLbl: { fontSize: fontSize.xs, color: colors.textMuted },
  filtrosRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filtroBtn: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filtroBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filtroBtnText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '500' },
  filtroBtnTextActive: { color: colors.bg, fontWeight: '700' },
  lista: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardUrgente: { borderColor: colors.warning + '77' },
  estadoFranja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  estadoFranjaText: { fontSize: fontSize.xs, color: colors.bg, fontWeight: '700' },
  cardBody: { padding: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  productoNombre: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  productoCategoria: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  cantidadBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  cantidadNum: { fontSize: fontSize.md, fontWeight: '700', color: colors.bg },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { fontSize: fontSize.xs, color: colors.textMuted },
  obsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary + '11',
    borderRadius: radius.sm,
    padding: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  obsText: { fontSize: fontSize.sm, color: colors.primaryLight, fontWeight: '600', flex: 1 },
  avanzarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
  },
  avanzarText: { fontSize: fontSize.sm, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
});
