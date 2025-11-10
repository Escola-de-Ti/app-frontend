import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';

type CommentModel = {
  id: string;
  user: string;
  content: string;
  upvotes: number;
  replies?: CommentModel[];
};

type CommentProps = {
  comment: CommentModel;
  depth: number;
  onReply: (parentId: string, replyText: string) => void;
  onUpvote?: (commentId: string, willUpvote: boolean) => Promise<void> | void;
};

export function CommentItem({ comment, depth, onReply, onUpvote }: CommentProps) {
  const [upvoted, setUpvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(comment.upvotes);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleUpvote = async () => {
    const willUpvote = !upvoted;
    setUpvoted(willUpvote);
    setUpvotes((prev) => (willUpvote ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await onUpvote?.(comment.id, willUpvote);
    } catch {
      setUpvoted(!willUpvote);
      setUpvotes((prev) => (!willUpvote ? prev + 1 : Math.max(0, prev - 1)));
      Alert.alert('Erro', 'Não foi possível registrar seu voto neste comentário.');
    }
  };

  const handleSendReply = () => {
    const txt = replyText.trim();
    if (!txt) return;
    onReply(comment.id, txt);
    setReplyText('');
    setShowReplyInput(false);
  };

  const borderColor = depth > 0 ? '#F08E90' : '#5b2eff';

  return (
    <View style={[styles.commentContainer, { marginLeft: depth * 20 }]}>
      <View style={styles.commentHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={styles.commentAvatar}>
            <Text style={styles.commentAvatarText}>{comment.user.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.commentUser}>{comment.user}</Text>
        </View>
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

        <TouchableOpacity onPress={() => setShowReplyInput((v) => !v)}>
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

      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          onReply={onReply}
          onUpvote={onUpvote}
        />
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
  replySendButton: { backgroundColor: '#5b2eff', padding: 6, borderRadius: 8, marginLeft: 6 },
});
