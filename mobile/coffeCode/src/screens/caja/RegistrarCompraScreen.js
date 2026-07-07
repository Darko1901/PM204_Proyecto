import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import { mockSuministros, mockCompras } from '../../data/mockData';

export default function RegistrarCompraScreen({ route, navigation }) {
  const { usuario } = route.params || {};
  const [proveedor, setProveedor] = useState('');
  const [lineas, setLineas] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busquedaSuministro, setBusquedaSuministro] = useState('');

  const suministrosFiltrados = mockSuministros.filter(s =>
    s.activo && s.nombre.toLowerCase().includes(busquedaSuministro.toLowerCase())
  );

  const total = lineas.reduce((s, l) => s + l.cantidad * l.costo_unitario, 0);

  const agregarLinea = (suministro) => {
    const existe = lineas.find(l => l.suministro_id === suministro.id);
    if (!existe) {
      setLineas(prev => [...prev, {
        suministro_id: suministro.id,
        suministro,
        cantidad: 1,
        costo_unitario: 0,
      }]);
    }
    setShowSelector(false);
  };

  const actualizarLinea = (id, campo, valor) => {
    setLineas(prev => prev.map(l =>
      l.suministro_id === id ? { ...l, [campo]: parseFloat(valor) || 0 } : l
    ));
  };

  const eliminarLinea = (id) => {
    setLineas(prev => prev.filter(l => l.suministro_id !== id));
  };

  const handleGuardar = () => {
    if (!proveedor.trim()) { Alert.alert('Falta el proveedor'); return; }
    if (lineas.length === 0) { Alert.alert('Agrega al menos un suministro'); return; }
    if (lineas.some(l => l.cantidad <= 0)) { Alert.alert('La cantidad de cada suministro debe ser mayor a 0'); return; }
    if (lineas.some(l => l.costo_unitario <= 0)) { Alert.alert('El costo de cada suministro debe ser mayor a 0'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Incrementar stock en mockData
      lineas.forEach(linea => {
        const sum = mockSuministros.find(s => s.id === linea.suministro_id);
        if (sum) {
          sum.stock_actual = parseFloat((sum.stock_actual + linea.cantidad).toFixed(2));
        }
      });
      
      // Guardar compra en mockCompras (al principio para que aparezca primero en el historial)
      mockCompras.unshift({
        id: mockCompras.length + 1,
        proveedor: proveedor,
        total: total,
        comprado_en: new Date().toISOString(),
        detalles: lineas.map(linea => ({
          suministro: { nombre: linea.suministro.nombre },
          cantidad: linea.cantidad,
          costo_unitario: linea.costo_unitario
        }))
      });

      Alert.alert('Compra registrada', `Total: $${total.toFixed(2)}`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }, 1000);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar Compra</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Proveedor */}
        <Text style={styles.sectionTitle}>Proveedor</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre del proveedor"
          placeholderTextColor={colors.textMuted}
          value={proveedor}
          onChangeText={setProveedor}
        />

        {/* Suministros */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Suministros</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowSelector(true)}>
            <Ionicons name="add" size={16} color={colors.bg} />
            <Text style={styles.addBtnText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {/* Selector de suministros */}
        {showSelector && (
          <View style={styles.selectorCard}>
            <Text style={styles.selectorTitle}>Seleccionar suministro</Text>
            
            <View style={styles.selectorSearchRow}>
              <Ionicons name="search-outline" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.selectorSearchInput}
                placeholder="Buscar suministro..."
                placeholderTextColor={colors.textMuted}
                value={busquedaSuministro}
                onChangeText={setBusquedaSuministro}
              />
            </View>

            <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
              {suministrosFiltrados.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.selectorItem}
                  onPress={() => {
                    agregarLinea(s);
                    setBusquedaSuministro('');
                  }}
                >
                  <Text style={styles.selectorNombre}>{s.nombre}</Text>
                  <Text style={styles.selectorUnidad}>{s.unidad}</Text>
                </TouchableOpacity>
              ))}
              {suministrosFiltrados.length === 0 && (
                <Text style={styles.selectorVacio}>No se encontraron suministros</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setShowSelector(false);
                setBusquedaSuministro('');
              }}
              style={styles.selectorCerrar}
            >
              <Text style={styles.selectorCerrarText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Líneas de compra */}
        {lineas.map(linea => (
          <View key={linea.suministro_id} style={styles.lineaCard}>
            <View style={styles.lineaHeader}>
              <Text style={styles.lineaNombre}>{linea.suministro.nombre}</Text>
              <TouchableOpacity onPress={() => eliminarLinea(linea.suministro_id)}>
                <Ionicons name="close-circle" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
            <View style={styles.lineaInputs}>
              <View style={styles.lineaInputGroup}>
                <Text style={styles.lineaInputLabel}>Cantidad ({linea.suministro.unidad})</Text>
                <TextInput
                  style={styles.lineaInput}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  defaultValue={String(linea.cantidad)}
                  onChangeText={v => actualizarLinea(linea.suministro_id, 'cantidad', v)}
                />
              </View>
              <View style={styles.lineaInputGroup}>
                <Text style={styles.lineaInputLabel}>Costo unitario ($)</Text>
                <TextInput
                  style={styles.lineaInput}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  defaultValue={String(linea.costo_unitario || '')}
                  onChangeText={v => actualizarLinea(linea.suministro_id, 'costo_unitario', v)}
                />
              </View>
            </View>
            <Text style={styles.lineaSubtotal}>
              Subtotal: ${(linea.cantidad * linea.costo_unitario).toFixed(2)}
            </Text>
          </View>
        ))}

        {lineas.length === 0 && !showSelector && (
          <View style={styles.emptyLineas}>
            <Ionicons name="cart-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyLineasText}>Sin suministros agregados</Text>
          </View>
        )}

        {/* Total */}
        {lineas.length > 0 && (
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total de la compra</Text>
            <Text style={styles.totalValor}>${total.toFixed(2)}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.guardarBtn, loading && { opacity: 0.6 }]}
          onPress={handleGuardar}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colors.bg} />
            : <>
                <Ionicons name="save-outline" size={18} color={colors.bg} />
                <Text style={styles.guardarBtnText}>Guardar Compra</Text>
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
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, marginBottom: spacing.sm },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  addBtnText: { fontSize: fontSize.sm, color: colors.bg, fontWeight: '600' },
  input: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontSize: fontSize.md,
  },
  selectorCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '44',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  selectorTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  selectorSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectorSearchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    paddingVertical: spacing.xs,
    marginLeft: spacing.xs,
  },
  selectorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  selectorNombre: { fontSize: fontSize.sm, color: colors.textPrimary },
  selectorUnidad: { fontSize: fontSize.sm, color: colors.textMuted },
  selectorVacio: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  selectorCerrar: { paddingTop: spacing.sm, alignItems: 'center' },
  selectorCerrarText: { color: colors.danger, fontWeight: '600', fontSize: fontSize.sm },
  lineaCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  lineaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  lineaNombre: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
  lineaInputs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  lineaInputGroup: { flex: 1 },
  lineaInputLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.xs },
  lineaInput: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
  },
  lineaSubtotal: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600', textAlign: 'right' },
  emptyLineas: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyLineasText: { color: colors.textMuted, fontSize: fontSize.md },
  totalCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '44',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  totalLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  totalValor: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary },
  guardarBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  guardarBtnText: { color: colors.bg, fontWeight: '700', fontSize: fontSize.md },
});
