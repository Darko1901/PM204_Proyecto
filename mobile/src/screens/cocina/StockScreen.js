import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import ScreenHeader from '../../components/ScreenHeader';
import { useMockData } from '../../data/MockDataContext';
import { colors, radius, spacing, typography } from '../../theme';

export default function StockScreen() {
  const { suministros } = useMockData();

  const ordenados = useMemo(
    () =>
      [...suministros].sort((a, b) => {
        const relA = a.stock_actual / (a.stock_minimo || 1);
        const relB = b.stock_actual / (b.stock_minimo || 1);
        return relA - relB;
      }),
    [suministros]
  );

  const bajoMinimo = ordenados.filter((s) => s.stock_actual < s.stock_minimo).length;

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title="Stock de suministros"
        subtitle={bajoMinimo > 0 ? `${bajoMinimo} bajo el mínimo` : 'Todo en orden'}
      />
      <FlatList
        data={ordenados}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => {
          const bajo = item.stock_actual < item.stock_minimo;
          const proporcion = Math.min(1, item.stock_actual / (item.stock_minimo * 2 || 1));
          return (
            <Card>
              <View style={styles.row}>
                <Text style={typography.h3}>{item.nombre}</Text>
                {bajo ? <Text style={styles.alerta}>Bajo mínimo</Text> : null}
              </View>
              <Text style={typography.caption}>
                {item.stock_actual}
                {item.unidad} disponibles · mínimo {item.stock_minimo}
                {item.unidad}
              </Text>
              <View style={styles.barraFondo}>
                <View
                  style={[
                    styles.barraRelleno,
                    {
                      width: `${proporcion * 100}%`,
                      backgroundColor: bajo ? colors.danger : colors.success,
                    },
                  ]}
                />
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  lista: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alerta: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.danger,
    backgroundColor: `${colors.danger}18`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  barraFondo: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  barraRelleno: {
    height: '100%',
    borderRadius: 3,
  },
});
