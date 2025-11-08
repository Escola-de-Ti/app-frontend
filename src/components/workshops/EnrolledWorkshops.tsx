import React from 'react';
import { FlatList, RefreshControl, View, Text, StyleSheet } from 'react-native';
import type { Workshop } from '../../types';
import WorkshopCard from './WorkshopCard';

interface Props {
  data: Workshop[];
  loading?: boolean;
  onRefresh?: () => void;
  onCancel?: (id: number) => void;
}

export default function EnrolledWorkshops({ data, loading, onRefresh, onCancel }: Props) {
  return (
    <FlatList
      data={data}
      keyExtractor={(w) => String(w.id)}
      refreshControl={<RefreshControl refreshing={!!loading} onRefresh={onRefresh ?? (() => {})} />}
      contentContainerStyle={s.content}
      ListEmptyComponent={<EmptyState text="Você ainda não está inscrito em workshops." />}
      renderItem={({ item }) => (
        <WorkshopCard
          item={item}
          onPrimary={() => {}}
          primaryLabel="Ver detalhes"
          onSecondary={onCancel}
          secondaryLabel="Cancelar inscrição"
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
