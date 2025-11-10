// src/components/posts/PostDetails.tsx
import React, { useEffect, useRef, useState } from 'react';
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
import { getPostDetails, createComment, upvoteComment, upvotePost } from '../../services/posts';

type ComentarioDTO = {
  id: number;
  postId: number;
  usuarioId: number;
  usuarioNome: string;
  texto: string;
  totalUpVotes: number;
  totalSuperVotes: number;
  comentarioPaiId: number | null;
  dataCriacao: string;
};

type Comment = {
  id: string;
  user: string;
  content: string;
  upvotes: number;
  replies?: Comment[];
};

type PostDetailsProps = {
  postId: number;
  focusComment?: boolean;
  /** estado inicial vindo do card (mantém a cor ao abrir a modal) */
  initiallyUpvoted?: boolean;
  initiallyUpvotes?: number;
  /** devolve contadores/estado para o Card sincronizar */
  onMetaChange?: (meta: { comments?: number; upvotes?: number; userUpvoted?: boolean }) => void;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildCommentTree(items: ComentarioDTO[]): Comment[] {
  const byId = new Map<number, Comment & { _pid: number | null }>();
  items.forEach((c) => {
    byId.set(c.id, {
      id: String(c.id),
      user: c.usuarioNome,
      content: c.texto,
      upvotes: Number(c.totalUpVotes ?? 0),
      replies: [],
      _pid: c.comentarioPaiId ?? null,
    });
  });

  const roots: Comment[] = [];
  byId.forEach((node) => {
    if (node._pid && byId.has(node._pid)) {
      const parent = byId.get(node._pid)!;
      parent.replies = parent.replies || [];
      parent.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  const clean = (arr: any[]): Comment[] =>
    arr.map(({ _pid, ...rest }) => ({
      ...rest,
      replies: rest.replies ? clean(rest.replies as any) : [],
    }));

  return clean(roots);
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

  // foca no input se veio do botão de comentar
  useEffect(() => {
    if (focusComment && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [focusComment]);

  // carrega detalhes do post
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getPostDetails(postId, 50);
        if (!mounted) return;

        setPostTitle(data.titulo);
        setPostDescription(data.descricao ?? '');
        setPostAuthor(data.usuarioNome);
        setPostCreatedAt(formatDate(data.dataCriacao));

        // votos: se o back trouxer contagem, usa; senão mantém a inicial
        const apiUpvotes = Number(data.totalUpVotes ?? 0);
        setPostUpvotes((prev) => (prev > 0 ? Math.max(prev, apiUpvotes) : apiUpvotes));

        setHasMoreComments(Boolean(data.hasMoreComentarios));

        // estado de voto do usuário: confia no back SE vier; senão mantém o inicial
        if (typeof (data as any).usuarioJaVotou === 'boolean') {
          setPostUpvoted(Boolean((data as any).usuarioJaVotou));
        }

        const tree = buildCommentTree(data.comentarios ?? []);
        setComments(tree);

        onMetaChange?.({
          comments: tree.length,
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
  }, [postId, onMetaChange]);

  // qualquer mudança atualiza o Card
  useEffect(() => {
    onMetaChange?.({ comments: comments.length });
  }, [comments.length, onMetaChange]);

  useEffect(() => {
    onMetaChange?.({ upvotes: postUpvotes, userUpvoted: postUpvoted });
  }, [postUpvotes, postUpvoted, onMetaChange]);

  // TOGGLE de voto (otimista + sincroniza com resposta do back)
  const handlePostToggleUpvote = async () => {
    const next = !postUpvoted;

    // otimista
    setPostUpvoted(next);
    setPostUpvotes((prev) => Math.max(0, prev + (next ? 1 : -1)));

    try {
      const resp = await upvotePost(postId);
      const finalUserVoted = typeof resp?.userVoted === 'boolean' ? resp.userVoted : next;

      // se o back divergir do otimista, corrige contagem
      if (finalUserVoted !== next) {
        setPostUpvotes((prev) => Math.max(0, prev + (finalUserVoted ? 1 : -1)));
      }
      setPostUpvoted(finalUserVoted);

      if (typeof resp?.totalUpVotes === 'number') {
        setPostUpvotes(resp.totalUpVotes);
      }
    } catch {
      // rollback total
      setPostUpvoted((prev) => !prev);
      setPostUpvotes((prev) => Math.max(0, prev + (postUpvoted ? 1 : -1)));
      Alert.alert('Erro', 'Não foi possível registrar seu voto no post.');
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

  const handleReply = async (parentId: string, replyText: string) => {
    const texto = replyText.trim();
    if (!texto) return;

    const tempReply: Comment = {
      id: `temp-r-${Date.now()}`,
      user: 'Você',
      content: texto,
      upvotes: 0,
      replies: [],
    };

    const addTemp = (list: Comment[]): Comment[] =>
      list.map((c) =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies || []), tempReply] }
          : { ...c, replies: c.replies ? addTemp(c.replies) : [] }
      );
    setComments((prev) => addTemp(prev));

    try {
      const saved = await createComment({ postId, texto, comentarioPaiId: Number(parentId) });

      const replaceTemp = (list: Comment[]): Comment[] =>
        list.map((c) => {
          if (c.id === parentId) {
            const newReplies = (c.replies || []).map((r) =>
              r.id === tempReply.id
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
      // remove recursivamente a reply otimista se falhar
      const removeTemp = (list: Comment[]): Comment[] =>
        list.map((c) => {
          const children = c.replies || [];
          const filtered = children.filter((r) => r.id !== tempReply.id);
          return {
            ...c,
            replies: filtered.length ? removeTemp(filtered) : [],
          };
        });

      setComments((prev) => removeTemp(prev));
      Alert.alert('Erro', 'Não foi possível enviar a resposta.');
    }
  };

  const handleCommentUpvote = async (commentId: string, willUpvote: boolean) => {
    try {
      if (willUpvote) {
        await upvoteComment(Number(commentId));
      } else {
        // se tiver endpoint de desfazer voto de comentário, chamar aqui
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

      <TouchableOpacity onPress={handlePostToggleUpvote} activeOpacity={0.8}>
        <View style={[styles.upvoteContainer, postUpvoted && styles.upvoteActive]}>
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
          Comentários ({comments.length}
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
            key={comment.id}
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
