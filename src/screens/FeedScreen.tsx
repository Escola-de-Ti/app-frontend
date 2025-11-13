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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppLayout, { HEADER_OFFSET, FOOTER_OFFSET } from '../components/AppLayout';

import PostCard from '../components/posts/PostCard';
import type { PostFeedModel, PostFeedDTO } from '../types';
import { getFeed, upvotePost } from '../services/posts';
import type { UpvoteResponse } from '../services/posts';
import { getVotedSet, markVoted, unmarkVoted } from '../services/votes';

import InputFilterFeed from '../components/filters/InputFilterFeed';

type Cursor = { lastPostId?: number | null; lastScore?: number | null } | null;

const PAGE_SIZE = 20;
const PREFETCH_DISTANCE_PX = 320;

export default function FeedScreen() {
  const [data, setData] = useState<PostFeedModel[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const queryRef = useRef<string>('');

  const cursorRef = useRef<Cursor>(null);
  const didInitRef = useRef(false);
  const initialLoadedRef = useRef(false);

  const inFlightRef = useRef(false);
  const layoutScrollY = useRef(new Animated.Value(0)).current;

  const viewportHRef = useRef(0);
  const contentHRef = useRef(0);

  const votedSetRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await getVotedSet();
        if (mounted) votedSetRef.current = s;
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
    const idNum = Number(p.id);
    const usuarioIdNum = Number(p.usuarioId);
    const totalComentarios = Number(
      (p as any).totalComentarios ?? (p as any).comentariosCount ?? (p as any).comments ?? 0
    );

    const base: PostFeedModel = {
      id: Number.isFinite(idNum) ? idNum : (p.id as any),
      usuarioId: Number.isFinite(usuarioIdNum) ? usuarioIdNum : (p.usuarioId as any),
      nomeUsuario: p.nomeUsuario,
      titulo: p.titulo,
      descricao: p.descricao ?? '',
      totalUpVotes: Number(p.totalUpVotes ?? 0),
      totalComentarios,
      usuarioJaVotou: Boolean((p as any).usuarioJaVotou ?? (p as any).userVoted ?? false),
      tags:
        p.tags?.map((t: any) => ({
          id: typeof t.id === 'string' ? t.id : Number(t.id),
          nome: t.nome ?? t.name ?? '',
        })) ?? [],
      dataCriacao: String(p.dataCriacao),
      relevanceScore: p.relevanceScore ?? undefined,
      tagsEmComum: p.tagsEmComum ?? undefined,
    };

    if (typeof base.id === 'number' && votedSetRef.current.has(base.id)) {
      base.usuarioJaVotou = true;
    }
    return base;
  }, []);

  // ===== load =====
  const fetchFeed = useCallback(
    async (opts?: { reset?: boolean }) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      const isReset = !!opts?.reset;
      const params =
        !isReset && cursorRef.current?.lastPostId != null && cursorRef.current?.lastScore != null
          ? {
              lastPostId: cursorRef.current.lastPostId!,
              lastScore: cursorRef.current.lastScore!,
            }
          : {};

      try {
        const dto = await getFeed({ pageSize: PAGE_SIZE, q: queryRef.current, ...params } as any);

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

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    (async () => {
      try {
        await fetchFeed({ reset: true });
      } catch (e) {
        console.log('[FEED] erro:', e);
      }
    })();
  }, [fetchFeed]);

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
    useNativeDriver: true,
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
        const final = typeof resp?.userVoted === 'boolean' ? resp.userVoted : willUpvote;

        if (final) {
          await markVoted(Number(postId));
          votedSetRef.current.add(Number(postId));
        } else {
          await unmarkVoted(Number(postId));
          votedSetRef.current.delete(Number(postId));
        }

        setData((prev) =>
          prev.map((p) => {
            if (Number(p.id) !== Number(postId)) return p;
            const prevVoted = !!p.usuarioJaVotou;
            let nextCount =
              typeof resp?.totalUpVotes === 'number'
                ? resp.totalUpVotes
                : (p.totalUpVotes ?? 0) + (final === prevVoted ? 0 : final ? 1 : -1);
            if (!Number.isFinite(nextCount)) nextCount = p.totalUpVotes ?? 0;
            return {
              ...p,
              usuarioJaVotou: final,
              totalUpVotes: Math.max(0, nextCount),
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

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.h1}>Feed</Text>
        <Text style={styles.subtitle}>Explore conteúdos da comunidade</Text>

        <View style={{ marginTop: 10 }}>
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
      </View>
    ),
    [q, searching, fetchFeed]
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
        }}
        data={data}
        keyExtractor={keyExtractor}
        ListHeaderComponent={header}
        ItemSeparatorComponent={ItemSeparator}
        renderItem={({ item }: ListRenderItemInfo<PostFeedModel>) => (
          <PostCard
            post={item}
            initiallyUpvoted={!!item.usuarioJaVotou}
            commentCount={Number(item.totalComentarios ?? 0)}
            onUpvote={handleUpvote}
          />
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
        removeClippedSubviews
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
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgb(17, 17, 17)' },
  header: { paddingHorizontal: 2, paddingTop: 8, paddingBottom: 12 },
  h1: { color: '#F9F9FF', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#BDBDCC', marginTop: 4 },
});
