import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PostDetails } from './PostDetails';
import RNModal from 'react-native-modal';

export function PostCard() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [focusComment, setFocusComment] = useState(false);

  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [hasCommented, setHasCommented] = useState(false);
  const [upvotes, setUpvotes] = useState(0);
  const [comments, setComments] = useState(37);

  const currentUser = 'Gabriel Marassi';

  const post = {
    userName: 'Gabriel Marassi',
    userLevel: '14',
    postDate: '2d atrás',
    title: 'Como vocês organizam os estudos de programação?',
    description:
      'Estou tentando conciliar faculdade, projetos pessoais e cursos online. Alguém tem uma rotina que funcione bem?',
    tag: 'Dúvida',
  };

  const isAuthor = currentUser === post.userName;

  const handleUpvote = () => {
    setHasUpvoted(!hasUpvoted);
    setUpvotes((prev) => prev + (hasUpvoted ? -1 : 1));
  };

  const handleCommentPress = () => {
    setHasCommented(true);
    setComments((prev) => prev + 1);
    setFocusComment(true);
    setDetailsVisible(true);
  };

  const handlePostPress = () => {
    setFocusComment(false);
    setDetailsVisible(true);
  };

  const handleProfilePress = () => {
    Alert.alert('Perfil', `Abrir perfil de ${post.userName}`);
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
                <Text style={styles.avatarText}>{post.userName.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{post.userName}</Text>
                  <View style={styles.levelContainer}>
                    <Text style={styles.levelText}>Nvl. {post.userLevel}</Text>
                  </View>
                </View>
                <Text style={styles.postDate}>{post.postDate}</Text>
              </View>
            </TouchableOpacity>

            {isAuthor && (
              <TouchableOpacity onPress={() => setMenuVisible(true)} activeOpacity={0.7}>
                <Feather name="more-horizontal" size={22} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.description}>{post.description}</Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.tagContainer}>
              <Text style={styles.tagText}>{post.tag}</Text>
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

          {isAuthor && (
            <Modal
              transparent
              visible={menuVisible}
              animationType="fade"
              onRequestClose={() => setMenuVisible(false)}
            >
              <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                <View style={styles.modalOverlay}>
                  <View style={styles.menu}>
                    <TouchableOpacity style={styles.menuItem}>
                      <Feather name="edit-3" size={14} color="#fff" />
                      <Text style={styles.menuText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                      <Feather name="trash-2" size={14} color="#ff6666" />
                      <Text style={[styles.menuText, { color: '#ff6666' }]}>Apagar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}
        </View>
      </TouchableOpacity>

      <RNModal
        isVisible={detailsVisible}
        onSwipeComplete={closeModal}
        swipeDirection="down"
        onBackdropPress={closeModal}
        propagateSwipe={true}
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
          <PostDetails focusComment={focusComment} />
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
  tagContainer: {
    borderColor: '#8a73ff',
    borderWidth: 1.8,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: { color: '#8a73ff', fontSize: 13, fontWeight: '600' },
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
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  commentContainerActive: { backgroundColor: '#4a334d' },
  commentText: { color: '#ccc', fontSize: 13 },
  commentTextActive: { color: '#ffeaff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'transparent' },
  menu: {
    position: 'absolute',
    right: 20,
    top: 90,
    backgroundColor: '#1f1f23',
    borderRadius: 8,
    paddingVertical: 6,
    width: 120,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  menuText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
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
  modalTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
