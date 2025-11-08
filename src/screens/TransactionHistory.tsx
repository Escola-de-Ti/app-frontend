import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Transaction = {
  id: string;
  type: string;
  amount: number;
  date: string;
  time: string;
};

const transactions: Transaction[] = [
  { id: '1', type: 'Recebimento por comentário', amount: 50, date: '13/09/2025', time: '21:40' },
  { id: '2', type: 'Compra de Workshop', amount: -650, date: '12/09/2025', time: '20:40' },
  { id: '3', type: 'Recebimento por comentário', amount: 100, date: '10/08/2025', time: '13:30' },
  { id: '4', type: 'Recebimento por comentário', amount: 50, date: '07/08/2025', time: '12:12' },
  { id: '5', type: 'Recebimento por SuperVote', amount: 200, date: '13/06/2025', time: '14:10' },
  { id: '6', type: 'Dedução por demência', amount: -400, date: '11/06/2025', time: '21:00' },
  { id: '7', type: 'Recebimento por comentário', amount: 50, date: '10/06/2025', time: '20:40' },
  { id: '8', type: 'Compra de Workshop', amount: -650, date: '10/06/2025', time: '20:35' },
  { id: '9', type: 'Recebimento por comentário', amount: 50, date: '10/06/2025', time: '20:30' },
  { id: '10', type: 'Recebimento por comentário', amount: 50, date: '13/05/2025', time: '21:40' },
];

export function TransactionHistory() {
  const handleSupportPress = () => {
    Alert.alert('Suporte', 'Você entrou em contato com o suporte.');
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isPositive = item.amount > 0;
    const amountColor = isPositive ? '#6ef7c3' : '#F08E90';
    const sign = isPositive ? '+' : '';

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.infoContainer}>
            <Text style={styles.typeText}>{item.type}</Text>
            <Text style={[styles.amountText, { color: amountColor }]}>
              {sign}
              {item.amount} tokens
            </Text>
          </View>

          <View style={styles.rightContainer}>
            <TouchableOpacity style={styles.supportButton} onPress={handleSupportPress}>
              <Text style={styles.supportText}>Contatar suporte</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8}>
              <Feather name="info" size={18} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.dateText}>
          {item.date} {item.time}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico de transações</Text>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0f',
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#141417',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  typeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '600',
  },
  rightContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  supportButton: {
    backgroundColor: '#2d2d35',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  supportText: {
    color: '#82caff',
    fontSize: 11,
    fontWeight: '500',
  },
  dateText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
});
