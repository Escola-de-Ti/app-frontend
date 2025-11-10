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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';

import PostCard from '../components/posts/PostCard';
import type { PostFeedModel, PostFeedDTO } from '../types';
import { getFeed, upvotePost } from '../services/posts';
import type { UpvoteResponse } from '../services/posts';
import { getVotedSet, markVoted, unmarkVoted } from '../services/votes';

type Cursor = { lastPostId?: number | null; lastScore?: number | null } | null;

export default function FeedScreen() {
  const [data, setData] = useState<PostFeedModel[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const cursorRef = useRef<Cursor>(null);
  const didInitRef = useRef(false);
  const initialLoadedRef = useRef(false);

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

  const fetchFeed = useCallback(
    async (opts?: { reset?: boolean }) => {
      const isReset = !!opts?.reset;
      const params =
        !isReset && cursorRef.current?.lastPostId != null && cursorRef.current?.lastScore != null
          ? {
              lastPostId: cursorRef.current.lastPostId!,
              lastScore: cursorRef.current.lastScore!,
            }
          : {};

      const dto = await getFeed({ pageSize: 20, ...params });

      cursorRef.current = {
        lastPostId: (dto as any)?.lastPostId ?? null,
        lastScore: (dto as any)?.lastScore ?? null,
      };
      setHasMore(Boolean((dto as any)?.hasMore));

      const mapped = (dto.posts ?? []).map(mapPost);
      setData((prev) => (isReset ? mapped : mergeById(prev, mapped)));

      if (isReset) initialLoadedRef.current = true;
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
      await fetchFeed({ reset: true });
    } finally {
      setRefreshing(false);
    }
  }, [fetchFeed]);

  const onEndReached = useCallback(async () => {
    if (!initialLoadedRef.current) return;
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await fetchFeed();
    } finally {
      setLoadingMore(false);
    }
  }, [fetchFeed, hasMore, loadingMore]);

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
      </View>
    ),
    []
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PostFeedModel>) => (
      <PostCard
        post={item}
        initiallyUpvoted={!!item.usuarioJaVotou}
        commentCount={Number(item.totalComentarios ?? 0)}
        onUpvote={handleUpvote}
      />
    ),
    [handleUpvote]
  );

  return (
    <AppLayout initialActivePage="Feed">
      <FlatList
        style={styles.container}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 110, paddingTop: 8 }}
        data={data}
        keyExtractor={keyExtractor}
        ListHeaderComponent={header}
        ItemSeparatorComponent={ItemSeparator}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            tintColor="#7C73FF"
            colors={['#7C73FF']}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={onEndReached}
        initialNumToRender={8}
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
