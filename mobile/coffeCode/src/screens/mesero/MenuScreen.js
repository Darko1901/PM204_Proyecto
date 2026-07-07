import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../theme/colors';
import { mockProductos } from '../../data/mockData';
import ScalePressable from '../../components/ScalePressable';

const CATEGORIAS = ['Todas', 'Bebidas Calientes', 'Bebidas Frías', 'Panadería', 'Postres', 'Alimentos'];

export default function MenuScreen({ route, navigation }) {
  const { cuenta, usuario } = route.params || {};
  const [busqueda, setBusqueda] = useState('');
  const [catActiva, setCatActiva] = useState('Todas');
  const [carrito, setCarrito] = useState([]);

  const productosFiltrados = mockProductos.filter(p => {
    const matchCat = catActiva === 'Todas' || p.categoria === catActiva;
    const matchBusq = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBusq && p.disponible;
  });

  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const existe = prev.find(c => c.id === producto.id);
      if (existe) return prev.map(c => c.id === producto.id ? { ...c, cantidad: c.cantidad + 1 } : c);
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const getCantidad = (id) => carrito.find(c => c.id === id)?.cantidad || 0;

  const totalCarrito = carrito.reduce((s, c) => s + c.precio * c.cantidad, 0);
  const totalItems = carrito.reduce((s, c) => s + c.cantidad, 0);

  const renderProducto = ({ item }) => {
    const cantidad = getCantidad(item.id);
    return (
      <View style={styles.productoCard}>
        {/* Parte Superior */}
        <View style={styles.productoHeader}>
          <View style={styles.catBadge}>
            <Text style={styles.catBadgeText}>{item.categoria}</Text>
          </View>
          <Text style={styles.productoNombre} numberOfLines={1}>{item.nombre}</Text>
          <Text style={styles.productoDesc} numberOfLines={2}>{item.descripcion}</Text>
        </View>

        {/* Parte Inferior Apilada */}
        <View style={styles.productoFooterCol}>
          <Text style={styles.productoPrecio}>${item.precio.toFixed(2)}</Text>
          
          <View style={styles.actionContainer}>
            {cantidad === 0 ? (
              <ScalePressable
                style={styles.btnAgregar}
                onPress={() => agregarAlCarrito(item)}
              >
                <Text style={styles.btnAgregarText}>Agregar</Text>
              </ScalePressable>
            ) : (
              <View style={styles.controlesRow}>
                <ScalePressable
                  style={styles.btnMenosSmall}
                  onPress={() => setCarrito(prev =>
                    prev.map(c => c.id === item.id ? { ...c, cantidad: c.cantidad - 1 } : c)
                      .filter(c => c.cantidad > 0)
                  )}
                >
                  <Ionicons name="remove" size={14} color={colors.textPrimary} />
                </ScalePressable>
                
                <Text style={styles.cantidadNum}>{cantidad}</Text>
                
                <ScalePressable
                  style={styles.btnMasSmall}
                  onPress={() => agregarAlCarrito(item)}
                >
                  <Ionicons name="add" size={14} color={colors.bg} />
                </ScalePressable>
              </View>
            )}
          </View>
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
        <Text style={styles.headerTitle}>Menú</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Buscador */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar producto..."
          placeholderTextColor={colors.textMuted}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {/* Categorías */}
      <FlatList
        data={CATEGORIAS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={c => c}
        style={{ flexGrow: 0, height: 50, marginBottom: spacing.xs }}
        contentContainerStyle={styles.catList}
        renderItem={({ item }) => (
          <ScalePressable
            style={[styles.catBtn, catActiva === item && styles.catBtnActive]}
            onPress={() => setCatActiva(item)}
          >
            <Text style={[styles.catBtnText, catActiva === item && styles.catBtnTextActive]}>
              {item}
            </Text>
          </ScalePressable>
        )}
      />

      {/* Lista */}
      <FlatList
        data={productosFiltrados}
        keyExtractor={item => String(item.id)}
        renderItem={renderProducto}
        numColumns={2}
        columnWrapperStyle={styles.row}
        style={styles.productosList}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay productos en esta categoría</Text>
          </View>
        }
      />

      {/* Footer carrito */}
      {totalItems > 0 && (
        <TouchableOpacity
          style={styles.carritoBar}
          onPress={() => navigation.navigate('ConfirmarPedido', { cuenta, carrito, usuario })}
        >
          <View style={styles.carrritoBadge}>
            <Text style={styles.carritoBadgeText}>{totalItems}</Text>
          </View>
          <Text style={styles.carritoText}>Ver orden</Text>
          <Text style={styles.carritoTotal}>${totalCarrito.toFixed(2)}</Text>
        </TouchableOpacity>
      )}
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
    paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.textPrimary, paddingVertical: spacing.sm, marginLeft: spacing.sm },
  catList: {
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: 4,
    gap: spacing.sm,
  },
  catBtn: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
  },
  catBtnTextActive: { color: colors.bg, fontWeight: '700' },
  lista: { paddingHorizontal: spacing.lg, paddingBottom: 90 },
  productosList: { flex: 1 },
  row: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  productoCard: {
    flex: 1,
    minHeight: 165, // Reducido para evitar el desperdicio de espacio vertical
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  productoHeader: {
    marginBottom: spacing.xs,
  },
  productoFooterCol: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  catBadge: {
    backgroundColor: colors.primary + '22',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  catBadgeText: { fontSize: fontSize.xs - 1, color: colors.primary, fontWeight: '600' },
  productoNombre: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  productoDesc: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.xs },
  productoPrecio: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primaryLight,
    marginBottom: 4,
  },
  actionContainer: {
    height: 32,
    justifyContent: 'center',
  },
  btnAgregar: {
    backgroundColor: colors.primary,
    height: 32,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAgregarText: {
    color: colors.bg,
    fontSize: 12,
    fontWeight: '700',
  },
  controlesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCardLight,
    borderRadius: radius.full,
    paddingHorizontal: 4,
    height: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnMenosSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnMasSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cantidadNum: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
  carritoBar: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  carrritoBadge: {
    backgroundColor: colors.bg,
    borderRadius: radius.full,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  carritoBadgeText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary },
  carritoText: { flex: 1, color: colors.bg, fontWeight: '700', fontSize: fontSize.md },
  carritoTotal: { color: colors.bg, fontWeight: '700', fontSize: fontSize.md },
});
