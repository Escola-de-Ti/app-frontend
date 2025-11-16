// === src/components/workshops/AvailableWorkshops.tsx ===
import React, { useCallback } from 'react';
import { FlatList, RefreshControl, View, Text, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';

import type { Workshop } from '../../types';
import WorkshopCard from './WorkshopCard';
import {
  enrollInWorkshop,
  OwnWorkshopEnrollError,
  NotEnoughTokensEnrollError,
} from '../../services/workshops';

interface AvailableWorkshopsProps {
  data: Workshop[];
  loading?: boolean;
  onRefresh?: () => void;
  /**
   * Callback opcional chamado DEPOIS de uma inscrição bem-sucedida.
   * (se quiser, no pai você pode usar pra dar reload extra, tracking, etc.)
   */
  onEnroll?: (id: number) => void;
}

export default function AvailableWorkshops({
  data,
  loading,
  onRefresh,
  onEnroll,
}: AvailableWorkshopsProps) {
  const keyExtractor = useCallback((w: Workshop) => String(w.id), []);

  const handleEnroll = useCallback(
    async (id: number, alreadyEnrolled: boolean) => {
      // se já estiver marcado como inscrito, não faz nada
      if (alreadyEnrolled) return;

      try {
        await enrollInWorkshop(id);

        Toast.show({
          type: 'success',
          text1: 'Inscrição realizada!',
          text2: 'Você foi inscrito neste workshop.',
        });

        // callback opcional pro pai
        onEnroll?.(id);
        // recarrega lista se vier handler
        onRefresh?.();
      } catch (e: any) {
        if (e instanceof OwnWorkshopEnrollError) {
          Toast.show({
            type: 'error',
            text1: 'Não permitido',
            text2: e.message || 'Você não pode se inscrever no seu próprio workshop.',
          });
          return;
        }

        if (e instanceof NotEnoughTokensEnrollError) {
          Toast.show({
            type: 'error',
            text1: 'Tokens insuficientes',
            text2: e.message || 'Você não possui tokens suficientes para este workshop.',
          });
          return;
        }

        Toast.show({
          type: 'error',
          text1: 'Erro ao se inscrever',
          text2: e?.message || 'Não foi possível concluir a inscrição. Tente novamente.',
        });
      }
    },
    [onEnroll, onRefresh]
  );

  const renderItem = useCallback(
    ({ item }: { item: Workshop }) => {
      const inscrito = Boolean((item as any)?.inscrito);

      return (
        <WorkshopCard
          item={item}
          onPrimary={(id: number) => handleEnroll(id, inscrito)}
          primaryLabel={inscrito ? 'Inscrito' : 'Inscrever-se'}
        />
      );
    },
    [handleEnroll]
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
