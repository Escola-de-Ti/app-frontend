import React, { useCallback } from 'react';
import { FlatList, RefreshControl, View, Text, StyleSheet } from 'react-native';
import type { Workshop } from '../../types';
import WorkshopCard from './WorkshopCard';

interface EnrolledWorkshopsProps {
  data: Workshop[];
  loading?: boolean;
  onRefresh?: () => void;
  onCancel?: (id: number) => void;
}

export default function EnrolledWorkshops({
  data,
  loading,
  onRefresh,
  onCancel,
}: EnrolledWorkshopsProps) {
  const keyExtractor = useCallback((w: Workshop) => String(w.id), []);
  const renderItem = useCallback(
    ({ item }: { item: Workshop }) => (
      <WorkshopCard
        item={item}
        onPrimary={
          (/* id */) => {
            /* navegar p/ detalhes se quiser */
          }
        }
        primaryLabel="Ver detalhes"
        onSecondary={(id: number) => onCancel?.(id)}
        secondaryLabel="Cancelar inscrição"
      />
    ),
    [onCancel]
  );

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      refreshControl={<RefreshControl refreshing={!!loading} onRefresh={onRefresh ?? (() => {})} />}
      contentContainerStyle={s.content}
      ListEmptyComponent={<EmptyState text="Você ainda não está inscrito em workshops." />}
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
