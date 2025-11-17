// === src/components/transactions/TransactionItem.tsx ===
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Transaction } from '../../types';
import { isCredito, formatarDataHoraBR } from '../../types';

type Props = {
  item: Transaction;
  expanded: boolean;
  onToggle: (id: number) => void;
};

export default function TransactionItem({ item, expanded, onToggle }: Props) {
  const positivo = isCredito(item.quantidade);
  const corValor = positivo ? '#6ef7c3' : '#F08E90';
  const sinal = positivo ? '+' : '';
  const { data, hora } = formatarDataHoraBR(item.dataTransacao);

  const handleSupportPress = () => {
    Alert.alert('Suporte', 'Você entrou em contato com o suporte.');
  };

  return (
    <View style={s.card}>
      <View style={s.row}>
        <View style={s.info}>
          <Text style={s.motivo} numberOfLines={1}>
            {item.motivoDescricao}
          </Text>
          <Text style={[s.valor, { color: corValor }]}>
            {sinal}
            {item.quantidade} tokens
          </Text>
        </View>

        {/* <View style={s.right}>
          {expanded && (
            <TouchableOpacity style={s.supportBtn} onPress={handleSupportPress}>
              <Text style={s.supportText}>Contatar suporte</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity activeOpacity={0.8} onPress={() => onToggle(item.id)}>
            <Feather name="more-horizontal" size={18} color="#ccc" />
          </TouchableOpacity>
        </View> */}
      </View>

      <Text style={s.data}>
        {data} {hora}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#141417',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1 },
  motivo: { color: '#fff', fontSize: 14, fontWeight: '500', marginBottom: 4 },
  valor: { fontSize: 15, fontWeight: '600' },
  right: { alignItems: 'flex-end', gap: 6 },
  supportBtn: {
    backgroundColor: '#2d2d35',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  supportText: { color: '#82caff', fontSize: 11, fontWeight: '500' },
  data: { color: '#888', fontSize: 12, marginTop: 8 },
});
