// === src/screens/RankingScreen.tsx ===
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import AppLayout from '../components/AppLayout';
import { getRankingModel } from '../services/ranking';
import type { RankingUser } from '../types';

export default function RankingScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<RankingUser[]>([]);
  const [minhaPos, setMinhaPos] = useState<number | undefined>();
  const [meuXpMes, setMeuXpMes] = useState<number | undefined>();

  const load = async () => {
    setLoading(true);
    try {
      const { users, me } = await getRankingModel();
      setItems(users ?? []);
      setMinhaPos(me?.posicaoAtual);
      setMeuXpMes(me?.xpMes);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const data = useMemo(() => items, [items]);

  return (
    <AppLayout initialActivePage={null} backgroundColor="rgb(11,11,15)">
      <StatusBar barStyle="light-content" />
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Ranking de Usuários</Text>
          <Text style={s.subtitle}>Acompanhe sua posição na comunidade</Text>
        </View>

        {/* Stat cards */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { borderColor: '#224' }]}>
            <View style={s.statIcon}>
              <FontAwesome5 name="trophy" size={18} color="#6ef7c3" />
            </View>
            <View>
              <Text style={s.statTitle}>Ranking Atual</Text>
              <Text style={[s.statValue, { color: '#6ef7c3' }]}>
                {typeof minhaPos === 'number' && minhaPos > 0
                  ? `#${String(minhaPos).padStart(2, '0')}`
                  : '--'}
              </Text>
            </View>
          </View>

          <View style={[s.statCard, { borderColor: '#223' }]}>
            <View style={s.statIcon}>
              <FontAwesome5 name="star" size={18} color="#7da6ff" />
            </View>
            <View>
              <Text style={s.statTitle}>XP (últimos 30 dias)</Text>
              <Text style={[s.statValue, { color: '#7da6ff' }]}>
                {typeof meuXpMes === 'number' ? `+${meuXpMes}` : '--'}
              </Text>
            </View>
          </View>
        </View>

        {/* Lista */}
        <View style={s.listHeader}>
          <Text style={s.listHeaderText}>
            <FontAwesome5 name="trophy" size={14} color="gold" /> Ranking Global
          </Text>
        </View>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator />
            <Text style={{ color: '#bbb', marginTop: 8 }}>Carregando ranking…</Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(u) => `${u.posicao}-${u.id}-${u.nome}`}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
            }
            contentContainerStyle={{ paddingBottom: 28 }}
            renderItem={({ item }) => <RankingCard user={item} />}
            ListEmptyComponent={
              <View style={s.loadingBox}>
                <Text style={{ color: '#bbb' }}>Não há dados de ranking.</Text>
              </View>
            }
          />
        )}
      </View>
    </AppLayout>
  );
}

function RankingCard({ user }: { user: RankingUser }) {
  const navigation = useNavigation<any>();

  const topThree = user.posicao <= 3;
  const color = user.cor || '#6b7280';
  const bg = topThree ? hexWithAlpha(color, 0.13) : '#141417';

  const handleProfilePress = () => {
    const userId = Number(user.id);
    if (!Number.isFinite(userId)) return;

    navigation.navigate('ProfileScreen', { userId });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleProfilePress}
      style={{ borderRadius: 10, overflow: 'hidden' }}
    >
      <View
        style={[
          s.card,
          {
            borderLeftWidth: 4,
            borderLeftColor: color,
            backgroundColor: bg,
          },
        ]}
      >
        <View style={s.cardRow}>
          <View style={s.leftCol}>
            <View style={s.headerRow}>
              {topThree && <FontAwesome5 name="trophy" size={16} color={color} />}
              <Text style={s.position}>#{user.posicao}</Text>
              <Text style={s.name} numberOfLines={1}>
                {user.nome}
              </Text>
            </View>

            <View style={s.badgesRow}>
              <View style={s.badge}>
                <Text style={[s.badgeText, { color: '#82caff' }]}>Nvl. {user.nivel}</Text>
              </View>
              <View style={s.badge}>
                <Text style={[s.badgeText, { color: '#ffd580' }]}>{user.xp} XP</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/** Aplica alpha em hex #RRGGBB */
function hexWithAlpha(hex: string, alpha: number) {
  const a = Math.max(0, Math.min(1, alpha));
  const val = Math.round(a * 255);
  const aa = val.toString(16).padStart(2, '0');
  const clean = hex.replace('#', '');
  return `#${clean}${aa}`;
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { marginBottom: 12 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#aaa', marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 16 },
  statCard: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#141417',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  statIcon: { width: 28, alignItems: 'center' },
  statTitle: { fontSize: 12, fontWeight: '500', color: '#bbb' },
  statValue: { fontSize: 20, fontWeight: '800' },

  listHeader: { marginTop: 6, marginBottom: 10 },
  listHeaderText: { color: '#ccc', fontSize: 16, fontWeight: '600' },

  loadingBox: { paddingVertical: 28, alignItems: 'center', justifyContent: 'center' },

  card: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  leftCol: { flexDirection: 'column', minWidth: 220, flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  position: { color: '#ddd', fontWeight: '800' },
  name: { color: '#fff', fontSize: 15, fontWeight: '600', flexShrink: 1 },

  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  badge: { backgroundColor: '#1f1f27', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 12 },
});
