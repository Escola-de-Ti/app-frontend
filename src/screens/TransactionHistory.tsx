import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// Tipo compatível com o back-end (HistoricoTransacaoResponseDTO)
type Transaction = {
  id: number;
  quantidade: number;
  motivoDescricao: string;
  descricao: string;
  dataTransacao: string;
};

// Tipo para o retorno completo da API (HistoricoTransacaoListResponseDTO)
type HistoricoResponse = {
  transacoes: Transaction[];
  totalRecebido: number;
  totalGasto: number;
  saldoAtual: number;
  hasMore: boolean;
  totalPages: number;
  totalElements: number;
};

const mockTransactions: Transaction[] = [
  {
    id: 1,
    quantidade: 50,
    motivoDescricao: 'Up vote em comentário',
    descricao: 'Recebimento por comentário',
    dataTransacao: '2025-09-13T21:40:00Z',
  },
  {
    id: 2,
    quantidade: -650,
    motivoDescricao: 'Inscrição em workshop como aluno',
    descricao: 'Compra de Workshop',
    dataTransacao: '2025-09-12T20:40:00Z',
  },
  {
    id: 3,
    quantidade: 100,
    motivoDescricao: 'Up vote em comentário',
    descricao: 'Recebimento por comentário',
    dataTransacao: '2025-08-10T13:30:00Z',
  },
  {
    id: 4,
    quantidade: 50,
    motivoDescricao: 'Up vote em comentário',
    descricao: 'Recebimento por comentário',
    dataTransacao: '2025-08-07T12:12:00Z',
  },
  {
    id: 5,
    quantidade: 200,
    motivoDescricao: 'Super vote em comentário',
    descricao: 'Recebimento por SuperVote',
    dataTransacao: '2025-06-13T14:10:00Z',
  },
  {
    id: 6,
    quantidade: -400,
    motivoDescricao: 'Punição por denúncia aceita',
    descricao: 'Dedução por punição',
    dataTransacao: '2025-06-11T21:00:00Z',
  },
  {
    id: 7,
    quantidade: 50,
    motivoDescricao: 'Up vote em comentário',
    descricao: 'Recebimento por comentário',
    dataTransacao: '2025-06-10T20:40:00Z',
  },
  {
    id: 8,
    quantidade: -650,
    motivoDescricao: 'Inscrição em workshop como aluno',
    descricao: 'Compra de Workshop',
    dataTransacao: '2025-06-10T20:35:00Z',
  },
  {
    id: 9,
    quantidade: 50,
    motivoDescricao: 'Up vote em comentário',
    descricao: 'Recebimento por comentário',
    dataTransacao: '2025-06-10T20:30:00Z',
  },
  {
    id: 10,
    quantidade: 50,
    motivoDescricao: 'Up vote em comentário',
    descricao: 'Recebimento por comentário',
    dataTransacao: '2025-05-13T21:40:00Z',
  },
];

export function TransactionHistory() {
  const [expandedCard, setExpandedCard] = useState<string | number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [loading, setLoading] = useState(true);

  // trocar essa URL quando integrar com o back real
  const API_URL = 'http://localhost:8080/api/historico-transacoes?page=0&size=20';
  // ou se for rodar no celular: 'http://192.168.0.10:8080/api/historico-transacoes?page=0&size=20'

  const handleSupportPress = () => {
    Alert.alert('Suporte', 'Você entrou em contato com o suporte.');
  };

  const handleMenuToggle = (id: string | number) => {
    setExpandedCard((prev) => (prev === id ? null : id));
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleDateString('pt-BR');
    const formattedTime = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { formattedDate, formattedTime };
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`Erro ${response.status}`);
        }

        const data: HistoricoResponse = await response.json();

        if (data && Array.isArray(data.transacoes)) {
          setTransactions(data.transacoes);
        } else {
          console.warn('Resposta inesperada da API, usando mock.');
          setTransactions(mockTransactions);
        }
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        setTransactions(mockTransactions);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const renderItem = ({ item }: { item: Transaction }) => {
    const isPositive = item.quantidade > 0;
    const amountColor = isPositive ? '#6ef7c3' : '#F08E90';
    const sign = isPositive ? '+' : '';

    const { formattedDate, formattedTime } = formatDateTime(item.dataTransacao);
    const isExpanded = expandedCard === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.infoContainer}>
            <Text style={styles.typeText}>{item.motivoDescricao}</Text>
            <Text style={[styles.amountText, { color: amountColor }]}>
              {sign}
              {item.quantidade} tokens
            </Text>
          </View>

          <View style={styles.rightContainer}>
            {isExpanded && (
              <TouchableOpacity style={styles.supportButton} onPress={handleSupportPress}>
                <Text style={styles.supportText}>Contatar suporte</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity activeOpacity={0.8} onPress={() => handleMenuToggle(item.id)}>
              <Feather name="more-horizontal" size={18} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.dateText}>
          {formattedDate} {formattedTime}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6ef7c3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico de Transações</Text>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        style={{ flex: 1 }}
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
