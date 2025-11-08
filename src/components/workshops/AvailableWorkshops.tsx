import React from 'react';
import { FlatList, RefreshControl, View, Text, StyleSheet } from 'react-native';
import type { Workshop } from '../../types';
import WorkshopCard from './WorkshopCard';

interface Props {
  data: Workshop[];
  loading?: boolean;
  onRefresh?: () => void;
  onEnroll?: (id: number) => void;
}

export default function AvailableWorkshops({ data, loading, onRefresh, onEnroll }: Props) {
  return (
    <FlatList
      data={data}
      keyExtractor={(w) => String(w.id)}
      refreshControl={<RefreshControl refreshing={!!loading} onRefresh={onRefresh ?? (() => {})} />}
      contentContainerStyle={s.content}
      ListEmptyComponent={<EmptyState text="Nenhum workshop disponível no momento." />}
      renderItem={({ item }) => (
        <WorkshopCard
          item={item}
          onPrimary={onEnroll}
          primaryLabel={item.inscrito ? 'Inscrito' : 'Inscrever-se'}
        />
      )}
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
