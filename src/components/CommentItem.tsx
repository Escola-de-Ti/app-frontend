import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type ID = string | number;

type UserRef = {
  id?: ID;
  nome?: string;
  name?: string;
  email?: string;
  avatarUrl?: string | null;
};

export type CommentModel = {
  id: ID;
  user?: string;
  author?: UserRef | null;
  content: string;
  upvotes: number;
  replies?: CommentModel[];
  repliesCount?: number | null;
  canLoadMore?: boolean;
  /** opcional: se você já tiver esse booleano no payload do back */
  userUpvoted?: boolean;
};

type CommentProps = {
  comment: CommentModel;
  depth?: number;
  maxDepth?: number;
  onReply: (parentId: ID, replyText: string) => void;
  onUpvote?: (commentId: ID, willUpvote: boolean) => Promise<void> | void;
  onLoadMoreReplies?: (commentId: ID) => Promise<void> | void;
  /** novo: permite o pai informar o estado inicial do voto */
  initiallyUpvoted?: boolean;
};

export function CommentItem({
  comment,
  depth = 0,
  maxDepth = 3,
  onReply,
  onUpvote,
  onLoadMoreReplies,
  initiallyUpvoted,
}: CommentProps) {
  // === AJUSTES DO UPVOTE (início) ===
  // estado inicial considera: prop inicialmenteUpvoted > comment.userUpvoted > false
  const [upvoted, setUpvoted] = useState<boolean>(
    typeof initiallyUpvoted === 'boolean' ? initiallyUpvoted : !!comment.userUpvoted
  );
  const [upvotes, setUpvotes] = useState<number>(Number(comment.upvotes) || 0);

  // sincroniza quando o pai atualizar (ex.: após resposta do back)
  useEffect(() => {
    if (typeof initiallyUpvoted === 'boolean') {
      setUpvoted(initiallyUpvoted);
    } else if (typeof comment.userUpvoted === 'boolean') {
      setUpvoted(!!comment.userUpvoted);
    }
  }, [initiallyUpvoted, comment.userUpvoted, comment.id]);

  // se o pai atualizar a contagem (ex.: correção do backend)
  useEffect(() => {
    if (typeof comment.upvotes === 'number') {
      setUpvotes(Number(comment.upvotes) || 0);
    }
  }, [comment.upvotes, comment.id]);

  const handleUpvote = async () => {
    const willUpvote = !upvoted;

    // otimista
    setUpvoted(willUpvote);
    setUpvotes((prev) => (willUpvote ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await onUpvote?.(comment.id, willUpvote);
      // OBS: se o pai corrigir via props (userUpvoted/upvotes),
      // os useEffects acima vão sincronizar automaticamente.
    } catch {
      // reverte
      setUpvoted((prev) => !prev);
      setUpvotes((prev) => (!willUpvote ? prev + 1 : Math.max(0, prev - 1)));
      Alert.alert('Erro', 'Não foi possível registrar seu voto neste comentário.');
    }
  };
  // === AJUSTES DO UPVOTE (fim) ===

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const displayUser = useMemo(() => {
    return comment.user || comment.author?.name || comment.author?.nome || 'Usuário';
  }, [comment.user, comment.author?.name, comment.author?.nome]);

  const canNest = depth < (maxDepth ?? 3);
  const replies = Array.isArray(comment.replies) ? comment.replies : [];
  const knownCount = typeof comment.repliesCount === 'number' ? comment.repliesCount : undefined;

  const showSeeMore =
    canNest &&
    !loadingMore &&
    ((knownCount !== undefined && knownCount > replies.length) ||
      (!expanded && replies.length > 0) ||
      comment.canLoadMore === true);

  const handleSendReply = () => {
    const txt = replyText.trim();
    if (!txt) return;
    onReply(comment.id, txt);
    setReplyText('');
    setShowReplyInput(false);
    setExpanded(true);
  };

  const handleSeeMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      await onLoadMoreReplies?.(comment.id);
      setExpanded(true);
    } finally {
      setLoadingMore(false);
    }
  };

  const borderColor = depth > 0 ? '#F08E90' : '#5b2eff';

  return (
    <View style={[styles.commentContainer, { marginLeft: depth * 20 }]} testID="comment-item">
      <View style={styles.commentHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={styles.commentAvatar} accessibilityLabel={`Avatar de ${displayUser}`}>
            <Text style={styles.commentAvatarText}>{displayUser.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.commentUser}>{displayUser}</Text>
        </View>
      </View>

      <View style={[styles.commentBox, { borderLeftColor: borderColor }]}>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>

      <View style={styles.commentFooter}>
        <TouchableOpacity onPress={handleUpvote} activeOpacity={0.8} accessibilityRole="button">
          <View style={[styles.commentUpvoteContainer, upvoted && styles.commentUpvoteActive]}>
            <Feather name="arrow-up" size={13} color={upvoted ? '#003d2b' : '#fff'} />
            <Text style={[styles.commentStatText, upvoted && styles.commentUpvoteTextActive]}>
              {upvotes}
            </Text>
          </View>
        </TouchableOpacity>

        {canNest && (
          <TouchableOpacity
            onPress={() => setShowReplyInput((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Responder"
          >
            <Text style={styles.replyText}>Responder</Text>
          </TouchableOpacity>
        )}

        {showSeeMore && (
          <TouchableOpacity
            onPress={handleSeeMore}
            accessibilityRole="button"
            disabled={loadingMore}
          >
            <Text style={styles.seeMoreText}>{loadingMore ? 'Carregando…' : 'Ver mais'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {canNest && showReplyInput && (
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Escreva uma resposta..."
            placeholderTextColor="#888"
            value={replyText}
            onChangeText={setReplyText}
            multiline
            testID="reply-input"
          />
          <TouchableOpacity
            style={styles.replySendButton}
            onPress={handleSendReply}
            accessibilityRole="button"
          >
            <Feather name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {canNest && expanded && replies.length > 0 && (
        <View>
          {replies.map((reply) => (
            <CommentItem
              key={String(reply.id)}
              comment={reply}
              depth={depth + 1}
              maxDepth={maxDepth}
              onReply={onReply}
              onUpvote={onUpvote}
              onLoadMoreReplies={onLoadMoreReplies}
              // passa o estado inicial do filho (se vier do back)
              initiallyUpvoted={reply.userUpvoted}
            />
          ))}
        </View>
      )}
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
  seeMoreText: { color: '#b3b3ff', fontSize: 12, fontWeight: '600' },
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
