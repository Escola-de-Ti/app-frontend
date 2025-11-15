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
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import RNModal from 'react-native-modal';

import { CommentItem, CommentModel, ID } from '../CommentItem';
import {
  getPostDetails,
  createComment,
  upvoteComment,
  upvotePost,
  getCommentReplies,
  deletePost,
} from '../../services/posts';
import { useAuth } from '../../hooks/useAuth';

type PostDetailsProps = {
  postId: number;
  focusComment?: boolean;
  initiallyUpvoted?: boolean;
  initiallyUpvotes?: number;
  onMetaChange?: (meta: { comments?: number; upvotes?: number; userUpvoted?: boolean }) => void;
  /** Usado pelo pai (PostCard / Feed) pra fechar o modal antes de navegar pra edição */
  onRequestClose?: () => void;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function countComments(list: CommentModel[]): number {
  let total = 0;
  const walk = (arr: CommentModel[]) => {
    for (const c of arr) {
      total += 1;
      if (Array.isArray(c.replies) && c.replies.length) walk(c.replies);
    }
  };
  walk(list);
  return total;
}

function mergeReplies(current: CommentModel[] = [], incoming: CommentModel[] = []): CommentModel[] {
  const byId = new Map<string, CommentModel>();
  for (const c of current) byId.set(String(c.id), c);

  for (const inc of incoming) {
    const key = String(inc.id);
    if (byId.has(key)) {
      const prev = byId.get(key)!;
      byId.set(key, {
        ...prev,
        ...inc,
        replies: mergeReplies(prev.replies || [], inc.replies || []),
        repliesCount:
          typeof prev.repliesCount === 'number' || typeof inc.repliesCount === 'number'
            ? Math.max(Number(prev.repliesCount || 0), Number(inc.repliesCount || 0))
            : (prev.repliesCount ?? inc.repliesCount),
        canLoadMore: (prev.canLoadMore ?? false) || (inc.canLoadMore ?? false),
      });
    } else {
      byId.set(key, inc);
    }
  }
  return Array.from(byId.values());
}

function normalizeComment(raw: any): CommentModel {
  const repliesArray =
    raw.replies || raw.children || raw.comentarios || raw.comentariosDoComentario || [];

  const replies = Array.isArray(repliesArray) ? repliesArray.map(normalizeComment) : [];

  const repliesCount =
    typeof raw.repliesCount === 'number'
      ? raw.repliesCount
      : Array.isArray(repliesArray)
        ? repliesArray.length
        : undefined;

  return {
    id: String(raw.id ?? raw.comentarioId ?? raw._id ?? `${Date.now()}-${Math.random()}`),
    user: String(raw.usuarioNome ?? raw.autorNome ?? raw.userName ?? 'Usuário'),
    content: String(raw.texto ?? raw.conteudo ?? raw.body ?? ''),
    upvotes: Number(raw.totalUpVotes ?? raw.upvotes ?? 0),
    replies,
    repliesCount,
    canLoadMore: true,
  };
}

export function PostDetails({
  postId,
  focusComment = false,
  initiallyUpvoted = false,
  initiallyUpvotes,
  onMetaChange,
  onRequestClose,
}: PostDetailsProps) {
  const navigation = useNavigation<any>();
  const { userId } = useAuth();

  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postAuthor, setPostAuthor] = useState('');
  const [postCreatedAt, setPostCreatedAt] = useState('');
  const [postUpvoted, setPostUpvoted] = useState<boolean>(!!initiallyUpvoted);
  const [postUpvotes, setPostUpvotes] = useState<number>(Number(initiallyUpvotes ?? 0));
  const [comments, setComments] = useState<CommentModel[]>([]);
  const [hasMoreComments, setHasMoreComments] = useState(false);

  // URLs pra exibir no detalhe
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  // Imagens com id + url pra mandar pro EditPostScreen
  const [postImagesForEdit, setPostImagesForEdit] = useState<{ id: number; url: string }[]>([]);

  // tags do post (nomes)
  const [postTags, setPostTags] = useState<string[]>([]);

  const [postOwnerId, setPostOwnerId] = useState<number | null>(null);

  const [newComment, setNewComment] = useState('');
  const inputRef = useRef<TextInput>(null);

  const [menuVisible, setMenuVisible] = useState(false);

  const metaRef = useRef<PostDetailsProps['onMetaChange']>(onMetaChange);
  useEffect(() => {
    metaRef.current = onMetaChange;
  }, [onMetaChange]);

  const currentPostIdRef = useRef<number | null>(null);
  const firstLevelHydratedRef = useRef<boolean>(false);
  const inflightRepliesRef = useRef<Set<string>>(new Set());

  const isOwner =
    userId != null && postOwnerId != null ? Number(userId) === Number(postOwnerId) : false;

  useEffect(() => {
    if (focusComment && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [focusComment]);

  useEffect(() => {
    let mounted = true;

    currentPostIdRef.current = postId;
    firstLevelHydratedRef.current = false;
    inflightRepliesRef.current.clear();

    (async () => {
      try {
        const data = await getPostDetails(postId, 50);
        if (!mounted) return;

        setPostTitle(String(data.titulo ?? ''));
        setPostDescription(String(data.descricao ?? ''));
        setPostAuthor(String(data.usuarioNome ?? ''));
        setPostCreatedAt(formatDate(String(data.dataCriacao ?? '')));
        setPostOwnerId(
          typeof (data as any).usuarioId !== 'undefined' ? Number((data as any).usuarioId) : null
        );

        const apiUpvotes = Number(data.totalUpVotes ?? 0);
        setPostUpvotes((prev) => (prev > 0 ? Math.max(prev, apiUpvotes) : apiUpvotes));

        setHasMoreComments(Boolean((data as any).hasMoreComentarios));

        if (typeof (data as any).usuarioJaVotou === 'boolean') {
          setPostUpvoted(Boolean((data as any).usuarioJaVotou));
        }

        // tags do post vindas do back
        const rawTags = (data as any)?.tags ?? [];
        if (Array.isArray(rawTags)) {
          const names = rawTags
            .map((t: any) => String(t.name ?? t.nome ?? t.descricao ?? '').trim())
            .filter((n) => n.length > 0);
          setPostTags(names);
        } else {
          setPostTags([]);
        }

        // Imagens do post: urlsImagens ou imagens (cada item deve ter id + url/urlImagem)
        const urlsRaw = (data as any)?.urlsImagens ?? (data as any)?.imagens ?? [];
        if (Array.isArray(urlsRaw)) {
          const imagesForState: { id: number; url: string }[] = [];
          const urls: string[] = [];

          for (const item of urlsRaw) {
            const url = String(item?.urlImagem ?? item?.url ?? '').trim();
            if (!url) continue;

            urls.push(url);

            const rawId = Number(item?.id ?? item?.imagemId ?? item?.imageId);
            if (Number.isFinite(rawId)) {
              imagesForState.push({ id: rawId, url });
            }
          }

          setImageUrls(urls);
          setPostImagesForEdit(imagesForState);
        } else {
          setImageUrls([]);
          setPostImagesForEdit([]);
        }

        const base =
          (data as any)?.comentarios ??
          (data as any)?.comments ??
          (data as any)?.listaComentarios ??
          (data as any)?.comentariosDoPost ??
          [];

        const roots = Array.isArray(base) ? base.map(normalizeComment) : [];
        setComments(roots);

        metaRef.current?.({
          comments: countComments(roots),
          upvotes: apiUpvotes,
          userUpvoted:
            typeof (data as any).usuarioJaVotou === 'boolean'
              ? Boolean((data as any).usuarioJaVotou)
              : undefined,
        });

        // Hidrata 1º nível de respostas (uma vez por post)
        if (!firstLevelHydratedRef.current) {
          firstLevelHydratedRef.current = true;

          try {
            const hydrated = await Promise.all(
              roots.map(async (root) => {
                if (Array.isArray(root.replies) && root.replies.length > 0) {
                  return root;
                }

                const key = String(root.id);
                if (inflightRepliesRef.current.has(key)) return root;
                inflightRepliesRef.current.add(key);

                try {
                  const repliesDto = await getCommentReplies(Number(root.id), 50);
                  if (!mounted || currentPostIdRef.current !== postId) return root;

                  if (!Array.isArray(repliesDto) || repliesDto.length === 0) {
                    return { ...root, canLoadMore: false };
                  }

                  const mapped = repliesDto.map((r) => ({
                    id: String(r.id),
                    user: String(r.usuarioNome ?? 'Usuário'),
                    content: String(r.texto ?? ''),
                    upvotes: Number(r.totalUpVotes ?? 0),
                    replies: [],
                    repliesCount: (r as any)?.repliesCount ?? undefined,
                    canLoadMore: true,
                  })) as CommentModel[];

                  return {
                    ...root,
                    replies: mergeReplies(root.replies || [], mapped),
                    repliesCount:
                      typeof root.repliesCount === 'number'
                        ? Math.max(root.repliesCount, mapped.length)
                        : Math.max(root.replies?.length || 0, mapped.length),
                    canLoadMore: true,
                  };
                } catch {
                  return root;
                } finally {
                  inflightRepliesRef.current.delete(key);
                }
              })
            );

            if (mounted && currentPostIdRef.current === postId) {
              setComments(hydrated);
            }
          } catch (e) {
            console.log('[PostDetails] falha ao hidratar 1º nível', (e as any)?.message);
          }
        }
      } catch (e: any) {
        console.log('[PostDetails] erro ao carregar', e?.message);
        Alert.alert('Erro', 'Não foi possível carregar os detalhes do post.');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [postId, userId]);

  const totalComments = useMemo(() => countComments(comments), [comments]);

  useEffect(() => {
    metaRef.current?.({ comments: totalComments });
  }, [totalComments]);

  useEffect(() => {
    metaRef.current?.({ upvotes: postUpvotes, userUpvoted: postUpvoted });
  }, [postUpvotes, postUpvoted]);

  const handlePostToggleUpvote = async () => {
    const prevVoted = postUpvoted;
    const next = !prevVoted;

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
      setPostUpvoted(prevVoted);
      setPostUpvotes((prev) => Math.max(0, prev + (prevVoted ? 1 : -1)));
      Alert.alert('Erro', 'Não foi possível registrar seu voto no post.');
    }
  };

  const handleAddComment = async () => {
    const texto = newComment.trim();
    if (!texto) return;

    const optimistic: CommentModel = {
      id: `temp-${Date.now()}`,
      user: 'Você',
      content: texto,
      upvotes: 0,
      replies: [],
      canLoadMore: false,
    };
    setComments((prev) => [optimistic, ...prev]);
    setNewComment('');

    try {
      const created = await createComment({ postId, texto, comentarioPaiId: null });
      setComments((prev) => {
        const withoutTemp = prev.filter((c) => c.id !== optimistic.id);
        const mapped: CommentModel = {
          id: String(created.id),
          user: created.usuarioNome,
          content: created.texto,
          upvotes: Number(created.totalUpVotes ?? 0),
          replies: [],
          repliesCount: 0,
          canLoadMore: false,
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
    const tempReply: CommentModel = {
      id: tempId,
      user: 'Você',
      content: texto,
      upvotes: 0,
      replies: [],
      repliesCount: 0,
      canLoadMore: false,
    };

    const addTemp = (list: CommentModel[]): CommentModel[] =>
      list.map((c) => {
        if (String(c.id) === String(parentId)) {
          return { ...c, replies: [...(c.replies || []), tempReply] };
        }
        return { ...c, replies: c.replies ? addTemp(c.replies) : [] };
      });
    setComments((prev) => addTemp(prev));

    try {
      const saved = await createComment({ postId, texto, comentarioPaiId: Number(parentId) });

      const replaceTemp = (list: CommentModel[]): CommentModel[] =>
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
                    repliesCount: 0,
                    canLoadMore: false,
                  }
                : r
            );
            return {
              ...c,
              replies: newReplies,
              repliesCount: c.repliesCount ?? newReplies.length,
            };
          }
          return { ...c, replies: c.replies ? replaceTemp(c.replies) : [] };
        });

      setComments((prev) => replaceTemp(prev));
    } catch {
      const removeTemp = (list: CommentModel[]): CommentModel[] =>
        list.map((c) => {
          if (String(c.id) === String(parentId)) {
            const filtered = (c.replies || []).filter((r) => String(r.id) !== String(tempId));
            return { ...c, replies: filtered };
          }
          return { ...c, replies: c.replies ? removeTemp(c.replies) : [] };
        });

      setComments((prev) => removeTemp(prev));
      Alert.alert('Erro', 'Não foi possível enviar a resposta.');
    }
  };

  const handleLoadMoreReplies = async (parentId: ID) => {
    const key = String(parentId);
    if (inflightRepliesRef.current.has(key)) return;
    inflightRepliesRef.current.add(key);
    try {
      const repliesDto = await getCommentReplies(Number(parentId), 50);
      const mapped: CommentModel[] = Array.isArray(repliesDto)
        ? repliesDto.map((r) => ({
            id: String(r.id),
            user: String(r.usuarioNome ?? 'Usuário'),
            content: String(r.texto ?? ''),
            upvotes: Number(r.totalUpVotes ?? 0),
            replies: [],
            repliesCount: (r as any)?.repliesCount ?? undefined,
            canLoadMore: true,
          }))
        : [];

      const mergeIntoTree = (list: CommentModel[]): CommentModel[] =>
        list.map((c) => {
          if (String(c.id) === key) {
            if (mapped.length === 0) {
              return { ...c, canLoadMore: false };
            }
            const mergedReplies = mergeReplies(c.replies || [], mapped);
            return {
              ...c,
              replies: mergedReplies,
              repliesCount:
                typeof c.repliesCount === 'number'
                  ? Math.max(c.repliesCount, mergedReplies.length)
                  : Math.max(c.replies?.length || 0, mergedReplies.length),
              canLoadMore: true,
            };
          }
          return { ...c, replies: c.replies ? mergeIntoTree(c.replies) : [] };
        });

      setComments((prev) => mergeIntoTree(prev));
    } catch (e) {
      console.log('[PostDetails] handleLoadMoreReplies error:', (e as any)?.message);
    } finally {
      inflightRepliesRef.current.delete(key);
    }
  };

  const handleCommentUpvote = async (commentId: ID, willUpvote: boolean) => {
    try {
      if (willUpvote) {
        await upvoteComment(Number(commentId));
      } else {
        // se tiver endpoint de "desvotar", chamar aqui
      }
    } catch (e) {
      throw e;
    }
  };

  const handleOpenPostMenu = () => {
    if (!isOwner) return;
    setMenuVisible(true);
  };

  const handleEditPost = () => {
    setMenuVisible(false);
    // fecha o modal de detalhes lá no pai
    onRequestClose?.();
    navigation.navigate('EditPostScreen', {
      postId,
      initialTitle: postTitle,
      initialContent: postDescription,
      initialImageUrls: imageUrls,
      initialTags: postTags,
      initialImages: postImagesForEdit,
    });
  };

  const handleDeletePost = () => {
    setMenuVisible(false);
    Alert.alert('Excluir post', 'Tem certeza que deseja excluir este post?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(postId);
            Alert.alert('Sucesso', 'Post excluído com sucesso.');
            onRequestClose?.();
            navigation.goBack?.();
          } catch (e: any) {
            Alert.alert('Erro', 'Não foi possível excluir o post.');
          }
        },
      },
    ]);
  };

  const handleClose = () => {
    if (onRequestClose) {
      onRequestClose();
    } else {
      navigation.goBack?.();
    }
  };

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.closeButton}
            >
              <Feather name="x" size={20} color="#ccc" />
            </TouchableOpacity>

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

          {isOwner && (
            <TouchableOpacity
              onPress={handleOpenPostMenu}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="more-horizontal" size={22} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>

        {/* Título + Descrição */}
        <Text style={styles.title}>{postTitle}</Text>
        {!!postDescription && <Text style={styles.description}>{postDescription}</Text>}

        {/* Tags do post */}
        {postTags.length > 0 && (
          <View style={styles.tagsRow}>
            {postTags.map((t) => (
              <View key={t} style={styles.tagPill}>
                <Text style={styles.tagText}>#{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Imagens do post */}
        {!!imageUrls.length && (
          <View style={styles.imagesContainer}>
            {imageUrls.map((url) => (
              <View key={url} style={styles.imageWrapper}>
                <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
              </View>
            ))}
          </View>
        )}

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
              onLoadMoreReplies={handleLoadMoreReplies}
            />
          ))}
        </View>
      </ScrollView>

      {/* Menu de ações do post (Editar / Excluir) */}
      <RNModal
        isVisible={menuVisible}
        onBackdropPress={() => setMenuVisible(false)}
        onBackButtonPress={() => setMenuVisible(false)}
        style={styles.menuModal}
        backdropOpacity={0.6}
        useNativeDriverForBackdrop
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={handleEditPost}>
            <Feather name="edit-2" size={18} color="#fff" />
            <Text style={styles.menuItemText}>Editar post</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleDeletePost}>
            <Feather name="trash-2" size={18} color="#ff6b6b" />
            <Text style={[styles.menuItemText, { color: '#ff6b6b' }]}>Excluir post</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuCancel]}
            onPress={() => setMenuVisible(false)}
          >
            <Text style={styles.menuCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </RNModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#0b0b0f', flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  closeButton: { padding: 4 },

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

  imagesContainer: { marginTop: 10, gap: 10 },
  imageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 10,
  },
  image: { width: '100%', height: 220 },

  // tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tagPill: {
    backgroundColor: '#1f2733',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#32425a',
  },
  tagText: {
    color: '#9fd3ff',
    fontSize: 12,
    fontWeight: '500',
  },

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

  // Menu de ações
  menuModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  menuContainer: {
    backgroundColor: '#15151a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 15,
  },
  menuCancel: {
    marginTop: 8,
    justifyContent: 'center',
  },
  menuCancelText: {
    color: '#bbb',
    fontSize: 15,
    textAlign: 'center',
    width: '100%',
  },
});

export default PostDetails;
