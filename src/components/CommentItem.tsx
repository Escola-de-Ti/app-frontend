import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
};

export function CommentItem({ comment, depth }: CommentProps) {
  const [upvoted, setUpvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(comment.upvotes);

  const handleUpvote = () => {
    setUpvoted(!upvoted);
    setUpvotes((prev) => prev + (upvoted ? -1 : 1));
  };

  return (
    <View style={[styles.commentContainer, { marginLeft: depth * 20 }]}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>{comment.user.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.commentUser}>{comment.user}</Text>
      </View>

      <View style={styles.commentBox}>
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

        <TouchableOpacity>
          <Text style={styles.replyText}>Responder</Text>
        </TouchableOpacity>
      </View>

      {comment.replies &&
        comment.replies.map((reply) => (
          <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  commentContainer: {
    marginBottom: 14,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 50,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  commentUser: {
    color: '#fff',
    fontWeight: '600',
  },
  commentBox: {
    backgroundColor: '#1b1b1f',
    borderLeftWidth: 3,
    borderLeftColor: '#5b2eff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  commentText: {
    color: '#ccc',
    fontSize: 13,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginLeft: 34,
  },
  commentUpvoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  commentUpvoteActive: {
    backgroundColor: '#6ef7c3',
  },
  commentStatText: {
    color: '#ccc',
    fontSize: 12,
  },
  commentUpvoteTextActive: {
    color: '#003d2b',
    fontWeight: '600',
  },
  replyText: {
    color: '#82caff',
    fontSize: 12,
  },
});
