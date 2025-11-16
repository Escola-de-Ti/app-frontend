// src/screens/FeedScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  RefreshControl,
  ListRenderItemInfo,
  Animated,
  LayoutChangeEvent,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import AppLayout, { HEADER_OFFSET, FOOTER_OFFSET } from '../components/AppLayout';

import PostCard from '../components/posts/PostCard';
import PostDetails from '../components/posts/PostDetails';

import type { PostFeedModel, PostFeedDTO } from '../types';
import { getFeed, upvotePost, type OrderBy } from '../services/posts';
import type { UpvoteResponse } from '../services/posts';

import InputFilterFeed from '../components/filters/InputFilterFeed';
import FilterButton from '../components/filters/FilterButton';

type Cursor = { lastPostId?: number | null; lastScore?: number | null } | null;
type FeedRouteParams = {
  openPostId?: number;
};

const PAGE_SIZE = 20;
const PREFETCH_DISTANCE_PX = 320;

// helpers
const toBool = (v: any): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
  return false;
};
const toNum = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// labels que aparecem na UI
type OrderFilter =
  | 'Relevância'
  | 'Mais votados'
  | 'Menos votados'
  | 'Mais recentes'
  | 'Mais antigos'
  | 'Mais comentados'
  | null;

// mapeia o label do botão pro enum do back
const mapFilterToOrderBy = (filter: OrderFilter): OrderBy | undefined => {
  switch (filter) {
    case 'Relevância':
      return 'RELEVANCE';
    case 'Mais votados':
      return 'UPVOTES_DESC';
    case 'Menos votados':
      return 'UPVOTES_ASC';
    case 'Mais recentes':
      return 'DATE_DESC';
    case 'Mais antigos':
      return 'DATE_ASC';
    // "Mais comentados" não tem enum próprio no back,
    // então deixamos undefined pra usar a ordenação padrão (RELEVANCE)
    // e tratamos a ordenação no client.
    case 'Mais comentados':
    default:
      return undefined;
  }
};

