// src/components/posts/PostCard.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import RNModal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';

import PostDetails from './PostDetails';

import type { PostFeedModel } from '../../types';
import type { UpvoteResponse } from '../../services/posts';
import { OwnContentVoteError } from '../../services/posts';

type PostCardProps = {
  post: PostFeedModel;
  currentUserName?: string;
  userLevelLabel?: string;
  commentCount?: number;
  initiallyUpvoted?: boolean;
  onUpvote?: (
    postId: number,
    willUpvote: boolean
  ) => Promise<UpvoteResponse | void> | UpvoteResponse | void;
  onEdit?: (postId: number) => void;
  onDelete?: (postId: number) => void;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export function PostCard({
  post,
  currentUserName,
  userLevelLabel,
  commentCount,
  initiallyUpvoted,
  onUpvote,
}: PostCardProps) {
  const navigation = useNavigation<any>();

  const [menuVisible, setMenuVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [focusComment, setFocusComment] = useState(false);

  const [hasUpvoted, setHasUpvoted] = useState<boolean>(
    typeof initiallyUpvoted === 'boolean' ? initiallyUpvoted : !!post.usuarioJaVotou
  );
  const [hasCommented, setHasCommented] = useState(false);
  const [upvotes, setUpvotes] = useState<number>(Number(post.totalUpVotes ?? 0));
  const [comments, setComments] = useState<number>(
    Number(typeof commentCount === 'number' ? commentCount : (post.totalComentarios ?? 0))
  );

  const votingRef = useRef(false); // evita double-tap/disparos concorrentes

  useEffect(() => {
    setHasUpvoted(typeof initiallyUpvoted === 'boolean' ? initiallyUpvoted : !!post.usuarioJaVotou);
    setUpvotes(Number(post.totalUpVotes ?? 0));
    setComments(
      Number(typeof commentCount === 'number' ? commentCount : (post.totalComentarios ?? 0))
    );
  }, [
    post.id,
    post.usuarioJaVotou,
    post.totalUpVotes,
    post.totalComentarios,
    initiallyUpvoted,
    commentCount,
  ]);

  const isAuthor = currentUserName && currentUserName === post.nomeUsuario;
  const createdAt = useMemo(() => formatDate(post.dataCriacao), [post.dataCriacao]);

  // ==== INFO DO AUTOR (ID) ==================================
  const authorId = useMemo(() => {
    const anyPost: any = post;
    const raw = anyPost.usuarioId ?? anyPost.autorId ?? anyPost.userId ?? null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [post]);

  // ==== AVATAR DO AUTOR (APENAS O QUE JÁ VEM NO POST) ========
  const authorAvatarUrl = useMemo(() => {
    const anyPost: any = post;
    return anyPost.urlImagem ?? null;
  }, [post]);

  const authorInitial = useMemo(
    () => (post.nomeUsuario || '?').charAt(0).toUpperCase(),
    [post.nomeUsuario]
  );

  // ==== IMAGEM PRINCIPAL DO POST (usa exatamente o formato do feed) ====
  const postMainImageUrl = useMemo(() => {
    const anyPost: any = post;

    // 1) formato do feed: imagens: [{ urlImagem }]
    if (Array.isArray(anyPost.imagens) && anyPost.imagens.length > 0) {
      const first = anyPost.imagens[0];
      return first?.urlImagem ?? first?.url ?? null;
    }

    // 2) fallback se vier como urlsImagens (detalhes)
    if (Array.isArray(anyPost.urlsImagens) && anyPost.urlsImagens.length > 0) {
      const first = anyPost.urlsImagens[0];
      return first?.urlImagem ?? first?.url ?? null;
    }

    return null;
  }, [post]);

  const handleUpvote = async () => {
    if (votingRef.current) return; // trava enquanto a chamada anterior não termina
    votingRef.current = true;

    const willUpvote = !hasUpvoted;

    // otimista
    setHasUpvoted(willUpvote);
    setUpvotes((prev) => (willUpvote ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await onUpvote?.(Number(post.id), willUpvote);
      // se o pai corrigir via props (metaChange), os useEffect lá em cima sincronizam
    } catch (e: any) {
      // rollback TOTAL: botão e contador voltam pro estado anterior
      setHasUpvoted((prev) => !prev);
      setUpvotes((prev) => (!willUpvote ? prev + 1 : Math.max(0, prev - 1)));

      if (e instanceof OwnContentVoteError) {
        Alert.alert('Ops', e.message);
      } else {
        Alert.alert('Erro', 'Não foi possível registrar seu voto neste post.');
      }
    } finally {
      votingRef.current = false;
    }
  };

  const handleCommentPress = () => {
    setHasCommented(true);
    setFocusComment(true);
    setDetailsVisible(true);
  };

  const handlePostPress = () => {
    setFocusComment(false);
    setDetailsVisible(true);
  };

  const handleProfilePress = () => {
    if (!authorId) return;
    navigation.navigate('ProfileScreen', { userId: authorId });
  };

  const handleMetaChange = (meta: {
    comments?: number;
    upvotes?: number;
    userUpvoted?: boolean;
  }) => {
    if (typeof meta.comments === 'number') setComments(meta.comments);
    if (typeof meta.upvotes === 'number') setUpvotes(meta.upvotes);
    if (typeof meta.userUpvoted === 'boolean') setHasUpvoted(meta.userUpvoted);
  };

  const closeModal = () => {
    setDetailsVisible(false);
    setFocusComment(false);
  };

  return (
    <>
      {/* Card */}
      <TouchableOpacity activeOpacity={0.9} onPress={handlePostPress}>
        <View style={styles.card}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.userInfo}
              activeOpacity={0.8}
              onPress={handleProfilePress}
            >
              <View style={styles.avatar}>
                {authorAvatarUrl ? (
                  <Image source={{ uri: authorAvatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{authorInitial}</Text>
                )}
              </View>
              <View>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{post.nomeUsuario || 'Usuário'}</Text>
                  {!!userLevelLabel && (
                    <View style={styles.levelContainer}>
                      <Text style={styles.levelText}>Nvl. {userLevelLabel}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.postDate}>{createdAt}</Text>
              </View>
            </TouchableOpacity>

            {!!isAuthor && (
              <TouchableOpacity onPress={() => setMenuVisible(true)} activeOpacity={0.7}>
                <Feather name="more-horizontal" size={22} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>{post.titulo}</Text>
            {!!post.descricao && <Text style={styles.description}>{post.descricao}</Text>}

            {/* IMAGEM PRINCIPAL DO POST (se existir) */}
            {postMainImageUrl && (
              <View style={styles.postImageWrapper}>
                <Image
                  source={{ uri: postMainImageUrl }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.tagsWrap}>
              {post.tags?.map((t) => (
                <View key={String(t.id)} style={styles.tagContainer}>
                  <Text style={styles.tagText}>#{(t as any).nome ?? (t as any).name}</Text>
                </View>
              ))}
            </View>

            <View style={styles.stats}>
              <TouchableOpacity onPress={handleUpvote} activeOpacity={0.8}>
                <View style={[styles.upvoteContainer, hasUpvoted && styles.upvoteActive]}>
                  <Feather name="arrow-up" size={16} color={hasUpvoted ? '#003d2b' : '#fff'} />
                  <Text style={[styles.upvoteText, hasUpvoted && styles.upvoteTextActive]}>
                    {upvotes}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleCommentPress} activeOpacity={0.8}>
                <View style={[styles.commentContainer]}>
                  <Feather name="message-circle" size={16} color={'#fff'} />
                  {/* <Text style={[styles.commentText, hasCommented && styles.commentTextActive]}>
                    {comments}
                  </Text> */}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Modal de detalhes */}
      <RNModal
        isVisible={detailsVisible}
        onSwipeComplete={closeModal}
        swipeDirection="down"
        onBackdropPress={closeModal}
        propagateSwipe
        style={styles.modal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropOpacity={0.6}
        useNativeDriverForBackdrop
      >
        <View style={styles.modalContent}>
          <View style={styles.swipeIndicatorContainer}>
            <View style={styles.swipeIndicator} />
            <Text style={styles.modalTitle}>Comentários</Text>
          </View>

          <PostDetails
            postId={Number(post.id)}
            focusComment={focusComment}
            initiallyUpvoted={hasUpvoted}
            initiallyUpvotes={upvotes}
            onMetaChange={handleMetaChange}
            onRequestClose={closeModal}
          />
        </View>
      </RNModal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141417',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 50,
    backgroundColor: '#3a3a40',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 50,
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
  body: { marginTop: 14 },
  title: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 6 },
  description: { color: '#ccc', fontSize: 14, lineHeight: 20 },

  // imagem do post
  postImageWrapper: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  postImage: {
    width: '100%',
    height: 200,
  },

  footer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, maxWidth: '70%' },
  tagContainer: {
    borderColor: '#8a73ff',
    borderWidth: 1.8,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: { color: '#8a73ff', fontSize: 12, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 20 },
  upvoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  upvoteText: { color: '#ccc', fontSize: 13 },
  upvoteActive: { backgroundColor: '#6ef7c3' },
  upvoteTextActive: { color: '#003d2b', fontWeight: '600' },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  commentText: { color: '#ccc', fontSize: 13 },
  modal: { justifyContent: 'flex-end', margin: 0 },
  modalContent: {
    height: '95%',
    backgroundColor: '#0b0b0f',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  swipeIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
    marginBottom: 8,
  },
  swipeIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#555',
    marginBottom: 8,
  },
  modalTitle: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

export default PostCard;
