// src/screens/CreatePostScreen.tsx
import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ImageUploader from '../components/ImageUploader';
import TagManager from '../components/TagManager';
import { Feather } from '@expo/vector-icons';
import Logo from 'components/Logo';
import AppLayout from 'components/AppLayout';

export default function CreatePostScreen() {
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  return (
    <AppLayout>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.headerView}>
          <Text style={styles.title}>Criar Post</Text>
          <Text style={styles.subtitle}>Compartilhe seu conhecimento com a comunidade</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Conteúdo do Post</Text>

          <Text style={styles.label}>Título</Text>
          <TextInput
            placeholder="Digite um título chamativo..."
            style={styles.input}
            placeholderTextColor="#777"
          />

          <Text style={styles.label}>Conteúdo</Text>
          <TextInput
            placeholder="Compartilhe seu conhecimento..."
            style={[styles.input, { height: 150 }]}
            placeholderTextColor="#777"
            multiline
          />

          <ImageUploader onChange={setImages} />
          <TagManager tags={tags} onChange={setTags} />
        </View>
        {/* Rewards */}
        <View>
          <LinearGradient
            colors={['#00FFA3', '#7C73FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rewardCardBorder}
          >
            <View style={styles.rewardCard}>
              <Text style={styles.rewardTitle}>Recompensas para o Autor</Text>
              <Text style={styles.rewardItem}>
                Respostas destaques: <Text style={styles.token}>+100 tokens</Text>
              </Text>
              <Text style={styles.rewardItem}>
                A cada 25 upvotes: <Text style={styles.token}>+100 tokens</Text>
              </Text>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={['#00FFA3', '#7C73FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rewardCardBorder}
          >
            <View style={styles.rewardCard}>
              <Text style={styles.rewardTitle}>Recompensas para respostas</Text>
              <Text style={styles.rewardItem}>
                Respostas destaques: <Text style={styles.token}>+100 tokens</Text>
              </Text>
              <Text style={styles.rewardItem}>
                Super Vote: <Text style={styles.token}>+200 tokens</Text>
              </Text>
              <Text style={styles.rewardItem}>
                A cada 5 upvotes: <Text style={styles.token}>+50 tokens</Text>
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancel}>
            <Text style={{ color: '#fff' }}>Cancelar</Text>
          </TouchableOpacity>
          <LinearGradient colors={['#0ff', '#8f00ff']} style={styles.publish}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Publicar</Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', padding: 20, paddingTop: 60 },

  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#ccc', fontSize: 14, marginBottom: 20 },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
  headerView: {
    marginTop: 50,
  },
  sectionTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginBottom: 16 },
  label: { color: '#ccc', marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: '#121212',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 50,
  },
  cancel: {
    backgroundColor: '#333',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  publish: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  rewardCardBorder: {
    borderRadius: 12,
    padding: 1,
    marginBottom: 16,
  },
  rewardCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
  },
  rewardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 6,
  },
  rewardItem: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 2,
  },
  token: {
    color: '#00FFA3',
    fontWeight: 'bold',
  },
});
