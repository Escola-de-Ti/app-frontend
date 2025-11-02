import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Comment = {
  id: string;
  user: string;
  content: string;
  upvotes: number;
  replies?: Comment[];
};

type PostDetailsProps = {
  userName: string;
  userLevel: string;
  postDate: string;
  title: string;
  content: string;
  imageUri?: string;
  comments: Comment[];
};

export function PostDetails({
  userName,
  userLevel,
  postDate,
  title,
  content,
  imageUri,
  comments,
}: PostDetailsProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{userName}</Text>
              <View style={styles.levelContainer}>
                <Text style={styles.levelText}>Nvl. {userLevel}</Text>
              </View>
            </View>
            <Text style={styles.postDate}>{postDate}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Feather name="more-horizontal" size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      <View style={styles.postContent}>
        <Text style={styles.title}>{title}</Text>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.postImage} />}

        <Text style={styles.content}>{content}</Text>
      </View>

      <View style={styles.commentsSection}>
        <Text style={styles.commentTitle}>Comentários ({comments.length})</Text>
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} depth={0} />
        ))}
      </View>
    </ScrollView>
  );
}

type CommentItemProps = {
  comment: Comment;
  depth: number;
};

function CommentItem({ comment, depth }: CommentItemProps) {
  return (
    <View style={[styles.commentContainer, { marginLeft: depth * 20 }]}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAvatar}>
          <Text style={styles.commentInitial}>{comment.user.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.commentUser}>{comment.user}</Text>
      </View>

      <View style={styles.commentBox}>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>

      <View style={styles.commentFooter}>
        <View style={styles.commentStat}>
          <Feather name="arrow-up" size={14} color="#21d07a" />
          <Text style={styles.commentStatText}>{comment.upvotes}</Text>
        </View>
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
  container: {
    flex: 1,
    backgroundColor: '#0b0b0f',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 50,
    backgroundColor: '#3a3a40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  levelContainer: {
    backgroundColor: '#182848',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  levelText: {
    color: '#82caff',
    fontSize: 12,
    fontWeight: '600',
  },
  postDate: {
    color: '#aaa',
    fontSize: 12,
  },
  postContent: {
    marginTop: 16,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#1b1b1f',
    marginBottom: 12,
  },
  content: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
  },
  commentsSection: {
    marginTop: 22,
  },
  commentTitle: {
    color: '#b3b3ff',
    fontWeight: '600',
    marginBottom: 10,
  },
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
  commentInitial: {
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
  commentStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentStatText: {
    color: '#ccc',
    fontSize: 12,
  },
  replyText: {
    color: '#82caff',
    fontSize: 12,
  },
});
