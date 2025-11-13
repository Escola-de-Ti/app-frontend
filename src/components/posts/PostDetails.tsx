// src/components/posts/PostDetails.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CommentItem } from '../CommentItem';
import {
  getPostDetails,
  createComment,
  upvoteComment,
  upvotePost,
  getCommentReplies,
} from '../../services/posts';

type ID = string | number;

type ComentarioDTO = {
  id: number;
  postId: number;
  usuarioId?: number;
  usuarioNome: string;
  texto: string;
  totalUpVotes: number;
  totalSuperVotes?: number;
  comentarioPaiId: number | null;
  dataCriacao: string;
};

type Comment = {
  id: ID;
  user: string;
  content: string;
  upvotes: number;
  replies?: Comment[];
};

type PostDetailsProps = {
  postId: number;
  focusComment?: boolean;
  initiallyUpvoted?: boolean;
  initiallyUpvotes?: number;
  onMetaChange?: (meta: { comments?: number; upvotes?: number; userUpvoted?: boolean }) => void;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ===== Helpers de normalização ===== */
type RawComment = any;

function pickFirstArray(...candidates: any[]): any[] {
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
    if (c && Array.isArray(c.items)) return c.items;
    if (c && Array.isArray(c.content)) return c.content;
    if (c && Array.isArray(c.data)) return c.data;
  }
  return [];
}

function normalizeOne(raw: RawComment, parentOverride?: number | null): ComentarioDTO {
  const id = Number(
    raw.id ?? raw.comentarioId ?? raw.commentId ?? raw._id ?? raw.codigo ?? Date.now()
  );
  const postId = Number(raw.postId ?? raw.post ?? raw.post_id ?? 0);
  const usuarioNome =
    raw.usuarioNome ?? raw.autorNome ?? raw.userName ?? raw.authorName ?? raw.user ?? 'Usuário';
  const texto = raw.texto ?? raw.conteudo ?? raw.content ?? raw.body ?? '';
  const totalUpVotes = Number(raw.totalUpVotes ?? raw.upvotes ?? raw.votes ?? 0);
  const comentarioPaiIdRaw =
    parentOverride ??
    raw.comentarioPaiId ??
    raw.parentId ??
    raw.comentarioPai ??
    raw.parent ??
    null;

  const comentarioPaiId =
    comentarioPaiIdRaw === null || comentarioPaiIdRaw === undefined
      ? null
      : Number(comentarioPaiIdRaw);

  const dataCriacao =
    raw.dataCriacao ?? raw.createdAt ?? raw.criadoEm ?? raw.created_at ?? new Date().toISOString();

  return {
    id,
    postId,
    usuarioNome: String(usuarioNome),
    texto: String(texto ?? ''),
    totalUpVotes,
    totalSuperVotes: Number(raw.totalSuperVotes ?? 0),
    comentarioPaiId,
    dataCriacao: String(dataCriacao),
  };
}

function flattenComments(rawList: RawComment[], parentId: number | null = null): ComentarioDTO[] {
  const out: ComentarioDTO[] = [];
  for (const raw of rawList) {
    const norm = normalizeOne(raw, parentId);
    out.push(norm);

    const kids = pickFirstArray(raw.replies, raw.children, raw.filhos, raw.comentarios);
    if (kids.length) {
      out.push(...flattenComments(kids, norm.id));
    }
  }
  return out;
}

