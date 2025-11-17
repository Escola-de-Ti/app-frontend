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
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import AppLayout, { HEADER_OFFSET, FOOTER_OFFSET } from '../components/AppLayout';

import PostCard from '../components/posts/PostCard';
import PostDetails from '../components/posts/PostDetails';

import type { PostFeedModel, PostFeedDTO, ID } from '../types';
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
    default:
      return undefined;
  }
};

// Toast Component
function Toast({
  message,
  type = 'error',
  visible,
  onHide,
}: {
  message: string;
  type?: 'error' | 'success' | 'info';
  visible: boolean;
  onHide: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide();
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, opacity, translateY, onHide]);

  if (!visible) return null;

  const iconName =
    type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle' : 'info';
  const bgColor =
    type === 'error' ? '#ff6b6b' : type === 'success' ? '#51cf66' : '#339af0';

  return (
    <Animated.View
      style={[
        toastStyles.container,
        {
          backgroundColor: bgColor,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Feather name={iconName} size={20} color="#fff" />
      <Text style={toastStyles.message}>{message}</Text>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default function FeedScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params: FeedRouteParams = route.params || {};

  const [data, setData] = useState<PostFeedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('error');

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
  const orderByRef = useRef<OrderBy | undefined>(undefined);
  const [changingFilter, setChangingFilter] = useState(false);

  // Toast helper
  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleOpenPost = useCallback((postId: ID) => {
    const numericId = Number(postId);
    if (!Number.isFinite(numericId)) return;
    setSelectedPostId(numericId);
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

        setError(null);
      } catch (e: any) {
        const errorMsg = e?.response?.data?.message || e?.message || 'Não foi possível carregar o feed';
        console.log('[FEED] erro ao carregar:', errorMsg);
        if (isReset) {
          setError(errorMsg);
        } else {
          showToast(errorMsg, 'error');
        }
      } finally {
        inFlightRef.current = false;
      }
    },
    [mapPost, mergeById]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      cursorRef.current = null;
      initialLoadedRef.current = false;
      setHasMore(true);
      await fetchFeed({ reset: true });
    } finally {
      setRefreshing(false);
    }
  }, [fetchFeed]);

  useFocusEffect(
    useCallback(() => {
      const loadInitial = async () => {
        setLoading(true);
        setError(null);
        try {
          cursorRef.current = null;
          initialLoadedRef.current = false;
          setHasMore(true);
          await fetchFeed({ reset: true });
        } finally {
          setLoading(false);
        }
      };

      loadInitial();
    }, [fetchFeed])
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
      } catch (e: any) {
        const errorMsg = e?.response?.data?.message || e?.message || 'Não foi possível votar no post';
        showToast(errorMsg, 'error');
        console.log('[FEED] falha ao votar no post', postId, e);
      }
    },
    []
  );

  const keyExtractor = useCallback((item: PostFeedModel) => String(item.id), []);

  const ItemSeparator = useCallback(() => <View style={{ height: 14 }} />, []);

  const sortedData = useMemo(() => {    

    const copy = [...data];
    return copy.sort((a, b) => (b.totalComentarios ?? 0) - (a.totalComentarios ?? 0));
  }, [data, orderFilter]);

  const handleSelectOrderFilter = useCallback(
    async (filter: string) => {
      const nextFilter = filter as OrderFilter;
      setOrderFilter(nextFilter);

      orderByRef.current = mapFilterToOrderBy(nextFilter);

      cursorRef.current = null;
      initialLoadedRef.current = false;
      setHasMore(true);

      // Mostra loading enquanto muda ordenação
      setChangingFilter(true);
      try {
        await fetchFeed({ reset: true });
      } finally {
        setChangingFilter(false);
      }
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

  // Loading inicial
  if (loading && !refreshing) {
    return (
      <AppLayout
        initialActivePage="Feed"
        backgroundColor="rgb(17, 17, 17)"
        wrapWithScroll={false}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C73FF" />
          <Text style={styles.loadingText}>Carregando feed…</Text>
        </View>
      </AppLayout>
    );
  }

  // Error state
  if (error && !data.length) {
    return (
      <AppLayout
        initialActivePage="Feed"
        backgroundColor="rgb(17, 17, 17)"
        wrapWithScroll={false}
      >
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#ff9aa2" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      initialActivePage="Feed"
      backgroundColor="rgb(17, 17, 17)"
      wrapWithScroll={false}
      externalScrollY={layoutScrollY}
    >
      {/* Toast */}
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

      {/* Loading overlay quando muda filtro */}
      {changingFilter && (
        <View style={styles.filterLoadingOverlay}>
          <View style={styles.filterLoadingBox}>
            <ActivityIndicator size="large" color="#7C73FF" />
            <Text style={styles.filterLoadingText}>Aplicando filtro…</Text>
          </View>
        </View>
      )}

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
          <TouchableOpacity activeOpacity={0.9} onPress={() => handleOpenPost(item.id)}>
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
              <ActivityIndicator size="small" color="#7C73FF" />
            </View>
          ) : null
        }
      />

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
  loadingContainer: {
    flex: 1,
    backgroundColor: 'rgb(17, 17, 17)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#D8D8E3',
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: 'rgb(17, 17, 17)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff9aa2',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#7C73FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  filterLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterLoadingBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  filterLoadingText: {
    color: '#D8D8E3',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
});