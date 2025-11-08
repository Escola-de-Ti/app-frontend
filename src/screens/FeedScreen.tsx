import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';

type Tag = { id: number; name: string };
type Author = { id: number; name: string; level?: number; avatarUrl?: string };
type Post = {
  id: string;
  author: Author;
  createdAt: string; // 'há 2h', 'Ontem', etc. (mock)
  title: string;
  description: string;
  tags: Tag[];
  imageUrl?: string;
  tokens?: number; // recompensa
  upvotes: number;
  comments: number;
  saved?: boolean;
  liked?: boolean;
};

const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    author: { id: 1, name: 'Matheus Rossini', level: 18 },
    createdAt: 'há 2h',
    title: 'Como usar Context + Hooks para autenticação',
    description:
      'Mostro um padrão simples com createContext + useReducer + interceptor do axios para refresh de token. Incluo também um exemplo de persistência usando expo-secure-store e uma abordagem para serializar o usuário.',
    tags: [
      { id: 1, name: 'React' },
      { id: 2, name: 'Context' },
      { id: 3, name: 'Auth' },
    ],
    imageUrl: undefined,
    tokens: 100,
    upvotes: 28,
    comments: 7,
    saved: false,
    liked: false,
  },
  {
    id: 'p2',
    author: { id: 2, name: 'André Jacob', level: 15 },
    createdAt: 'Ontem',
    title: 'Pandas: 10 truques que eu gostaria de saber antes',
    description:
      'Coisas como assign, query, pipe, explode, melt, pivot_table e groupby com múltiplas agregações. Também abordo como acelerar leituras com parquet e quando utilizar categorias.',
    tags: [
      { id: 4, name: 'Python' },
      { id: 5, name: 'Pandas' },
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop',
    tokens: 200,
    upvotes: 112,
    comments: 23,
    saved: true,
    liked: true,
  },
  {
    id: 'p3',
    author: { id: 3, name: 'Gabriel Marassi', level: 12 },
    createdAt: '21 Out',
    title: 'Checklist de produção para APIs com Express',
    description:
      'Rate limiting, Helmet, CORS, logs estruturados, compressão, validação com zod, DTOs, morgan só em dev, erros centralizados, métricas e readiness/liveness para orquestradores.',
    tags: [
      { id: 6, name: 'Node' },
      { id: 7, name: 'Express' },
    ],
    imageUrl: undefined,
    tokens: 150,
    upvotes: 64,
    comments: 12,
    saved: false,
    liked: false,
  },
];

const Chip = ({ text }: { text: string }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>#{text}</Text>
  </View>
);

function TokenPill({ amount }: { amount?: number }) {
  if (!amount) return null;
  return (
    <View style={styles.tokenPill}>
      <Text style={styles.tokenPillText}>+{amount} tokens</Text>
    </View>
  );
}

function Avatar({ author }: { author: Author }) {
  if (author.avatarUrl) {
    return <Image source={{ uri: author.avatarUrl }} style={styles.avatar} />;
  }
  // avatar placeholder com iniciais
  const initials = author.name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.avatarPlaceholder}>
      <Text style={styles.avatarInitials}>{initials}</Text>
    </View>
  );
}

