import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CommentItem } from '../CommentItem';

type Comment = {
  id: string;
  user: string;
  content: string;
  upvotes: number;
  replies?: Comment[];
};

type PostDetailsProps = {
  focusComment?: boolean;
};

export function PostDetails({ focusComment = false }: PostDetailsProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [postUpvoted, setPostUpvoted] = useState(false);
  const [postUpvotes, setPostUpvotes] = useState(0);

  const currentUser = 'Willyan Tomaz';
  const postAuthor = 'Willyan Tomaz';
  const isAuthor = currentUser === postAuthor;

  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      user: 'Andre Jacob',
      content:
        'Excelente post! Eu também passei por uma experiência similar ao implementar Clean Architecture em um projeto grande. Uma dica que funcionou bem foi começar pela camada de domínio e ir expandindo gradualmente.',
      upvotes: 2,
      replies: [
        {
          id: '1-1',
          user: 'Willyan Tomaz',
          content:
            'Perfeito, André! É exatamente assim que comecei também. Essa abordagem ajuda a manter o foco.',
          upvotes: 1,
        },
      ],
    },
  ]);

  const [newComment, setNewComment] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (focusComment && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [focusComment]);

  const handlePostUpvote = () => {
    setPostUpvoted(!postUpvoted);
    setPostUpvotes((prev) => prev + (postUpvoted ? -1 : 1));
  };

  const handleAddComment = () => {
    if (newComment.trim() === '') return;
    const newEntry: Comment = {
      id: Date.now().toString(),
      user: currentUser,
      content: newComment.trim(),
      upvotes: 0,
      replies: [],
    };
    setComments((prev) => [newEntry, ...prev]);
    setNewComment('');
  };

  const handleReply = (parentId: string, replyText: string) => {
    const addReply = (list: Comment[]): Comment[] =>
      list.map((comment) => {
        if (comment.id === parentId) {
          const newReply: Comment = {
            id: Date.now().toString(),
            user: currentUser,
            content: replyText,
            upvotes: 0,
            replies: [],
          };
          return {
            ...comment,
            replies: comment.replies ? [...comment.replies, newReply] : [newReply],
          };
        }
        if (comment.replies) {
          return { ...comment, replies: addReply(comment.replies) };
        }
        return comment;
      });

    setComments((prev) => addReply(prev));
  };

  const handleProfilePress = () => {
    Alert.alert('Perfil', `Abrir perfil de ${postAuthor}`);
  };

  const handleEdit = () => {
    setMenuVisible(false);
    Alert.alert('Editar', 'Função de edição será implementada aqui.');
  };

  const handleDelete = () => {
    setMenuVisible(false);
    Alert.alert('Excluir', 'Função de exclusão será implementada aqui.');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={handleProfilePress} activeOpacity={0.8}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>W</Text>
          </View>
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{postAuthor}</Text>
              <View style={styles.levelContainer}>
                <Text style={styles.levelText}>Nvl. 13</Text>
              </View>
            </View>
            <Text style={styles.postDate}>2d atrás</Text>
          </View>
        </TouchableOpacity>

        {isAuthor && (
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Feather name="more-horizontal" size={20} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>

      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.menu}>
              <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                <Feather name="edit-3" size={14} color="#fff" />
                <Text style={styles.menuText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                <Feather name="trash-2" size={14} color="#ff6666" />
                <Text style={[styles.menuText, { color: '#ff6666' }]}>Apagar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Text style={styles.title}>Como implementar Clean Architecture em projetos Node.js</Text>
      <Image source={{ uri: 'https://placehold.co/600x300' }} style={styles.image} />
      <Text style={styles.content}>
        Neste post vou compartilhar como estruturei meu último projeto utilizando os princípios da
        Clean Architecture. A separação clara de responsabilidades trouxe muitos benefícios. Esta
        abordagem revolucionou a forma como estruturo meus projetos backend.
      </Text>

      <TouchableOpacity onPress={handlePostUpvote} activeOpacity={0.8}>
        <View style={[styles.upvoteContainer, postUpvoted && styles.upvoteActive]}>
          <Feather name="arrow-up" size={16} color={postUpvoted ? '#003d2b' : '#fff'} />
          <Text style={[styles.upvoteText, postUpvoted && styles.upvoteTextActive]}>
            {postUpvotes}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.divider} />
      <View style={styles.commentsSection}>
        <Text style={styles.commentTitle}>Comentários ({comments.length})</Text>

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
          <CommentItem key={comment.id} comment={comment} depth={0} onReply={handleReply} />
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
  title: { color: '#fff', fontWeight: '700', fontSize: 17, marginTop: 14, marginBottom: 10 },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#1b1b1f',
    marginBottom: 12,
  },
  content: { color: '#ccc', fontSize: 14, lineHeight: 22 },
  upvoteContainer: {
    marginTop: 16,
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
  modalOverlay: { flex: 1, backgroundColor: 'transparent' },
  menu: {
    position: 'absolute',
    right: 20,
    top: 80,
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
});