export default function FeedScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params: FeedRouteParams = route.params || {};

  const [data, setData] = useState<PostFeedModel[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const queryRef = useRef<string>('');

  const cursorRef = useRef<Cursor>(null);
  const initialLoadedRef = useRef(false);

  const inFlightRef = useRef(false);
  const layoutScrollY = useRef(new Animated.Value(0)).current;

  const viewportHRef = useRef(0);
  const contentHRef = useRef(0);

  // ===== controle de PostDetails aberto =====
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  // ===== filtro de ordenação =====
  const [orderFilter, setOrderFilter] = useState<OrderFilter>(null);
  // ref pra mandar pro back sem precisar entrar em deps de hook
  const orderByRef = useRef<OrderBy | undefined>(undefined);

  const handleOpenPost = useCallback((postId: number) => {
    setSelectedPostId(postId);
    setDetailsVisible(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setDetailsVisible(false);
    setSelectedPostId(null);
  }, []);

  // quando vier de edição com navigation.navigate('Feed', { openPostId })
  useEffect(() => {
    if (params?.openPostId != null) {
      const id = Number(params.openPostId);
      if (Number.isFinite(id)) {
        setSelectedPostId(id);
        setDetailsVisible(true);
      }
      // limpa o param pra não reabrir em outras navegações
      navigation.setParams?.({ openPostId: undefined });
    }
  }, [params?.openPostId, navigation]);

  const mergeById = useCallback((prev: PostFeedModel[], next: PostFeedModel[]) => {
    const map = new Map<string | number, PostFeedModel>();
    for (const p of prev) map.set(p.id, p);
    for (const n of next) map.set(n.id, { ...(map.get(n.id) ?? ({} as any)), ...n });
    const out: PostFeedModel[] = [];
    for (const p of prev) out.push(map.get(p.id)!);
    for (const n of next) if (!prev.some((p) => p.id === n.id)) out.push(map.get(n.id)!);
    return out;
  }, []);

  const mapPost = useCallback((p: PostFeedDTO): PostFeedModel => {
    const idNum = Number((p as any).id);
    const usuarioIdNum = Number((p as any).usuarioId);
    const totalComentarios = toNum(
      (p as any).totalComentarios ?? (p as any).comentariosCount ?? (p as any).comments ?? 0
    );

    // prioriza jaVotou vindo do back
    const voted =
      (p as any).jaVotou ??
      (p as any).votado ??
      (p as any).usuarioJaVotou ??
      (p as any).userVoted ??
      false;

    return {
      id: Number.isFinite(idNum) ? idNum : ((p as any).id as any),
      usuarioId: Number.isFinite(usuarioIdNum) ? usuarioIdNum : ((p as any).usuarioId as any),
      nomeUsuario: (p as any).nomeUsuario,
      titulo: (p as any).titulo,
      descricao: (p as any).descricao ?? '',
      totalUpVotes: toNum((p as any).totalUpVotes ?? 0),
      totalComentarios,
      usuarioJaVotou: toBool(voted),
      tags:
        (p as any).tags?.map((t: any) => ({
          id: typeof t.id === 'string' ? t.id : Number(t.id),
          nome: t.nome ?? t.name ?? '',
        })) ?? [],
      dataCriacao: String((p as any).dataCriacao),
      relevanceScore: (p as any).relevanceScore ?? undefined,
      tagsEmComum: (p as any).tagsEmComum ?? undefined,
    };
  }, []);

  // ===== load =====
  const fetchFeed = useCallback(
    async (opts?: { reset?: boolean }) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      const isReset = !!opts?.reset;
      const cursorParams =
        !isReset && cursorRef.current?.lastPostId != null && cursorRef.current?.lastScore != null
          ? {
              lastPostId: cursorRef.current.lastPostId!,
              lastScore: cursorRef.current.lastScore!,
            }
          : {};

      // monta params já incluindo orderBy quando existir
      const params: any = {
        pageSize: PAGE_SIZE,
        q: queryRef.current,
        ...cursorParams,
      };

      if (orderByRef.current) {
        params.orderBy = orderByRef.current;
      }

      try {
        const dto = await getFeed(params as any);

        const rawPosts = Array.isArray((dto as any)?.posts) ? (dto as any).posts : [];
        const mapped = rawPosts.map(mapPost);

        let nextLastPostId = (dto as any)?.lastPostId ?? null;
        const nextLastScore = (dto as any)?.lastScore ?? null;
        if ((nextLastPostId == null || Number.isNaN(Number(nextLastPostId))) && mapped.length > 0) {
          const last = mapped[mapped.length - 1];
          const idNum = Number(last.id);
          if (Number.isFinite(idNum)) nextLastPostId = idNum;
        }
        cursorRef.current = { lastPostId: nextLastPostId, lastScore: nextLastScore };

        const serverHasMore = (dto as any)?.hasMore;
        const finalHasMore =
          typeof serverHasMore === 'boolean' ? serverHasMore : mapped.length === PAGE_SIZE;
        setHasMore(finalHasMore);

        setData((prev) => (isReset ? mapped : mergeById(prev, mapped)));

        if (isReset) {
          initialLoadedRef.current = true;
        }
      } finally {
        inFlightRef.current = false;
      }
    },
    [mapPost, mergeById]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      cursorRef.current = null;
      initialLoadedRef.current = false;
      setHasMore(true);
      await fetchFeed({ reset: true });
    } finally {
      setRefreshing(false);
    }
  }, [fetchFeed]);

  // 👉 Toda vez que a tela ganhar foco (navigate pra ela), dá refresh no feed
  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [onRefresh])
  );

  const tryLoadMore = useCallback(async () => {
    if (!initialLoadedRef.current) return;
    if (!hasMore) return;
    if (loadingMore || inFlightRef.current) return;

    setLoadingMore(true);
    try {
      await fetchFeed();
    } finally {
      setLoadingMore(false);
    }
  }, [fetchFeed, hasMore, loadingMore]);

  const maybePrefillScreen = useCallback(async () => {
    const vh = viewportHRef.current;
    const ch = contentHRef.current;
    if (!vh || !ch) return;

    let attempts = 0;
    while (ch < vh - 1 && hasMore && attempts < 2) {
      await tryLoadMore();
      attempts++;
    }
  }, [hasMore, tryLoadMore]);

  // ===== eventos do FlatList =====

  const onEndReached = useCallback(async () => {
    await tryLoadMore();
  }, [tryLoadMore]);

  const onListScroll = Animated.event([{ nativeEvent: { contentOffset: { y: layoutScrollY } } }], {
    useNativeDriver: false,
    listener: (e: any) => {
      const y = e?.nativeEvent?.contentOffset?.y ?? 0;
      const h = e?.nativeEvent?.layoutMeasurement?.height ?? 0;
      const ch = e?.nativeEvent?.contentSize?.height ?? 0;

      viewportHRef.current = h;
      contentHRef.current = ch;

      const dist = ch - (y + h);
      if (dist < PREFETCH_DISTANCE_PX) {
        tryLoadMore();
      }
    },
  });

  const onListLayout = useCallback(
    (e: LayoutChangeEvent) => {
      viewportHRef.current = e.nativeEvent.layout.height;
      maybePrefillScreen();
    },
    [maybePrefillScreen]
  );

  const onContentSizeChange = useCallback(
    (w: number, h: number) => {
      contentHRef.current = h;
      maybePrefillScreen();
    },
    [maybePrefillScreen]
  );

  // ===== votação =====
  const handleUpvote = useCallback(
    async (postId: number, willUpvote: boolean): Promise<UpvoteResponse | void> => {
      try {
        const resp = await upvotePost(postId);

        const serverVoted = toBool(
          (resp as any)?.jaVotou ?? (resp as any)?.userVoted ?? (resp as any)?.votado
        );
        const final = serverVoted ?? willUpvote;

        const serverCount = (resp as any)?.totalUpVotes;
        const nextCountNumber =
          serverCount !== undefined && serverCount !== null ? toNum(serverCount) : undefined;

        setData((prev) =>
          prev.map((p) => {
            if (Number(p.id) !== Number(postId)) return p;
            const prevVoted = !!p.usuarioJaVotou;

            let nextCount = p.totalUpVotes ?? 0;
            if (typeof nextCountNumber === 'number') {
              nextCount = nextCountNumber;
            } else if (final !== prevVoted) {
              nextCount = Math.max(0, (p.totalUpVotes ?? 0) + (final ? 1 : -1));
            }

            return {
              ...p,
              usuarioJaVotou: final,
              totalUpVotes: nextCount,
            };
          })
        );

        return resp;
      } catch (e) {
        console.log('[FEED] falha ao votar no post', postId, e);
      }
    },
    []
  );

  const keyExtractor = useCallback((item: PostFeedModel) => String(item.id), []);

  const ItemSeparator = useCallback(() => <View style={{ height: 14 }} />, []);

  // ===== ordenação em memória =====
  // Só tratamos "Mais comentados" no client; o resto fica por conta do back
  const sortedData = useMemo(() => {
    if (orderFilter !== 'Mais comentados') return data;

    const copy = [...data];
    return copy.sort((a, b) => (b.totalComentarios ?? 0) - (a.totalComentarios ?? 0));
  }, [data, orderFilter]);

  const handleSelectOrderFilter = useCallback(
    (filter: string) => {
      const nextFilter = filter as OrderFilter;
      setOrderFilter(nextFilter);

      // atualiza orderBy usado pela API
      orderByRef.current = mapFilterToOrderBy(nextFilter);

      // reset de paginação quando muda ordenação
      cursorRef.current = null;
      initialLoadedRef.current = false;
      setHasMore(true);

      // refetch com novo orderBy
      fetchFeed({ reset: true });
    },
    [fetchFeed]
  );

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.h1}>Feed</Text>
        <Text style={styles.subtitle}>Explore conteúdos da comunidade</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <InputFilterFeed
              value={q}
              onChangeText={setQ}
              loading={searching}
              onSearch={async (query: string) => {
                const normalized = query.trim();
                if (normalized === queryRef.current && initialLoadedRef.current) return;
                queryRef.current = normalized;
                setSearching(true);
                try {
                  cursorRef.current = null;
                  initialLoadedRef.current = false;
                  setHasMore(true);
                  await fetchFeed({ reset: true });
                } finally {
                  setSearching(false);
                }
              }}
              placeholder="Buscar posts e usuários…"
            />
          </View>

          <FilterButton
            onSelectFilter={handleSelectOrderFilter}
            activeFilter={orderFilter ?? undefined}
          />
        </View>
      </View>
    ),
    [q, searching, fetchFeed, handleSelectOrderFilter, orderFilter]
  );

  return (
    <AppLayout
      initialActivePage="Feed"
      backgroundColor="rgb(17, 17, 17)"
      wrapWithScroll={false}
      externalScrollY={layoutScrollY}
    >
      <FlatList
        style={styles.container}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: HEADER_OFFSET + 8,
          paddingBottom: FOOTER_OFFSET,
          overflow: 'visible',
        }}
        data={sortedData}
        keyExtractor={keyExtractor}
        ListHeaderComponent={header}
        ListHeaderComponentStyle={{
          zIndex: 20,
          ...(Platform.OS === 'android' ? { elevation: 20 } : {}),
        }}
        ItemSeparatorComponent={ItemSeparator}
        renderItem={({ item }: ListRenderItemInfo<PostFeedModel>) => (
          <TouchableOpacity activeOpacity={0.9}>
            <PostCard
              post={item}
              initiallyUpvoted={!!item.usuarioJaVotou}
              commentCount={Number(item.totalComentarios ?? 0)}
              onUpvote={handleUpvote}
            />
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl
            tintColor="#7C73FF"
            colors={['#7C73FF']}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        onEndReachedThreshold={0.2}
        onEndReached={onEndReached}
        initialNumToRender={PAGE_SIZE}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        windowSize={7}
        onScroll={onListScroll}
        scrollEventThrottle={16}
        onLayout={onListLayout}
        onContentSizeChange={onContentSizeChange}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 18, alignItems: 'center' }}>
              <Feather name="loader" size={18} color="#7C73FF" />
            </View>
          ) : null
        }
      />

      {/* Modal com PostDetails */}
      <Modal
        visible={detailsVisible && selectedPostId != null}
        animationType="slide"
        onRequestClose={handleCloseDetails}
      >
        {selectedPostId != null && (
          <PostDetails
            postId={selectedPostId}
            onRequestClose={handleCloseDetails}
            onDeleted={(deletedId) => {
              setData((prev) => prev.filter((p) => Number(p.id) !== Number(deletedId)));
              onRefresh();
            }}
          />
        )}
      </Modal>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(17, 17, 17)',
    position: 'relative',
  },
  header: {
    paddingHorizontal: 2,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: 'rgb(17, 17, 17)',
    zIndex: 20,
    ...Platform.select({
      android: { elevation: 20 },
    }),
  },
  h1: { color: '#F9F9FF', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#BDBDCC', marginTop: 4 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    columnGap: 12,
  },
  searchInputWrapper: {
    flex: 1,
  },
});