function buildCommentTree(detailsItems: any[]): Comment[] {
  const baseRaw = pickFirstArray(
    detailsItems,
    (detailsItems as any)?.comentarios,
    (detailsItems as any)?.comments,
    (detailsItems as any)?.listaComentarios,
    (detailsItems as any)?.comentariosDoPost
  );

  const normalizedFlat: ComentarioDTO[] = flattenComments(baseRaw);

  const nodeById = new Map<number, Comment & { _pid: number | null }>();
  for (const c of normalizedFlat) {
    nodeById.set(c.id, {
      id: String(c.id),
      user: c.usuarioNome,
      content: c.texto,
      upvotes: Number(c.totalUpVotes ?? 0),
      replies: [],
      _pid:
        c.comentarioPaiId === null || c.comentarioPaiId === undefined
          ? null
          : Number(c.comentarioPaiId),
    });
  }

  const roots: (Comment & { _pid: number | null })[] = [];
  for (const node of nodeById.values()) {
    const pid = node._pid;
    if (pid !== null && pid !== undefined && nodeById.has(pid)) {
      nodeById.get(pid)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  }

  const strip = (n: Comment & { _pid?: number | null }): Comment => {
    const { _pid, replies = [], ...rest } = n as any;
    return { ...rest, replies: replies.map(strip) };
  };

  return roots.map(strip);
}

function countComments(list: Comment[]): number {
  let total = 0;
  const walk = (arr: Comment[]) => {
    for (const c of arr) {
      total += 1;
      if (c.replies?.length) walk(c.replies);
    }
  };
  walk(list);
  return total;
}

export function PostDetails({
  postId,
  focusComment = false,
  initiallyUpvoted = false,
  initiallyUpvotes,
  onMetaChange,
}: PostDetailsProps) {
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postAuthor, setPostAuthor] = useState('');
  const [postCreatedAt, setPostCreatedAt] = useState('');
  const [postUpvoted, setPostUpvoted] = useState<boolean>(!!initiallyUpvoted);
  const [postUpvotes, setPostUpvotes] = useState<number>(Number(initiallyUpvotes ?? 0));
  const [comments, setComments] = useState<Comment[]>([]);
  const [hasMoreComments, setHasMoreComments] = useState(false);

  const [newComment, setNewComment] = useState('');
  const inputRef = useRef<TextInput>(null);

  // 🔒 trava de concorrência para upvote (evita spam)
  const upvoteLockRef = useRef(false);
  const [upvoteLoading, setUpvoteLoading] = useState(false);

  // guardar a ref mais recente do callback pra evitar loop
  type MetaFn = (meta: { comments?: number; upvotes?: number; userUpvoted?: boolean }) => void;
  const metaRef = useRef<MetaFn | null>(null);
  useEffect(() => {
    metaRef.current = onMetaChange ?? null;
  }, [onMetaChange]);

  // evita recarga duplicada
  const lastLoadedPostIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (focusComment && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [focusComment]);

  useEffect(() => {
    let mounted = true;

    // impede reentradas se o mesmo postId já estiver carregado
    if (lastLoadedPostIdRef.current === postId) {
      return () => {};
    }
    lastLoadedPostIdRef.current = postId;

    (async () => {
      try {
        const data = await getPostDetails(postId, 50);
        if (!mounted) return;

        setPostTitle(String(data.titulo ?? ''));
        setPostDescription(String(data.descricao ?? ''));
        setPostAuthor(String(data.usuarioNome ?? ''));
        setPostCreatedAt(formatDate(String(data.dataCriacao ?? '')));

        const apiUpvotes = Number(data.totalUpVotes ?? 0);
        setPostUpvotes((prev) => (prev > 0 ? Math.max(prev, apiUpvotes) : apiUpvotes));

        setHasMoreComments(Boolean((data as any).hasMoreComentarios));

        if (typeof (data as any).usuarioJaVotou === 'boolean') {
          setPostUpvoted(Boolean((data as any).usuarioJaVotou));
        }

        const candidate =
          (data as any)?.comentarios ??
          (data as any)?.comments ??
          (data as any)?.listaComentarios ??
          (data as any)?.comentariosDoPost ??
          [];

        const tree = buildCommentTree(candidate);
        setComments(tree);

        // Hidratar respostas de 1º nível
        try {
          const hydrated = await Promise.all(
            tree.map(async (root) => {
              try {
                const repliesDto = await getCommentReplies(Number(root.id), 50);
                if (!Array.isArray(repliesDto) || repliesDto.length === 0) return root;
                const replies = repliesDto.map((r) => ({
                  id: String(r.id),
                  user: r.usuarioNome,
                  content: r.texto,
                  upvotes: Number(r.totalUpVotes ?? 0),
                  replies: [],
                }));
                return { ...root, replies };
              } catch {
                return root;
              }
            })
          );
          if (mounted) setComments(hydrated);
        } catch (e) {
          console.log('[PostDetails] falha ao hidratar respostas', (e as any)?.message);
        }

        // meta (usa ref para não entrar em loop)
        metaRef.current?.({
          comments: countComments(tree),
          upvotes: apiUpvotes,
          userUpvoted:
            typeof (data as any).usuarioJaVotou === 'boolean'
              ? Boolean((data as any).usuarioJaVotou)
              : undefined,
        });
      } catch (e: any) {
        console.log('[PostDetails] erro ao carregar', e?.message);
        Alert.alert('Erro', 'Não foi possível carregar os detalhes do post.');
      }
    })();

    return () => {
      mounted = false;
    };
    // *** dependência SOMENTE em postId para evitar loop por ref de função recriada
  }, [postId]);

  const totalComments = useMemo(() => countComments(comments), [comments]);

  useEffect(() => {
    metaRef.current?.({ comments: totalComments });
  }, [totalComments]);

  useEffect(() => {
    metaRef.current?.({ upvotes: postUpvotes, userUpvoted: postUpvoted });
  }, [postUpvotes, postUpvoted]);

  const handlePostToggleUpvote = async () => {
    if (upvoteLockRef.current) return;
    upvoteLockRef.current = true;
    setUpvoteLoading(true);

    const prevVoted = postUpvoted;
    const next = !prevVoted;

    // otimista
    setPostUpvoted(next);
    setPostUpvotes((prev) => Math.max(0, prev + (next ? 1 : -1)));

    try {
      const resp = await upvotePost(postId);
      const finalUserVoted = typeof resp?.userVoted === 'boolean' ? resp.userVoted : next;

      if (finalUserVoted !== next) {
        setPostUpvotes((prev) => Math.max(0, prev + (finalUserVoted ? 1 : -1)));
      }
      setPostUpvoted(finalUserVoted);

      if (typeof resp?.totalUpVotes === 'number') {
        setPostUpvotes(resp.totalUpVotes);
      }
    } catch {
      // rollback
      setPostUpvoted(prevVoted);
      setPostUpvotes((prev) => Math.max(0, prev + (prevVoted ? 1 : -1)));
      Alert.alert('Erro', 'Não foi possível registrar seu voto no post.');
    } finally {
      setUpvoteLoading(false);
      upvoteLockRef.current = false;
    }
  };

  const handleAddComment = async () => {
    const texto = newComment.trim();
    if (!texto) return;

    const optimistic: Comment = {
      id: `temp-${Date.now()}`,
      user: 'Você',
      content: texto,
      upvotes: 0,
      replies: [],
    };
    setComments((prev) => [optimistic, ...prev]);
    setNewComment('');

    try {
      const created = await createComment({ postId, texto, comentarioPaiId: null });
      setComments((prev) => {
        const withoutTemp = prev.filter((c) => c.id !== optimistic.id);
        const mapped: Comment = {
          id: String(created.id),
          user: created.usuarioNome,
          content: created.texto,
          upvotes: Number(created.totalUpVotes ?? 0),
          replies: [],
        };
        return [mapped, ...withoutTemp];
      });
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setNewComment(texto);
      Alert.alert('Erro', 'Não foi possível publicar seu comentário.');
    }
  };

  const handleReply = async (parentId: ID, replyText: string) => {
    const texto = String(replyText ?? '').trim();
    if (!texto) return;

    const tempId = `temp-r-${Date.now()}`;
    const tempReply: Comment = {
      id: tempId,
      user: 'Você',
      content: texto,
      upvotes: 0,
      replies: [],
    };

    const addTemp = (list: Comment[]): Comment[] =>
      list.map((c) =>
        String(c.id) === String(parentId)
          ? { ...c, replies: [...(c.replies || []), tempReply] }
          : { ...c, replies: c.replies ? addTemp(c.replies) : [] }
      );
    setComments((prev) => addTemp(prev));

    try {
      const saved = await createComment({ postId, texto, comentarioPaiId: Number(parentId) });

      const replaceTemp = (list: Comment[]): Comment[] =>
        list.map((c) => {
          if (String(c.id) === String(parentId)) {
            const newReplies = (c.replies || []).map((r) =>
              String(r.id) === String(tempId)
                ? {
                    id: String(saved.id),
                    user: saved.usuarioNome,
                    content: saved.texto,
                    upvotes: Number(saved.totalUpVotes ?? 0),
                    replies: [],
                  }
                : r
            );
            return { ...c, replies: newReplies };
          }
          return { ...c, replies: c.replies ? replaceTemp(c.replies) : [] };
        });

      setComments((prev) => replaceTemp(prev));
    } catch {
      const removeTemp = (list: Comment[]): Comment[] =>
        list.map((c) => {
          const children = c.replies || [];
          const filtered = children.filter((r) => String(r.id) !== String(tempId));
          return {
            ...c,
            replies: filtered.map((r) => ({
              ...r,
              replies: r.replies?.length ? removeTemp(r.replies) : r.replies,
            })),
          };
        });

      setComments((prev) => removeTemp(prev));
      Alert.alert('Erro', 'Não foi possível enviar a resposta.');
    }
  };

  const handleCommentUpvote = async (commentId: ID, willUpvote: boolean) => {
    try {
      if (willUpvote) {
        await upvoteComment(Number(commentId));
      } else {
        // se houver endpoint para desfazer voto, chamar aqui
      }
    } catch (e) {
      throw e;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(postAuthor || '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{postAuthor || 'Usuário'}</Text>
              <View style={styles.levelContainer}>
                <Text style={styles.levelText}>Nvl. —</Text>
              </View>
            </View>
            <Text style={styles.postDate}>{postCreatedAt}</Text>
          </View>
        </View>
      </View>

      {/* Título + Descrição */}
      <Text style={styles.title}>{postTitle}</Text>
      {!!postDescription && <Text style={styles.description}>{postDescription}</Text>}

      <TouchableOpacity
        onPress={handlePostToggleUpvote}
        activeOpacity={upvoteLoading ? 1 : 0.8}
        disabled={upvoteLoading}
      >
        <View
          style={[
            styles.upvoteContainer,
            postUpvoted && styles.upvoteActive,
            upvoteLoading && { opacity: 0.6 },
          ]}
        >
          <Feather name="arrow-up" size={16} color={postUpvoted ? '#003d2b' : '#fff'} />
          <Text style={[styles.upvoteText, postUpvoted && styles.upvoteTextActive]}>
            {postUpvotes}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Comentários */}
      <View style={styles.divider} />
      <View style={styles.commentsSection}>
        <Text style={styles.commentTitle}>
          Comentários ({totalComments}
          {hasMoreComments ? '+' : ''})
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.commentInput}
            placeholder="Escreva um comentário..."
            placeholderTextColor="#888"
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleAddComment}>
            <Feather name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {comments.map((comment) => (
          <CommentItem
            key={String(comment.id)}
            comment={comment}
            depth={0}
            onReply={handleReply}
            onUpvote={handleCommentUpvote}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#0b0b0f', flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 50,
    backgroundColor: '#3a3a40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  levelContainer: {
    backgroundColor: '#182848',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  levelText: { color: '#82caff', fontSize: 12, fontWeight: '600' },
  postDate: { color: '#aaa', fontSize: 12 },
  title: { color: '#fff', fontWeight: '700', fontSize: 17, marginTop: 14, marginBottom: 6 },
  description: { color: '#ccc', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  upvoteContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  upvoteActive: { backgroundColor: '#6ef7c3' },
  upvoteText: { color: '#ccc', fontSize: 13 },
  upvoteTextActive: { color: '#003d2b', fontWeight: '600' },
  divider: {
    marginTop: 24,
    marginBottom: 10,
    borderBottomColor: '#3a3a40',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentsSection: { marginTop: 10 },
  commentTitle: { color: '#b3b3ff', fontWeight: '600', marginBottom: 10 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1b1f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  commentInput: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 8, minHeight: 50 },
  sendButton: { marginLeft: 10, backgroundColor: '#5b2eff', padding: 8, borderRadius: 8 },
});

export default PostDetails;
