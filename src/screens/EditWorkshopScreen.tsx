// === src/screens/EditWorkshopScreen.tsx ===
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  Switch,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

import AppLayout from '../components/AppLayout';
import AppInput from '../components/AppInput';
import ImageUploader from '../components/ImageUploader';

import type { Workshop } from '../types';
import { toIsoWithMillis } from '../types';
import { getWorkshopById, updateWorkshop, uploadWorkshopImages } from '../services/workshops';
import { updatePostImage } from '../services/posts'; // 🔁 usado para atualizar qualquer imagem via /api/imagem/update/{id}

const MAX_IMAGES = 10;

type RouteParams = { id?: number };

type EditableImage = {
  id: number;
  url: string; // URL remota atual
  localUri?: string; // nova imagem escolhida (local) para substituir
};

export default function EditWorkshopScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id } = (route?.params || {}) as RouteParams;

  const [loading, setLoading] = useState(false);

  // Dados principais
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Modalidade
  const [isOnline, setIsOnline] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [address, setAddress] = useState('');

  // Capacidade / Tokens (UI)
  const [capacity, setCapacity] = useState('');
  const [tokens, setTokens] = useState('');

  // Datas
  const [startAt, setStartAt] = useState<Date>(new Date());
  const [endAt, setEndAt] = useState<Date>(new Date(Date.now() + 2 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Imagens
  const [editableImages, setEditableImages] = useState<EditableImage[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);

  const titleCount = title.trim().length;
  const descriptionCount = description.trim().length;

  const totalImagesCount = editableImages.length + newImages.length;

  const formatDateTime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  // ===== carregar workshop pelo id =====
  useEffect(() => {
    if (!id) {
      Alert.alert('Erro', 'Workshop não informado.');
      navigation.goBack();
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const w: Workshop = await getWorkshopById(id);

        setTitle(w.titulo ?? '');
        const desc = (w as any)?.descricao?.descricao ?? (w as any)?.descricao ?? '';
        setDescription(desc);

        setStartAt(w.dataInicio ?? new Date());
        setEndAt((w as any)?.dataTermino ?? new Date(Date.now() + 2 * 60 * 60 * 1000));

        const link = (w as any)?.linkMeet ?? '';
        setIsOnline(!!link);
        setMeetingLink(link);
        setAddress((w as any)?.endereco ?? (w as any)?.local ?? '');

        if ((w as any)?.vagasTotais != null) setCapacity(String((w as any).vagasTotais));
        if ((w as any)?.tokens != null) setTokens(String((w as any).tokens));

        // 🔗 imagens existentes do workshop
        const rawImages = (w as any)?.urlsImagens ?? (w as any)?.imagens ?? [];

        if (Array.isArray(rawImages)) {
          const mapped: EditableImage[] = rawImages
            .map((img: any) => {
              const url = String(img?.urlImagem ?? img?.url ?? '').trim();
              const rawId = Number(img?.id ?? img?.imagemId);
              if (!url || !Number.isFinite(rawId)) return null;
              return { id: rawId, url };
            })
            .filter(Boolean) as EditableImage[];

          setEditableImages(mapped);
        } else {
          setEditableImages([]);
        }
      } catch (e: any) {
        console.log('[EditWorkshop] load error', e?.message);
        Toast.show({
          type: 'error',
          text1: 'Erro ao carregar workshop',
          text2: e?.message ?? '',
        });
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigation]);

  // ===== validação básica (pra UX do botão) =====
  const canSave = useMemo(() => {
    const _title = title.trim();
    const _desc = description.trim();
    const baseOk = _title.length >= 4 && _desc.length >= 20;
    const linkOk = isOnline ? meetingLink.trim().length >= 6 : true;
    const timeOk = startAt.getTime() < endAt.getTime();
    const imagesOk = totalImagesCount <= MAX_IMAGES;
    return baseOk && linkOk && timeOk && imagesOk && !loading;
  }, [title, description, isOnline, meetingLink, startAt, endAt, totalImagesCount, loading]);

  // ===== troca de imagem existente =====
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
      console.log('[EditWorkshop] erro ao escolher imagem', err);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  // ===== imagens novas (limite) =====
  const handleNewImagesChange = (uris: string[]) => {
    const total = editableImages.length + uris.length;
    if (total > MAX_IMAGES) {
      Alert.alert(
        'Limite de imagens',
        `Você pode ter no máximo ${MAX_IMAGES} imagens somando as atuais e as novas.`
      );
      const allowed = Math.max(0, MAX_IMAGES - editableImages.length);
      setNewImages(uris.slice(0, allowed));
    } else {
      setNewImages(uris);
    }
  };

  // ===== salvar =====
  const handleSave = useCallback(async () => {
    if (!id) {
      Alert.alert('Erro', 'Workshop não informado.');
      return;
    }

    const _title = title.trim();
    const _desc = description.trim();

    // validações explícitas
    if (_title.length < 4) {
      Toast.show({ type: 'error', text1: 'Título curto', text2: 'Use pelo menos 4 caracteres.' });
      Alert.alert('Título curto', 'Use pelo menos 4 caracteres.');
      return;
    }
    if (_desc.length < 20) {
      Toast.show({ type: 'error', text1: 'Descrição curta', text2: 'Mínimo de 20 caracteres.' });
      Alert.alert('Descrição curta', 'Escreva pelo menos 20 caracteres.');
      return;
    }
    if (!(startAt.getTime() < endAt.getTime())) {
      Toast.show({ type: 'error', text1: 'Horário inválido', text2: 'Início antes do término.' });
      Alert.alert('Horário inválido', 'A data/hora de início deve ser antes do término.');
      return;
    }
    if (totalImagesCount > MAX_IMAGES) {
      Toast.show({
        type: 'error',
        text1: 'Imagens demais',
        text2: `Máx. ${MAX_IMAGES} imagens por workshop.`,
      });
      Alert.alert('Imagens demais', `Você pode ter no máximo ${MAX_IMAGES} imagens.`);
      return;
    }
    if (isOnline && meetingLink.trim().length < 6) {
      Toast.show({ type: 'error', text1: 'Link inválido', text2: 'Informe um link válido.' });
      Alert.alert('Link inválido', 'Informe um link válido para o encontro online.');
      return;
    }

    try {
      setLoading(true);
      Toast.show({ type: 'info', text1: 'Salvando...', text2: 'Atualizando workshop' });

      const tema = _title;
      const payload = {
        titulo: _title,
        linkMeet: isOnline ? meetingLink.trim() : undefined,
        dataInicio: toIsoWithMillis(startAt),
        dataTermino: toIsoWithMillis(endAt),
        descricao: { tema, descricao: _desc },
        // capacidade / tokens ainda não enviados pro back aqui — só UI
      };

      console.log('[EditWorkshop] UPDATE payload', { id, payload });
      await updateWorkshop(id, payload);

      // 🔁 atualizar imagens EXISTENTES que foram trocadas
      const imagesToUpdate = editableImages.filter((img) => img.localUri);
      if (imagesToUpdate.length > 0) {
        for (const img of imagesToUpdate) {
          try {
            console.log('[EditWorkshop] update image', img.id, img.localUri);
            await updatePostImage(img.id, img.localUri!);
          } catch (imgErr: any) {
            console.log('[EditWorkshop] ERRO updatePostImage', {
              id: img.id,
              message: imgErr?.message,
            });
            Alert.alert(
              'Aviso',
              'O workshop foi atualizado, mas ocorreu um erro ao atualizar uma das imagens.'
            );
          }
        }
      }

      // 📎 anexar novas imagens
      if (newImages.length > 0) {
        try {
          console.log('[EditWorkshop] upload novas imagens', id, newImages);
          await uploadWorkshopImages(id, newImages);
        } catch (imgErr: any) {
          console.log('[EditWorkshop] ERRO uploadWorkshopImages', imgErr?.message);
          Alert.alert(
            'Aviso',
            'O workshop foi atualizado, mas ocorreu um erro ao enviar novas imagens.'
          );
        }
      }

      Toast.show({ type: 'success', text1: 'Workshop atualizado!' });
      navigation.goBack();
    } catch (err: any) {
      console.log(
        '❌ [EditWorkshop] save failed',
        err?.response?.status,
        err?.response?.data || err?.message
      );
      Toast.show({
        type: 'error',
        text1: `Erro ${err?.response?.status ?? ''}`.trim(),
        text2: err?.response?.data?.message || err?.message || 'Erro ao salvar',
      });
      Alert.alert(
        `Erro ${err?.response?.status ?? ''}`.trim(),
        err?.response?.data?.message || err?.message || 'Erro ao salvar'
      );
    } finally {
      setLoading(false);
    }
  }, [
    id,
    title,
    description,
    isOnline,
    meetingLink,
    startAt,
    endAt,
    totalImagesCount,
    editableImages,
    newImages,
    navigation,
  ]);

  const handleResetNewImages = () => {
    setNewImages([]);
  };

  return (
    <AppLayout initialActivePage="Workshops" backgroundColor="rgb(17, 17, 17)">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
      >
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 48 }}
        >
          <View style={styles.headerView}>
            <Text style={styles.title}>Editar Workshop</Text>
            <Text style={styles.subtitle}>
              Ajuste as informações do seu evento e gerencie as imagens
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Informações do Workshop</Text>

            {/* Título */}
            <View style={styles.labelRow}>
              <Text style={styles.label}>Título</Text>
              <Text style={styles.counter}>{titleCount}/80</Text>
            </View>
            <AppInput
              placeholder="Ex.: Introdução a Flutter para iniciantes"
              value={title}
              onChangeText={(t: string) => setTitle(t.slice(0, 80))}
              autoCapitalize="sentences"
              returnKeyType="next"
            />

            {/* Descrição */}
            <View style={styles.labelRow}>
              <Text style={styles.label}>Descrição</Text>
              <Text style={styles.counter}>{descriptionCount}/3000</Text>
            </View>
            <AppInput
              placeholder="Conte resumidamente o que será abordado, público-alvo e pré-requisitos..."
              value={description}
              onChangeText={(t: string) => setDescription(t.slice(0, 3000))}
              multiline
              style={{ height: 160, textAlignVertical: 'top' }}
              autoCorrect
              autoCapitalize="sentences"
            />

            {/* Modalidade */}
            <View style={[styles.inlineHeader, { marginTop: 12 }]}>
              <Text style={styles.label}>Online</Text>
              <Switch value={isOnline} onValueChange={setIsOnline} />
            </View>

            {isOnline ? (
              <AppInput
                placeholder="Link da reunião (Zoom/Meet/Teams...)"
                value={meetingLink}
                onChangeText={setMeetingLink}
                autoCapitalize="none"
              />
            ) : (
              <AppInput
                placeholder="Endereço do local (apenas visual)"
                value={address}
                onChangeText={setAddress}
                autoCapitalize="sentences"
              />
            )}

            {/* Datas e horas */}
            <View style={styles.datetimeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Início</Text>
                <TouchableOpacity style={styles.dtBtn} onPress={() => setShowStartPicker(true)}>
                  <Text style={styles.dtBtnText}>{formatDateTime(startAt)}</Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <DateTimePicker
                    value={startAt}
                    mode="datetime"
                    onChange={(_, date) => {
                      setShowStartPicker(false);
                      if (date) setStartAt(date);
                    }}
                  />
                )}
              </View>

              <View style={{ width: 12 }} />

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Término</Text>
                <TouchableOpacity style={styles.dtBtn} onPress={() => setShowEndPicker(true)}>
                  <Text style={styles.dtBtnText}>{formatDateTime(endAt)}</Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker
                    value={endAt}
                    mode="datetime"
                    onChange={(_, date) => {
                      setShowEndPicker(false);
                      if (date) setEndAt(date);
                    }}
                  />
                )}
              </View>
            </View>

            {/* Capacidade / Tokens — ainda UI */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Capacidade</Text>
                <AppInput
                  placeholder="Ex.: 30"
                  value={capacity}
                  onChangeText={(v: string) => setCapacity(v.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Tokens</Text>
                <AppInput
                  placeholder="Ex.: 100"
                  value={tokens}
                  onChangeText={(v: string) => setTokens(v.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Imagens existentes */}
            {editableImages.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <View style={styles.inlineHeader}>
                  <Text style={styles.label}>Imagens atuais</Text>
                  <Text style={styles.hint}>{editableImages.length} anexadas</Text>
                </View>

                <View style={styles.imageList}>
                  {editableImages.map((img) => (
                    <View key={img.id} style={styles.imageItem}>
                      <Image
                        source={{ uri: img.localUri || img.url }}
                        style={styles.image}
                        resizeMode="cover"
                      />
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

            {/* Novas imagens */}
            <View style={[styles.inlineHeader, { marginTop: 16 }]}>
              <Text style={styles.label}>Novas imagens</Text>
              <Text style={styles.hint}>
                {totalImagesCount}/{MAX_IMAGES}
              </Text>
            </View>
            <ImageUploader onChange={handleNewImagesChange} />

            {!!newImages.length && (
              <View style={styles.previewGrid}>
                {newImages.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.preview} />
                ))}
                <TouchableOpacity style={styles.clearNewImages} onPress={handleResetNewImages}>
                  <Text style={styles.clearNewImagesText}>Limpar novas imagens</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancel}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>

              <Pressable
                onPress={handleSave}
                hitSlop={12}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Salvar workshop"
              >
                <LinearGradient
                  colors={['#00FFA3', '#7C73FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.publish, { opacity: canSave ? 1 : 0.6 }]}
                >
                  {loading ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={[styles.btnText, { color: '#000', fontWeight: '800' }]}>
                      Salvar
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* Dica */}
          <LinearGradient
            colors={['#00FFA3', '#7C73FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tipBorder}
          >
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>Dica</Text>
              <Text style={styles.tipText}>
                Use imagens que ajudem a explicar o tema do workshop, como slides, quadro ou
                demonstrações.
              </Text>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  counter: { color: '#777', fontSize: 12 },
  inlineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hint: { color: '#777', fontSize: 12 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  cancel: { backgroundColor: '#333', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  publish: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    minWidth: 120,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600' },

  row: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  datetimeRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 },
  dtBtn: {
    backgroundColor: '#222',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  dtBtnText: { color: '#ddd', fontWeight: '600' },

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

  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  preview: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#222' },
  clearNewImages: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  clearNewImagesText: { color: '#ccc', fontSize: 12 },

  tipBorder: { borderRadius: 12, padding: 1, marginBottom: 24 },
  tipCard: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 12 },
  tipTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 6 },
  tipText: { color: '#ccc', fontSize: 13 },
});
