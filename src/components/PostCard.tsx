import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

type PostCardProps = {
  userName: string;
  userLevel: string;
  postDate: string;
  title: string;
  description: string;
  tag: string;
  upvotes: number;
  comments: number;
  profileImage?: string;
};

export function PostCard({
  userName,
  userLevel,
  postDate,
  title,
  description,
  tag,
  upvotes,
  comments,
  profileImage,
}: PostCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
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

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.tagContainer}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Feather name="arrow-up" size={16} color="#ccc" />
            <Text style={styles.statText}>{upvotes}</Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="message-circle" size={16} color="#ccc" />
            <Text style={styles.statText}>{comments}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141417',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
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
  content: {
    marginTop: 14,
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  description: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagContainer: {
    backgroundColor: '#5b2eff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    color: '#ccc',
    fontSize: 13,
  },
});
