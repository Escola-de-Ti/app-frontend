import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';

type CommentProps = {
  comment: {
    id: string;
    user: string;
    content: string;
    upvotes: number;
    replies?: CommentProps['comment'][];
  };
  depth: number;
  onReply: (parentId: string, replyText: string) => void;
};

export function CommentItem({ comment, depth, onReply }: CommentProps) {
  const [upvoted, setUpvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(comment.upvotes);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleUpvote = () => {
    setUpvoted(!upvoted);
    setUpvotes((prev) => prev + (upvoted ? -1 : 1));
  };

  const handleSendReply = () => {
    if (replyText.trim() === '') return;
    onReply(comment.id, replyText);
    setReplyText('');
    setShowReplyInput(false);
  };

  const handleProfilePress = () => {
    Alert.alert('Perfil', `Abrir perfil de ${comment.user}`);
  };

  const borderColor = depth > 0 ? '#F08E90' : '#5b2eff';

  return (
    <View style={[styles.commentContainer, { marginLeft: depth * 20 }]}>
      <View style={styles.commentHeader}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          activeOpacity={0.8}
          onPress={handleProfilePress}
        >
          <View style={styles.commentAvatar}>
            <Text style={styles.commentAvatarText}>{comment.user.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.commentUser}>{comment.user}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.commentBox, { borderLeftColor: borderColor }]}>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>

      <View style={styles.commentFooter}>
        <TouchableOpacity onPress={handleUpvote} activeOpacity={0.8}>
          <View style={[styles.commentUpvoteContainer, upvoted && styles.commentUpvoteActive]}>
            <Feather name="arrow-up" size={13} color={upvoted ? '#003d2b' : '#fff'} />
            <Text style={[styles.commentStatText, upvoted && styles.commentUpvoteTextActive]}>
              {upvotes}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowReplyInput(!showReplyInput)}>
          <Text style={styles.replyText}>Responder</Text>
        </TouchableOpacity>
      </View>

      {showReplyInput && (
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Escreva uma resposta..."
            placeholderTextColor="#888"
            value={replyText}
            onChangeText={setReplyText}
            multiline
          />
          <TouchableOpacity style={styles.replySendButton} onPress={handleSendReply}>
            <Feather name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {comment.replies &&
        comment.replies.map((reply) => (
          <CommentItem key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  commentContainer: { marginBottom: 14 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 50,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  commentUser: { color: '#fff', fontWeight: '600' },
  commentBox: {
    backgroundColor: '#1b1b1f',
    borderLeftWidth: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  commentText: { color: '#ccc', fontSize: 13 },
  commentFooter: { flexDirection: 'row', alignItems: 'center', gap: 14, marginLeft: 34 },
  commentUpvoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  commentUpvoteActive: { backgroundColor: '#6ef7c3' },
  commentStatText: { color: '#ccc', fontSize: 12 },
  commentUpvoteTextActive: { color: '#003d2b', fontWeight: '600' },
  replyText: { color: '#82caff', fontSize: 12 },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1b1f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    marginTop: 8,
    marginLeft: 34,
    paddingHorizontal: 10,
  },
  replyInput: { flex: 1, color: '#fff', fontSize: 13, paddingVertical: 6 },
  replySendButton: {
    backgroundColor: '#5b2eff',
    padding: 6,
    borderRadius: 8,
    marginLeft: 6,
  },
});
