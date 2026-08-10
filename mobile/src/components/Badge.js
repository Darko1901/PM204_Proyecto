import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { estadoColors, radius } from '../theme';

const ETIQUETAS = {
  abierta: 'Abierta',
  por_cobrar: 'Por cobrar',
  pagada: 'Pagada',
  cancelada: 'Cancelada',
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
};

export default function Badge({ estado, label }) {
  const color = estadoColors[estado] || '#8D99AE';
  return (
    <View style={[styles.pill, { backgroundColor: `${color}1F`, borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label || ETIQUETAS[estado] || estado}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
