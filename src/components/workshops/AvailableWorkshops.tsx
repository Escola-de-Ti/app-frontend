import React, { useCallback } from 'react';
import { FlatList, RefreshControl, View, Text, StyleSheet } from 'react-native';
import type { Workshop } from '../../types';
import WorkshopCard from './WorkshopCard';

interface AvailableWorkshopsProps {
  data: Workshop[];
  loading?: boolean;
  onRefresh?: () => void;
  onEnroll?: (id: number) => void;
}

export default function AvailableWorkshops({
  data,
  loading,
  onRefresh,
  onEnroll,
}: AvailableWorkshopsProps) {
  const keyExtractor = useCallback((w: Workshop) => String(w.id), []);
  const renderItem = useCallback(
    ({ item }: { item: Workshop }) => {
      const inscrito = Boolean((item as any)?.inscrito);
      return (
        <WorkshopCard
          item={item}
          onPrimary={(id: number) => onEnroll?.(id)}
          primaryLabel={inscrito ? 'Inscrito' : 'Inscrever-se'}
        />
      );
    },
    [onEnroll]
  );

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      refreshControl={<RefreshControl refreshing={!!loading} onRefresh={onRefresh ?? (() => {})} />}
      contentContainerStyle={s.content}
      ListEmptyComponent={<EmptyState text="Nenhum workshop disponível no momento." />}
      renderItem={renderItem}
    />
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  content: { padding: 16 },
  empty: { alignItems: 'center', marginTop: 64 },
  emptyText: { color: '#a3a3a3' },
});
