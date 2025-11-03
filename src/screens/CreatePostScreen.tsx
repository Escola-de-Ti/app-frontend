import React, { useEffect, useMemo, useState } from 'react';
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
import ImageUploader from '../components/ImageUploader';
import TagManager from '../components/TagManager';
import AppLayout from '../components/AppLayout';
import AppInput from '../components/AppInput';

import { uploadImages } from '../services/storage';
import { createPost } from '../services/posts';
import { getAllTags } from '../services/tags';
import type { Tag } from '../types';
import { useAuth } from '../hooks/useAuth';

export default function CreatePostScreen() {
  // imagens: uris locais do ImageUploader
  const [images, setImages] = useState<string[]>([]);
  // tags: nomes vindos do TagManager
  const [tags, setTags] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { userId } = useAuth(); // precisa existir para enviar usuarioId numérico

  // catálogo de tags do backend para mapear nome -> id
  const [allTags, setAllTags] = useState<Tag[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const list = await getAllTags(); // GET /api/tags (ou /api/tags/popular, conforme teu service)
        setAllTags(list || []);
      } catch (e: any) {
        console.log('[CreatePost] Falha ao carregar tags:', e?.message);
      }
    })();
  }, []);

  // nome -> id (number)
  const tagNameToId = useMemo(() => {
    const map = new Map<string, number>();
    allTags.forEach((t) => {
      const key = (t as any).nome?.toLowerCase?.() ?? '';
      const idNum = Number((t as any).id);
      if (key && Number.isFinite(idNum)) map.set(key, idNum);
    });
    return map;
  }, [allTags]);

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha título e conteúdo antes de publicar.');
      return;
    }
    if (!userId || isNaN(Number(userId))) {
      Alert.alert('Sessão', 'Não consegui identificar seu usuário. Faça login novamente.');
      return;
    }

    setSubmitting(true);
    try {
      // 1) (opcional) upload das imagens primeiro
      // Mantemos o upload para já armazenar e ter IDs; o DTO do back de /api/posts ainda não aceita imagemIds.
      // Quando o back liberar imagemIds no PostCreateDTO, é só enviar no createPost (deixei comentado abaixo).
      let imagemIds: string[] = [];
      if (images.length) {
        const files = images.map((uri, i) => {
          const filename = uri.split('/').pop() || `image_${i}.jpg`;
          const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
          const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
          return { uri, name: filename, type };
        });

        try {
          const uploaded = await uploadImages(files); // -> Imagem[] do teu service
          imagemIds = (uploaded || []).map((img: any) => String(img.id));
        } catch (e: any) {
          console.log('[CreatePost] Upload falhou, seguindo sem imagens:', e?.message);
        }
      }

      // 2) resolver tags -> ids (se não achar alguma, ignora)
      const tagIds = tags
        .map((name) => tagNameToId.get(name.trim().toLowerCase()))
        .filter((id): id is number => Number.isFinite(id as number));

      // 3) criar post (contrato do back: { titulo, descricao, usuarioId, tagIds? })
      await createPost({
        titulo: title.trim(),
        descricao: content.trim(), // <- nome correto no back
        usuarioId: Number(userId), // <- precisa ser number
        tagIds: tagIds.length ? tagIds : undefined,
        // imagemIds: imagemIds.length ? imagemIds : undefined, // <- LIGAR quando o back aceitar no DTO
      });

      Alert.alert('Sucesso', 'Post criado com sucesso!');
      // limpa formulário
      setTitle('');
      setContent('');
      setTags([]);
      setImages([]);
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
    <AppLayout initialActivePage={null}>
      <ScrollView style={styles.container}>
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

          {/* ImageUploader devolve array de URIs (string[]) */}
          <ImageUploader onChange={setImages} />

          {/* TagManager devolve array de nomes (string[]) — mapeamos para ids antes de enviar */}
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
  container: { flex: 1, backgroundColor: 'rgb(17, 17, 17);', padding: 20, paddingTop: 20 },
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
