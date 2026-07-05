import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import ScreenHeader from '../../components/ScreenHeader';
import { useMockData } from '../../data/MockDataContext';
import { colors, radius, spacing, typography } from '../../theme';

export default function MesaSeleccionScreen({ session, navigate }) {
  const { mesas, cuentas, mesaTieneCuentaAbierta, abrirCuenta } = useMockData();
  const [tipo, setTipo] = useState('en_mesa');

  const estadoDeMesa = (mesaId) => {
    const cuenta = cuentas.find((c) => c.mesa_id === mesaId && ['abierta', 'por_cobrar'].includes(c.estado));
    return cuenta ? cuenta.estado : 'libre';
  };

  const seleccionarMesa = (mesa) => {
    if (mesaTieneCuentaAbierta(mesa.id)) return;
    const cuenta = abrirCuenta({ tipo: 'en_mesa', mesa_id: mesa.id, mesero_nombre: session.nombre });
    navigate('Pedido', { cuentaId: cuenta.id });
  };

  const nuevoParaLlevar = () => {
    const cuenta = abrirCuenta({ tipo: 'para_llevar', mesa_id: null, mesero_nombre: session.nombre });
    navigate('Pedido', { cuentaId: cuenta.id });
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Mesas" subtitle={`Hola, ${session.nombre}`} />

      <View style={styles.tipoRow}>
        <Pressable
          style={[styles.tipoChip, tipo === 'en_mesa' && styles.tipoChipActive]}
          onPress={() => setTipo('en_mesa')}
        >
          <Text style={[styles.tipoText, tipo === 'en_mesa' && styles.tipoTextActive]}>En mesa</Text>
        </Pressable>
        <Pressable
          style={[styles.tipoChip, tipo === 'para_llevar' && styles.tipoChipActive]}
          onPress={() => setTipo('para_llevar')}
        >
          <Text style={[styles.tipoText, tipo === 'para_llevar' && styles.tipoTextActive]}>Para llevar</Text>
        </Pressable>
      </View>

      {tipo === 'para_llevar' ? (
        <View style={styles.paraLlevarWrap}>
          <Text style={typography.body}>Crea un pedido para llevar sin asignar mesa.</Text>
          <Button title="Nuevo pedido para llevar" onPress={nuevoParaLlevar} style={styles.paraLlevarBtn} />
        </View>
      ) : (
        <FlatList
          data={mesas}
          keyExtractor={(m) => String(m.id)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.col}
          renderItem={({ item }) => {
            const estado = estadoDeMesa(item.id);
            const libre = estado === 'libre';
            return (
              <Pressable
                onPress={() => seleccionarMesa(item)}
                disabled={!libre}
                style={[
                  styles.mesaCard,
                  { backgroundColor: libre ? colors.surface : `${colors.warning}18` },
                  !libre && styles.mesaOcupada,
                ]}
              >
                <Text style={styles.mesaNumero}>Mesa {item.numero}</Text>
                <Text style={styles.mesaCapacidad}>{item.capacidad} personas</Text>
                <Text style={[styles.mesaEstado, { color: libre ? colors.success : colors.warning }]}>
                  {libre ? 'Libre' : estado === 'abierta' ? 'Ocupada' : 'Por cobrar'}
                </Text>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  tipoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  tipoChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  tipoChipActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}12`,
  },
  tipoText: { fontWeight: '700', color: colors.textMuted },
  tipoTextActive: { color: colors.primary },
  grid: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  col: { gap: spacing.sm },
  mesaCard: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 96,
    justifyContent: 'center',
  },
  mesaOcupada: {
    opacity: 0.85,
  },
  mesaNumero: { fontSize: 16, fontWeight: '700', color: colors.text },
  mesaCapacidad: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  mesaEstado: { fontSize: 12, fontWeight: '700', marginTop: spacing.sm },
  paraLlevarWrap: { padding: spacing.md },
  paraLlevarBtn: { marginTop: spacing.md },
});
