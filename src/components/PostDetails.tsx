import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Comment = {
  id: string;
  user: string;
  content: string;
  upvotes: number;
  replies?: Comment[];
};

export function PostDetails() {
  const [postUpvoted, setPostUpvoted] = useState(false);
  const [postUpvotes, setPostUpvotes] = useState(0);

  const post = {
    userName: 'Willyan Tomaz',
    userLevel: '13',
    postDate: '2d atrás',
    title: 'Como implementar Clean Architecture em projetos Node.js',
    content:
      'Neste post vou compartilhar como estruturei meu último projeto utilizando os princípios da Clean Architecture. A separação clara de responsabilidades trouxe muitos benefícios. Aqui está o conteúdo completo com mais detalhes sobre a implementação da Clean Architecture. Esta abordagem revolucionou a forma como estruturo meus projetos backend.',
    imageUri: 'https://placehold.co/600x300',
  };

  const comments: Comment[] = [
    {
      id: '1',
      user: 'Andre Jacob',
      content:
        'Excelente post! Eu também passei por uma experiência similar ao implementar Clean Architecture em um projeto grande. Uma dica que funcionou bem foi começar pela camada de domínio e ir expandindo gradualmente.',
      upvotes: 0,
      replies: [
        {
          id: '1-1',
          user: 'Willyan Tomaz',
          content:
            'Perfeito, André! É exatamente assim que comecei também. Essa abordagem ajuda a manter o foco.',
          upvotes: 0,
        },
      ],
    },
    {
      id: '2',
      user: 'Maria Souza',
      content: 'Conteúdo sensacional! Poderia compartilhar o repositório?',
      upvotes: 0,
    },
  ];

  const handlePostUpvote = () => {
    if (postUpvoted) {
      setPostUpvotes(postUpvotes - 1);
    } else {
      setPostUpvotes(postUpvotes + 1);
    }
    setPostUpvoted(!postUpvoted);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
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
        </View>

        <TouchableOpacity>
          <Feather name="more-horizontal" size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{post.title}</Text>

      {post.imageUri && <Image source={{ uri: post.imageUri }} style={styles.image} />}

      <Text style={styles.content}>{post.content}</Text>

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
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} depth={0} />
        ))}
      </View>
    </ScrollView>
  );
}

function CommentItem({ comment, depth }: { comment: Comment; depth: number }) {
  const [upvoted, setUpvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(comment.upvotes);

  const handleUpvote = () => {
    if (upvoted) {
      setUpvotes(upvotes - 1);
    } else {
      setUpvotes(upvotes + 1);
    }
    setUpvoted(!upvoted);
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
  container: {
    backgroundColor: '#0b0b0f',
    flex: 1,
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
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 50,
    backgroundColor: '#3a3a40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
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
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
    marginTop: 14,
    marginBottom: 10,
  },
  image: {
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
  upvoteContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  upvoteActive: {
    backgroundColor: '#6ef7c3',
  },
  upvoteText: {
    color: '#ccc',
    fontSize: 13,
  },
  upvoteTextActive: {
    color: '#003d2b',
    fontWeight: '600',
  },

  divider: {
    marginTop: 24,
    marginBottom: 10,
    borderBottomColor: '#3a3a40',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  commentsSection: {
    marginTop: 10,
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
