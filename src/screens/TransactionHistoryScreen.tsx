// === src/screens/TransactionHistoryScreen.tsx ===
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import AppLayout from '../components/AppLayout';
import TransactionItem from '../components/transactions/TransactionItem';
import { getTransactionHistory, type GetHistoryParams } from '../services/transactions';
import type { Transaction } from '../types';

export default function TransactionHistoryScreen() {
  const navigation = useNavigation<any>();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // paginação / resumo
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [saldoAtual, setSaldoAtual] = useState<number>(0);
  const [totalRecebido, setTotalRecebido] = useState<number>(0);
  const [totalGasto, setTotalGasto] = useState<number>(0);

  // filtros opcionais (se quiser conectar em UI depois)
  const [motivoFilter] = useState<string | undefined>(undefined);
  const [dataInicioFilter] = useState<Date | string | undefined>(undefined);
  const [dataFimFilter] = useState<Date | string | undefined>(undefined);

  const buildParams = (currentPage: number): GetHistoryParams => ({
    page: currentPage,
    size,
    motivo: motivoFilter,
    dataInicio: dataInicioFilter,
    dataFim: dataFimFilter,
  });

  const loadPage = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setLoading(true);
          setPage(0);
        }
        const currentPage = reset ? 0 : page;
        const resp = await getTransactionHistory(buildParams(currentPage));

        // resumo
        setSaldoAtual(resp.saldoAtual);
        setTotalRecebido(resp.totalRecebido);
        setTotalGasto(resp.totalGasto);

        // lista + paginação
        setItems((prev) => (reset ? resp.transacoes : [...prev, ...resp.transacoes]));
        const stillHasMore = Boolean(resp.hasMore) && currentPage + 1 < (resp.totalPages ?? 1);
        setHasMore(stillHasMore);

        if (!reset) setPage((p) => p + 1);
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Falha ao carregar histórico.';
        console.error('Erro ao buscar histórico:', msg);
        Alert.alert('Erro', msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, size, motivoFilter, dataInicioFilter, dataFimFilter]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setExpandedId(null);
    loadPage(true);
  }, [loadPage]);

  const onEndReached = useCallback(() => {
    if (!loading && hasMore) {
      loadPage(false);
    }
  }, [loading, hasMore, loadPage]);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const empty = !loading && items.length === 0;

  return (
    <AppLayout initialActivePage={null}>
      <View style={s.container}>
        {/* Header com botão de voltar */}
        <View style={s.headerWrap}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            style={s.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="chevron-left" size={20} color="#EDEDF5" />
            <Text style={s.backText}>Voltar</Text>
          </TouchableOpacity>

          <Text style={s.title}>Histórico de Transações</Text>
        </View>

        {/* Resumo */}
        <View style={s.summaryRow}>
          <SummaryPill label="Saldo" value={saldoAtual} color="#e5e7eb" />
          <SummaryPill label="Recebido" value={totalRecebido} color="#6ef7c3" />
          <SummaryPill label="Gasto" value={-totalGasto} color="#F08E90" />
        </View>

        {loading && items.length === 0 ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color="#6ef7c3" />
          </View>
        ) : empty ? (
          <View style={s.centerBox}>
            <Text style={{ color: '#bbb' }}>Nenhuma transação encontrada.</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => String(it.id)}
            renderItem={({ item }) => (
              <TransactionItem
                item={item}
                expanded={expandedId === item.id}
                onToggle={toggleExpand}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
            }
            onEndReachedThreshold={0.4}
            onEndReached={onEndReached}
            ListFooterComponent={
              hasMore ? (
                <View style={s.footerLoading}>
                  <ActivityIndicator />
                </View>
              ) : null
            }
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        )}
      </View>
    </AppLayout>
  );
}

function SummaryPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[s.pill, { borderColor: '#222' }]}>
      <Text style={s.pillLabel}>{label}</Text>
      <Text style={[s.pillValue, { color }]}>
        {value >= 0 ? value : `-${Math.abs(value)}`} tokens
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f', padding: 16 },
  headerWrap: {
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingRight: 8,
    paddingLeft: 2,
    alignSelf: 'flex-start',
  },
  backText: { color: '#EDEDF5', fontWeight: '700', fontSize: 14 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 8 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  pill: {
    flex: 1,
    backgroundColor: '#141417',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pillLabel: { color: '#bbb', fontSize: 12, marginBottom: 2 },
  pillValue: { fontSize: 14, fontWeight: '700' },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footerLoading: { paddingVertical: 16, alignItems: 'center' },
});
