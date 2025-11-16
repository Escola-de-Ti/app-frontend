// === src/components/workshops/WorkshopCard.tsx ===
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Workshop } from '../../types';
import { formatWorkshopDateRange } from '../../types';

interface WorkshopCardProps {
  item: Workshop;
  onPrimary?: (id: number) => void; // inscrever/ver/editar
  onSecondary?: (id: number) => void; // cancelar/editar
  primaryLabel?: string;
  secondaryLabel?: string;
}

export default function WorkshopCard({
  item,
  onPrimary,
  onSecondary,
  primaryLabel,
  secondaryLabel,
}: WorkshopCardProps) {
  const isOnline = !!item.linkMeet;
  const idNum = Number(item.id);

  const anyItem: any = item;

  // 🔗 tenta primeiro array de imagens (imagens / urlsImagens)
  const rawImages = anyItem?.imagens ?? anyItem?.urlsImagens ?? [];

  let coverUrl: string | null = null;

  if (Array.isArray(rawImages) && rawImages.length > 0) {
    const first = rawImages[0];
    const candidate = String(first?.urlImagem ?? first?.url ?? '').trim();
    if (candidate) {
      coverUrl = candidate;
    }
  }

  // 🔁 fallback: usa descricao.urlImagem (modelo atual do back)
  if (!coverUrl && anyItem?.descricao?.urlImagem) {
    const candidate = String(anyItem.descricao.urlImagem).trim();
    if (candidate) {
      coverUrl = candidate;
    }
  }

  // 💰 custo em tokens (compat com campos antigos/novos)
  const rawCost = (anyItem?.custo ?? anyItem?.tokens) as number | undefined;
  const costTokens = Number.isFinite(Number(rawCost)) ? Number(rawCost) : 0;

  return (
    <View style={s.card}>
      {/* Capa / banner do workshop */}
      {coverUrl && (
        <View style={s.coverWrapper}>
          <Image source={{ uri: coverUrl }} style={s.cover} resizeMode="cover" />
        </View>
      )}

      <View style={s.body}>
        {/* Título + custo em tagzinha rosa */}
        <View style={s.titleRow}>
          <Text style={s.title} numberOfLines={2}>
            {item.titulo}
          </Text>

          {costTokens > 0 && (
            <View style={s.costTag}>
              <Text style={s.costTagText}>{costTokens} tokens</Text>
            </View>
          )}
        </View>

        {/* Tema (se houver) */}
        {item.descricao?.tema ? (
          <Text style={s.subTitle} numberOfLines={1}>
            {item.descricao.tema}
          </Text>
        ) : null}

        {/* Instrutor */}
        {!!item.instrutorNome && (
          <Text style={s.meta} numberOfLines={1}>
            Instrutor: {item.instrutorNome}
          </Text>
        )}

        {/* Descrição curta */}
        {!!item.descricao?.descricao && (
          <Text style={s.desc} numberOfLines={3}>
            {item.descricao.descricao}
          </Text>
        )}

        {/* Badges */}
        <View style={s.badgesRow}>
          <Badge>
            {item.status === 'ABERTO'
              ? 'Aberto'
              : item.status === 'EM_ANDAMENTO'
                ? 'Em andamento'
                : 'Concluído'}
          </Badge>
          <Badge>{isOnline ? 'Online' : 'Presencial'}</Badge>
        </View>

        {/* Quando */}
        <Text style={s.when}>{formatWorkshopDateRange(item)}</Text>

        {(onPrimary || onSecondary) && (
          <View style={s.actions}>
            {onPrimary ? (
              <GradientButton
                onPress={() => onPrimary(idNum)}
                label={primaryLabel ?? 'Ver detalhes'}
              />
            ) : null}

            {onSecondary ? (
              <OutlineButton
                onPress={() => onSecondary(idNum)}
                label={secondaryLabel ?? 'Cancelar'}
              />
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.badge}>
      <Text style={s.badgeText}>{children}</Text>
    </View>
  );
}

function GradientButton({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" style={{ flex: 1 }}>
      <LinearGradient
        colors={['#00FFA3', '#00D4FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.gradientBtn}
      >
        <Text style={s.gradientBtnText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function OutlineButton({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" style={s.outlineBtn}>
      <Text style={s.outlineBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#131313',
    borderColor: '#222',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden', // pra imagem respeitar o borderRadius
  },
  coverWrapper: {
    width: '100%',
    height: 140,
    backgroundColor: '#111',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  body: {
    padding: 16,
  },

  // título + tag de custo
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '600', flex: 1 },

  // 💰 tagzinha rosa só com contorno
  costTag: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f472b6',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  costTagText: {
    color: '#f9a8d4',
    fontSize: 11,
    fontWeight: '700',
  },

  subTitle: { color: '#bdbdbd', marginTop: 4 },
  meta: { color: '#9ca3af', marginTop: 4 },
  desc: { color: '#d1d5db', marginTop: 8 },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginHorizontal: -4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderColor: '#2a2a2a',
    borderWidth: 1,
    marginTop: 8,
    marginHorizontal: 4,
  },
  badgeText: { color: '#d1d5db', fontSize: 12 },
  when: { color: '#9ca3af', marginTop: 8 },
  actions: { flexDirection: 'row', columnGap: 12, marginTop: 16 },
  gradientBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  gradientBtnText: { color: '#000', fontWeight: '700' },
  outlineBtn: {
    flex: 1,
    borderColor: '#2a2a2a',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineBtnText: { color: '#e5e7eb', fontWeight: '700' },
});
