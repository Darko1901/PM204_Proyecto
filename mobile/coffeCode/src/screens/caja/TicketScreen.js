import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../theme/colors';

const METODO_ICONS = {
  efectivo: 'cash-outline',
  tarjeta: 'card-outline',
  transferencia: 'phone-portrait-outline',
  otro: 'ellipsis-horizontal-circle-outline',
};

export default function TicketScreen({ route, navigation }) {
  const { ticket, usuario } = route.params;

  const fecha = new Date(ticket.emitido_en);
  const fechaStr = fecha.toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const horaStr = fecha.toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Ticket de Venta</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Checkmark animado */}
        <View style={styles.successArea}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={48} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>¡Pago Registrado!</Text>
          <Text style={styles.successSubtitle}>La cuenta ha sido cerrada exitosamente</Text>
        </View>

        {/* Ticket */}
        <View style={styles.ticketCard}>
          {/* Cabecera del ticket */}
          <View style={styles.ticketBrand}>
            <View style={styles.ticketBrandRow}>
              <Ionicons name="cafe-outline" size={18} color={colors.primary} />
              <Text style={styles.ticketBrandName}>Coffee Code</Text>
            </View>
            <Text style={styles.ticketFecha}>{fechaStr}</Text>
            <Text style={styles.ticketFecha}>{horaStr}</Text>
          </View>

          {/* Línea punteada */}
          <View style={styles.dottedLine} />

          {/* Folio */}
          <View style={styles.folioRow}>
            <Text style={styles.folioLabel}>Folio</Text>
            <Text style={styles.folioNum}>{ticket.folio}</Text>
          </View>

          {/* Línea punteada */}
          <View style={styles.dottedLine} />

          {/* Ítems */}
          {ticket.cuenta?.detalles?.map((d, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemNombre}>{d.producto.nombre}</Text>
              <Text style={styles.itemQty}>×{d.cantidad}</Text>
              <Text style={styles.itemPrecio}>${(d.precio_unitario * d.cantidad).toFixed(2)}</Text>
            </View>
          ))}

          {/* Línea punteada */}
          <View style={styles.dottedLine} />

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValor}>${ticket.total.toFixed(2)}</Text>
          </View>

          {/* Detalles de efectivo (recibido y cambio) */}
          {ticket.metodo === 'efectivo' && (
            <View style={styles.efectivoDetalleContainer}>
              <View style={styles.efectivoDetalleRow}>
                <Text style={styles.efectivoDetalleLabel}>Efectivo Recibido</Text>
                <Text style={styles.efectivoDetalleValor}>
                  ${(ticket.pagadoCon ?? ticket.total).toFixed(2)}
                </Text>
              </View>
              <View style={styles.efectivoDetalleRow}>
                <Text style={styles.efectivoDetalleLabel}>Cambio</Text>
                <Text style={[styles.efectivoDetalleValor, { color: colors.success }]}>
                  ${(ticket.cambio ?? 0).toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          {/* Método de pago */}
          <View style={styles.metodoRow}>
            <Ionicons name={METODO_ICONS[ticket.metodo] || 'cash-outline'} size={16} color={colors.primary} />
            <Text style={styles.metodoText}>
              Pagado con {ticket.metodo?.charAt(0).toUpperCase() + ticket.metodo?.slice(1)}
            </Text>
          </View>

          {/* Línea punteada */}
          <View style={styles.dottedLine} />

          <Text style={styles.ticketGracias}>¡Gracias por tu visita!</Text>
          <Text style={styles.ticketAtendio}>
            Atendido por: {usuario?.nombre_completo ?? 'Caja'}
          </Text>
        </View>

        {/* Acciones */}
        <View style={styles.simulatedActionsRow}>
          <TouchableOpacity
            style={styles.simulatedBtn}
            onPress={() => Alert.alert('Impresión', 'Imprimiendo ticket en la impresora térmica de barra...')}
          >
            <Ionicons name="print-outline" size={18} color={colors.primary} />
            <Text style={styles.simulatedBtnText}>Imprimir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.simulatedBtn}
            onPress={() => Alert.alert('Envío', 'Enviando comprobante digital al cliente por correo y WhatsApp...')}
          >
            <Ionicons name="share-social-outline" size={18} color={colors.primary} />
            <Text style={styles.simulatedBtnText}>Enviar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.finalizarBtn}
          onPress={() => navigation.navigate('Home', { usuario })}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.bg} />
          <Text style={styles.finalizarBtnText}>Finalizar Cobro</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Home', { usuario })}
        >
          <Ionicons name="home-outline" size={18} color={colors.primary} />
          <Text style={styles.homeBtnText}>Ir al Inicio</Text>
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
  successArea: { alignItems: 'center', paddingVertical: spacing.lg },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.success + '22',
    borderWidth: 2,
    borderColor: colors.success + '55',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  successSubtitle: { fontSize: fontSize.sm, color: colors.textMuted },
  ticketCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  ticketBrand: { alignItems: 'center', marginBottom: spacing.md },
  ticketBrandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  ticketBrandName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  ticketFecha: { fontSize: fontSize.sm, color: colors.textMuted },
  dottedLine: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: 'dashed',
    marginVertical: spacing.md,
  },
  folioRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  folioLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  folioNum: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, letterSpacing: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  itemNombre: { flex: 1, fontSize: fontSize.sm, color: colors.textSecondary },
  itemQty: { fontSize: fontSize.sm, color: colors.textMuted, marginRight: spacing.sm },
  itemPrecio: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: '600', minWidth: 60, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  totalValor: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.primary },
  efectivoDetalleContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  efectivoDetalleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  efectivoDetalleLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  efectivoDetalleValor: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  metodoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    justifyContent: 'center',
  },
  metodoText: { fontSize: fontSize.sm, color: colors.textSecondary },
  ticketGracias: {
    textAlign: 'center',
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  ticketAtendio: { textAlign: 'center', fontSize: fontSize.sm, color: colors.textMuted },
  simulatedActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  simulatedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + '44',
    backgroundColor: colors.bgCard,
  },
  simulatedBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  finalizarBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  finalizarBtnText: {
    color: colors.bg,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  homeBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: fontSize.md },
});
