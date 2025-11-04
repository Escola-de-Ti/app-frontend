import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Feather } from '@expo/vector-icons';

export function PostCard() {
  const [menuVisible, setMenuVisible] = useState(false);

  const post = {
    userName: 'Gabriel Marassi',
    userLevel: '14',
    postDate: '2d atrás',
    title: 'Como vocês organizam os estudos de programação?',
    description:
      'Estou tentando conciliar faculdade, projetos pessoais e cursos online. Alguém tem uma rotina que funcione bem?',
    tag: 'Dúvida',
    upvotes: 102,
    comments: 37,
  };

  const handleOutsidePress = () => {
    if (menuVisible) setMenuVisible(false);
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={styles.card}>
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

          <View>
            <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} activeOpacity={0.7}>
              <Feather name="more-horizontal" size={20} color="#aaa" />
            </TouchableOpacity>

            {menuVisible && (
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
            )}
          </View>
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
            <View style={styles.statItem}>
              <Feather name="arrow-up" size={16} color="#fff" />
              <Text style={styles.statText}>{post.upvotes}</Text>
            </View>
            <View style={styles.statItem}>
              <Feather name="message-circle" size={16} color="#fff" />
              <Text style={styles.statText}>{post.comments}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141417',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
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

  body: {
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
    borderColor: '#8a73ff',
    borderWidth: 1.8,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#141417',
  },
  tagText: {
    color: '#8a73ff',
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

  menu: {
    position: 'absolute',
    right: 0,
    top: 25,
    backgroundColor: '#1f1f23',
    borderRadius: 8,
    paddingVertical: 6,
    width: 120,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    zIndex: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  menuText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});
