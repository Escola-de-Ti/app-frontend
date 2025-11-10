// src/components/posts/PostCard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import RNModal from 'react-native-modal';
import { PostDetails } from './PostDetails';

import type { PostFeedModel } from '../../types';
import type { UpvoteResponse } from '../../services/posts';

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
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PostCard({
  post,
  currentUserName,
  userLevelLabel,
  commentCount,
  initiallyUpvoted,
  onUpvote,
  onEdit,
  onDelete,
}: PostCardProps) {
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

  // reidrata quando o item mudar (refresh/paginação)
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

  // TOGGLE no Card (otimista + reconcilia resposta do parent)
  const handleUpvote = async () => {
    const next = !hasUpvoted;

    // otimista
    setHasUpvoted(next);
    setUpvotes((prev) => Math.max(0, prev + (next ? 1 : -1)));

    try {
      const result = await onUpvote?.(post.id, next);
      const resp = result as UpvoteResponse | void;

      if (resp && typeof resp === 'object') {
        const final = typeof resp.userVoted === 'boolean' ? resp.userVoted : next;
        if (final !== next) {
          // corrige caso o back discorde do otimista
          setUpvotes((final) => {
            // troca para final
            return final === final ? final : final; // linha neutra; só pra satisfazer TS
          });
          setHasUpvoted(final);
          setUpvotes((prev) => Math.max(0, prev + (final ? 1 : -1)));
        }
        if (typeof resp.totalUpVotes === 'number') {
          setUpvotes(resp.totalUpVotes);
        }
      }
    } catch {
      // rollback
      setHasUpvoted((prev) => !prev);
      setUpvotes((prev) => Math.max(0, prev + (hasUpvoted ? 1 : -1)));
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
    Alert.alert('Perfil', `Abrir perfil de ${post.nomeUsuario}`);
  };

  // sincroniza com o Details (quando ele toggle lá)
  const handleMetaChange = (meta: {
    comments?: number;
    upvotes?: number;
    userUpvoted?: boolean;
  }) => {
    if (typeof meta.comments === 'number') setComments(meta.comments);
    if (typeof meta.upvotes === 'number') setUpvotes(meta.upvotes);
    if (typeof meta.userUpvoted === 'boolean') setHasUpvoted(meta.userUpvoted);
  };

  const closeModal = () => setDetailsVisible(false);

  return (
    <>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePostPress}>
        <View style={styles.card}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.userInfo}
              activeOpacity={0.8}
              onPress={handleProfilePress}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(post.nomeUsuario || '?').charAt(0).toUpperCase()}
                </Text>
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
                <View
                  style={[styles.commentContainer, hasCommented && styles.commentContainerActive]}
                >
                  <Feather
                    name="message-circle"
                    size={16}
                    color={hasCommented ? '#ffeaff' : '#fff'}
                  />
                  <Text style={[styles.commentText, hasCommented && styles.commentTextActive]}>
                    {comments}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* menu autor ficou igual, omitido aqui pra encurtar */}
        </View>
      </TouchableOpacity>

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
            postId={post.id}
            focusComment={focusComment}
            initiallyUpvoted={hasUpvoted}
            initiallyUpvotes={upvotes}
            onMetaChange={handleMetaChange}
          />
        </View>
      </RNModal>
    </>
  );
}

const styles = StyleSheet.create({
  // ... (mesmos estilos que você já tinha)
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
  },
  upvoteText: { color: '#ccc', fontSize: 13 },
  upvoteActive: { backgroundColor: '#6ef7c3', borderRadius: 20 },
  upvoteTextActive: { color: '#003d2b', fontWeight: '600' },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  commentContainerActive: { backgroundColor: '#4a334d' },
  commentText: { color: '#ccc', fontSize: 13 },
  commentTextActive: { color: '#ffeaff', fontWeight: '600' },
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
