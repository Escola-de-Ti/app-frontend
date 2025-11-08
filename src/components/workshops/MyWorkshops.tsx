import React from 'react';
import { FlatList, RefreshControl, View, Text, StyleSheet } from 'react-native';
import type { Workshop } from '../../types';
import WorkshopCard from './WorkshopCard';

interface Props {
  data: Workshop[];
  loading?: boolean;
  onRefresh?: () => void;
  onEdit?: (id: number) => void;
}

export default function MyWorkshops({ data, loading, onRefresh, onEdit }: Props) {
  return (
    <FlatList
      data={data}
      keyExtractor={(w) => String(w.id)}
      refreshControl={<RefreshControl refreshing={!!loading} onRefresh={onRefresh ?? (() => {})} />}
      contentContainerStyle={s.content}
      ListEmptyComponent={<EmptyState text="Você ainda não criou workshops." />}
      renderItem={({ item }) => (
        <WorkshopCard item={item} onPrimary={onEdit} primaryLabel="Editar" />
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
