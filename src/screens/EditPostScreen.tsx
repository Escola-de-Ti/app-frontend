// src/screens/EditPostScreen.tsx
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ToastAndroid,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import AppLayout, { HEADER_OFFSET, FOOTER_OFFSET } from '../components/AppLayout';
import AppInput from '../components/AppInput';
import ImageUploader from '../components/ImageUploader';
import TagManager from '../components/TagManager';

import { useAuth } from '../hooks/useAuth';
import { updatePost, uploadPostImages, updatePostImage, deletePostImage } from '../services/posts';
import { createOrGetTagIds } from '../services/tags';

const MAX_IMAGES = 3;

type EditPostRouteParams = {
  postId: number;
  initialTitle?: string;
  initialContent?: string;
  initialImages?: { id: number; url?: string; urlImagem?: string }[];
  initialTags?: string[];
};

type EditableImage = {
  id: number;
  url: string;
  localUri?: string;
};

export default function EditPostScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params: EditPostRouteParams = route.params || {};

  const { postId, initialTitle, initialContent, initialImages, initialTags } = params;

  const [editableImages, setEditableImages] = useState<EditableImage[]>(() =>
    (initialImages || [])
      .map((img) => ({
        id: img.id,
        url: img.urlImagem ?? img.url ?? '',
      }))
      .filter((img) => img.url)
  );

  const [newImages, setNewImages] = useState<string[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);

  const [tags, setTags] = useState<string[]>(initialTags || []);

  const [title, setTitle] = useState(initialTitle || '');
  const [content, setContent] = useState(initialContent || '');
  const [submitting, setSubmitting] = useState(false);

  const { userId } = useAuth();

  const handlePickReplacement = async (imageId: number) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) return;

      const uri = result.assets?.[0]?.uri;
      if (!uri) return;

      setEditableImages((prev) =>
        prev.map((img) => (img.id === imageId ? { ...img, localUri: uri } : img))
      );
    } catch (err) {
      console.log('[EditPost] erro ao escolher imagem', err);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const handleRemoveExistingImage = (imageId: number) => {
    setEditableImages((prev) => prev.filter((img) => img.id !== imageId));
    setRemovedImageIds((prev) => (prev.includes(imageId) ? prev : [...prev, imageId]));
  };

  const handleNewImagesChange = (uris: string[]) => {
    const total = editableImages.length + uris.length;
    if (total > MAX_IMAGES) {
      Alert.alert('Limite de imagens', `Você pode ter no máximo ${MAX_IMAGES} imagens por post.`);
      const allowed = Math.max(0, MAX_IMAGES - editableImages.length);
      setNewImages(uris.slice(0, allowed));
    } else {
      setNewImages(uris);
    }
  };

  const handleSave = async () => {
    if (!postId) {
      Alert.alert('Erro', 'Não foi possível identificar o post a ser editado.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha o título antes de salvar.');
      return;
    }

    if (!userId || isNaN(Number(userId))) {
      Alert.alert('Sessão', 'Não consegui identificar seu usuário. Faça login novamente.');
      return;
    }

    const totalImagesCount = editableImages.length + newImages.length;
    if (totalImagesCount > MAX_IMAGES) {
      Alert.alert('Limite de imagens', `Você pode ter no máximo ${MAX_IMAGES} imagens por post.`);
      return;
    }

    setSubmitting(true);
    try {
      console.log('[EditPost] resolvendo tags…', tags);
      const tagIds = await createOrGetTagIds(tags);
      console.log('[EditPost] tagIds resolvidos =', tagIds);

      const payload = {
        titulo: title.trim(),
        descricao: content.trim() || undefined,
        tagIds: tagIds.length ? tagIds : undefined,
      };
      console.log('[EditPost] payload =>', payload);

      const updated = await updatePost(Number(postId), payload);
      console.log('[EditPost] post atualizado =>', updated);

      const imagesToUpdate = editableImages.filter((img) => img.localUri);
      if (imagesToUpdate.length > 0) {
        for (const img of imagesToUpdate) {
          try {
            console.log('[EditPost] atualizando imagem', img.id, img.localUri);
            await updatePostImage(img.id, img.localUri!);
          } catch (imgErr: any) {
            console.log('[EditPost] ERRO updatePostImage', {
              id: img.id,
              message: imgErr?.message,
            });
            Alert.alert(
              'Aviso',
              'O post foi atualizado, mas ocorreu um erro ao atualizar uma das imagens.'
            );
          }
        }
      }

      if (removedImageIds.length > 0) {
        for (const imgId of removedImageIds) {
          try {
            console.log('[EditPost] deletando imagem', imgId);
            await deletePostImage(imgId);
          } catch (imgErr: any) {
            console.log('[EditPost] ERRO deletePostImage', {
              id: imgId,
              message: imgErr?.message,
            });
            Alert.alert(
              'Aviso',
              'O post foi atualizado, mas ocorreu um erro ao remover uma das imagens.'
            );
          }
        }
      }

      if (newImages.length > 0) {
        try {
          console.log('[EditPost] enviando novas imagens para o post', postId, newImages);
          await uploadPostImages(Number(postId), newImages);
        } catch (imgErr) {
          console.log('[EditPost] ERRO upload novas imagens', imgErr);
          Alert.alert(
            'Aviso',
            'O post foi atualizado, mas ocorreu um erro ao enviar novas imagens.'
          );
        }
      }

      if (Platform.OS === 'android') {
        ToastAndroid.show('Post atualizado com sucesso!', ToastAndroid.SHORT);
      }

      navigation.navigate('FeedScreen', { openPostId: Number(postId) });
    } catch (err: any) {
      console.log('[EditPost] ERRO', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      const msg = err?.response?.data?.message || err?.message || 'Falha ao atualizar post.';
      Alert.alert('Erro', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout wrapWithScroll={false} initialActivePage={null} backgroundColor="rgb(17, 17, 17)">
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: FOOTER_OFFSET + 24 }}
      >
        <View style={styles.headerView}>
          <Text style={styles.title}>Editar Post</Text>
          <Text style={styles.subtitle}>Ajuste o conteúdo antes de salvar</Text>
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
            placeholder="Atualize o conteúdo do seu post..."
            value={content}
            onChangeText={setContent}
            multiline
            style={{ height: 150, textAlignVertical: 'top' }}
          />

          {/* Imagens já existentes do post, em “lista” estilo anexadas */}
          {editableImages.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.label}>Imagens do post</Text>
              <View style={styles.imageList}>
                {editableImages.map((img) => (
                  <View key={img.id} style={styles.imageItem}>
                    <Image
                      source={{ uri: img.localUri || img.url }}
                      style={styles.image}
                      resizeMode="cover"
                    />

                    {/* X pra remover imagem existente */}
                    <TouchableOpacity
                      style={styles.removeExistingButton}
                      onPress={() => handleRemoveExistingImage(img.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.removeExistingButtonText}>×</Text>
                    </TouchableOpacity>

                    {img.localUri && <Text style={styles.imageBadge}>Nova imagem pendente</Text>}

                    <TouchableOpacity
                      style={styles.imageReplaceButton}
                      onPress={() => handlePickReplacement(img.id)}
                    >
                      <Text style={styles.imageReplaceText}>Trocar imagem</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ImageUploader para NOVAS imagens que serão anexadas no update */}
          <ImageUploader
            onChange={handleNewImagesChange}
            maxImages={Math.max(0, MAX_IMAGES - editableImages.length)}
          />

          {/* TagManager com as tags já existentes como "Adicionadas" */}
          <TagManager tags={tags} onChange={setTags} />

          <TouchableOpacity onPress={handleSave} disabled={submitting} style={{ marginTop: 16 }}>
            <LinearGradient
              colors={['#00FFA3', '#7C73FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.publish}
            >
              {submitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitText}>Salvar alterações</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Cards de “recompensa” visuais */}
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
  container: {
    flex: 1,
    backgroundColor: 'rgb(17, 17, 17)',
    padding: 20,
    paddingTop: HEADER_OFFSET + 8,
  },
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

  imageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  imageItem: {
    width: '48%',
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333',
    position: 'relative',
  },
  image: { width: '100%', height: 120, borderRadius: 8 },
  imageBadge: {
    marginTop: 6,
    color: '#00FFA3',
    fontSize: 11,
    fontWeight: '600',
  },
  imageReplaceButton: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
    alignItems: 'center',
  },
  imageReplaceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },

  removeExistingButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  removeExistingButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
  },
});
