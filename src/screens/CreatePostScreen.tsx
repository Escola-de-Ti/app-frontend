// src/screens/CreatePostScreen.tsx
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import AppLayout from '../components/AppLayout';
import AppInput from '../components/AppInput';
import ImageUploader from '../components/ImageUploader';
import TagManager from '../components/TagManager';

import { useAuth } from '../hooks/useAuth';
import { createPost, uploadPostImages } from '../services/posts';
import { createOrGetTagIds } from '../services/tags';

const MAX_IMAGES = 3;

export default function CreatePostScreen() {
  // imagens: URIs locais vindas do ImageUploader
  const [images, setImages] = useState<string[]>([]);
  // tags: nomes vindos do TagManager
  const [tags, setTags] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { userId } = useAuth(); // necessário pro campo usuarioId (number)
  const navigation = useNavigation<any>();

  // controla o limite de imagens e mostra o "toast" (Alert) de erro
  const handleImagesChange = (uris: string[]) => {
    if (uris.length > MAX_IMAGES) {
      Alert.alert(
        'Limite de imagens',
        `Você pode anexar no máximo ${MAX_IMAGES} imagens por post.`
      );
      setImages(uris.slice(0, MAX_IMAGES));
    } else {
      setImages(uris);
    }
  };

  const handlePublish = async () => {
    // garantia extra, caso algo escape
    if (images.length > MAX_IMAGES) {
      Alert.alert(
        'Limite de imagens',
        `Você pode anexar no máximo ${MAX_IMAGES} imagens por post.`
      );
      return;
    }

    // ✅ só título é obrigatório para a API
    if (!title.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha o título antes de publicar.');
      return;
    }
    if (!userId || isNaN(Number(userId))) {
      Alert.alert('Sessão', 'Não consegui identificar seu usuário. Faça login novamente.');
      return;
    }

    setSubmitting(true);
    try {
      console.log('[CreatePost] resolvendo tags…', tags);
      const tagIds = await createOrGetTagIds(tags);
      console.log('[CreatePost] tagIds resolvidos =', tagIds);

      const payload = {
        titulo: title.trim(),
        // ✅ descrição opcional
        descricao: content.trim() || undefined,
        usuarioId: Number(userId),
        tagIds: tagIds.length ? tagIds : undefined,
      };
      console.log('[CreatePost] payload =>', payload);

      const created = await createPost(payload);

      // 🔗 se tiver imagens selecionadas, tenta anexar ao post recém-criado
      if (images.length > 0) {
        try {
          console.log('[CreatePost] enviando imagens para o post', created?.id, images);
          await uploadPostImages(Number(created.id), images);
        } catch (imgErr) {
          console.log('[CreatePost] ERRO upload imagens', imgErr);
          Alert.alert(
            'Aviso',
            'O post foi criado, mas ocorreu um erro ao enviar as imagens. Você pode tentar adicionar novamente.'
          );
        }
      }

      Alert.alert('Sucesso', 'Post criado com sucesso!');

      // limpa formulário
      setTitle('');
      setContent('');
      setTags([]);
      setImages([]);

      // redireciona para o feed
      navigation.navigate('FeedScreen'); // ajuste o nome da rota se for diferente
    } catch (err: any) {
      console.log('[CreatePost] ERRO', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      const msg = err?.response?.data?.message || err?.message || 'Falha ao criar post.';
      Alert.alert('Erro', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // não queremos nenhuma aba do footer “verdinha” aqui
    <AppLayout wrapWithScroll={false} initialActivePage={null} backgroundColor="rgb(17, 17, 17)">
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerView}>
          <Text style={styles.title}>Criar Post</Text>
          <Text style={styles.subtitle}>Compartilhe seu conhecimento com a comunidade</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Conteúdo do Post</Text>

          <Text style={styles.label}>Título</Text>
          <AppInput
            placeholder="Digite um título chamativo..."
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Conteúdo</Text>
          <AppInput
            placeholder="Compartilhe seu conhecimento..."
            value={content}
            onChangeText={setContent}
            multiline
            style={{ height: 150, textAlignVertical: 'top' }}
          />

          {/* ImageUploader devolve string[] de URIs locais (sem pré-visualização duplicada) */}
          <ImageUploader onChange={handleImagesChange} maxImages={MAX_IMAGES} />

          {/* TagManager devolve string[] com os nomes das tags */}
          <TagManager tags={tags} onChange={setTags} />

          <TouchableOpacity onPress={handlePublish} disabled={submitting} style={{ marginTop: 16 }}>
            <LinearGradient
              colors={['#00FFA3', '#7C73FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.publish}
            >
              {submitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitText}>Publicar</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Cards de “recompensa” visuais (mantidos) */}
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
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgb(17, 17, 17)', padding: 20, paddingTop: 20 },
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
  headerView: { marginTop: 0 },
  sectionTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginBottom: 16 },
  label: { color: '#ccc', marginTop: 12, marginBottom: 4 },

  rewardCardBorder: { borderRadius: 12, padding: 1, marginBottom: 16 },
  rewardCard: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 12 },
  rewardTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 6 },
  rewardItem: { color: '#ccc', fontSize: 13, marginBottom: 2 },
  token: { color: '#00FFA3', fontWeight: 'bold' },

  publish: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 30 },
  submitText: { color: '#000', fontWeight: '700', fontSize: 16, textAlign: 'center' },
});