function PostCard({
  post,
  onToggleLike,
  onToggleSave,
  onOpen,
}: {
  post: Post;
  onToggleLike: (id: string) => void;
  onToggleSave: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      {/* header */}
      <View style={styles.cardHeader}>
        <Avatar author={post.author} />
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{post.author.name}</Text>
          <View style={styles.metaRow}>
            {typeof post.author.level === 'number' && (
              <>
                <Feather name="zap" size={12} color="#A1F0D3" />
                <Text style={styles.metaText}>Nvl. {post.author.level}</Text>
                <View style={styles.dot} />
              </>
            )}
            <Feather name="clock" size={12} color="#A9A9B2" />
            <Text style={styles.metaText}>{post.createdAt}</Text>
          </View>
        </View>

        {/* recompensa */}
        <TokenPill amount={post.tokens} />
      </View>

      {/* título */}
      <TouchableOpacity activeOpacity={0.8} onPress={() => onOpen(post.id)}>
        <Text style={styles.title}>{post.title}</Text>
      </TouchableOpacity>

      {/* imagem (opcional) */}
      {post.imageUrl ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onOpen(post.id)}
          style={styles.imageWrap}
        >
          <Image source={{ uri: post.imageUrl }} style={styles.image} />
        </TouchableOpacity>
      ) : null}

      {/* descrição */}
      <Text style={styles.description} numberOfLines={expanded ? undefined : 3}>
        {post.description}
      </Text>
      <TouchableOpacity onPress={() => setExpanded((v) => !v)} style={{ alignSelf: 'flex-start' }}>
        <Text style={styles.seeMore}>{expanded ? 'ver menos' : 'ver mais'}</Text>
      </TouchableOpacity>

      {/* tags */}
      {!!post.tags?.length && (
        <View style={styles.tagsRow}>
          {post.tags.map((t) => (
            <Chip key={t.id} text={t.name} />
          ))}
        </View>
      )}

      {/* ações */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onToggleLike(post.id)}
          activeOpacity={0.8}
          style={styles.actionBtn}
        >
          <LinearGradient
            colors={post.liked ? ['#00FFA3', '#7C73FF'] : ['#26262F', '#26262F']}
            style={styles.actionBtnInner}
          >
            <Feather name="thumbs-up" size={16} color={post.liked ? '#0B0B0E' : '#C9C9D4'} />
          </LinearGradient>
          <Text style={styles.actionText}>{post.upvotes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onOpen(post.id)}
          activeOpacity={0.8}
          style={styles.actionBtn}
        >
          <LinearGradient colors={['#26262F', '#26262F']} style={styles.actionBtnInner}>
            <Feather name="message-square" size={16} color="#C9C9D4" />
          </LinearGradient>
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={() => onToggleSave(post.id)}
          activeOpacity={0.8}
          style={styles.actionBtn}
        >
          <LinearGradient
            colors={post.saved ? ['#00FFA3', '#7C73FF'] : ['#26262F', '#26262F']}
            style={styles.actionBtnInner}
          >
            <Feather
              name={post.saved ? 'bookmark' : 'bookmark'}
              size={16}
              color={post.saved ? '#0B0B0E' : '#C9C9D4'}
            />
          </LinearGradient>
          <Text style={styles.actionText}>{post.saved ? 'Salvo' : 'Salvar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const [data, setData] = useState<Post[]>(MOCK_POSTS);
  const [refreshing, setRefreshing] = useState(false);

  const onToggleLike = useCallback((id: string) => {
    setData((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, upvotes: p.liked ? Math.max(0, p.upvotes - 1) : p.upvotes + 1 }
          : p
      )
    );
  }, []);

  const onToggleSave = useCallback((id: string) => {
    setData((prev) => prev.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p)));
  }, []);

  const onOpen = useCallback((id: string) => {
    // Futuro: navigation.navigate('PostDetail', { id })
    // Por enquanto, só dá um feedback visual
    console.log('Open post:', id);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // mock de refresh
    setTimeout(() => {
      setData((prev) => [...prev]);
      setRefreshing(false);
    }, 800);
  }, []);

  const keyExtractor = useCallback((item: Post) => item.id, []);
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

  return (
    <AppLayout initialActivePage="Feed">
      <FlatList
        style={styles.container}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 110, paddingTop: 8 }}
        data={data}
        keyExtractor={keyExtractor}
        ListHeaderComponent={header}
        ItemSeparatorComponent={ItemSeparator}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onToggleLike={onToggleLike}
            onToggleSave={onToggleSave}
            onOpen={onOpen}
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
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgb(17, 17, 17)' },

  header: { paddingHorizontal: 2, paddingTop: 8, paddingBottom: 12 },
  h1: { color: '#F9F9FF', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#BDBDCC', marginTop: 4 },

  card: {
    backgroundColor: '#17171C',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A33',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#282833',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: '#EDEDF5', fontWeight: '800' },

  authorName: { color: '#EDEDF5', fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  metaText: { color: '#A9A9B2', fontSize: 12 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#3A3A44', marginHorizontal: 4 },

  title: { color: '#F0F0FF', fontSize: 16, fontWeight: '800', marginTop: 10 },
  description: { color: '#CFCFE2', marginTop: 8, lineHeight: 20 },
  seeMore: { color: '#8CECC8', fontWeight: '700', marginTop: 6 },

  imageWrap: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  image: { width: '100%', aspectRatio: 16 / 9 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    backgroundColor: '#20202A',
    borderWidth: 1,
    borderColor: '#343445',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  chipText: { color: '#BDBDCC', fontSize: 12 },

  tokenPill: {
    backgroundColor: '#2A203B',
    borderWidth: 1,
    borderColor: '#5B4A8F',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  tokenPillText: { color: '#E1C9FF', fontWeight: '700', fontSize: 12 },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtnInner: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  actionText: { color: '#C9C9D4', fontWeight: '700' },
});
