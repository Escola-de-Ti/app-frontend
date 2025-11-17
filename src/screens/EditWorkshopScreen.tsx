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
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import AppLayout, { HEADER_OFFSET, FOOTER_OFFSET } from '../components/AppLayout';
import AppInput from '../components/AppInput';
import ImageUploader from '../components/ImageUploader';

import type { Workshop } from '../types';
import { toIsoWithMillis } from '../types';
import {
  getWorkshopById,
  updateWorkshop,
  uploadWorkshopImages,
  updateWorkshopImage,
  deleteWorkshopImage,
} from '../services/workshops';

const MAX_IMAGES = 10;

const IS_WEB = Platform.OS === ('web' as any);

type RouteParams = { id?: number };

type EditableImage = {
  id: number;
  url: string;
  localUri?: string;
};

export default function EditWorkshopScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id } = (route?.params || {}) as RouteParams;

  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [meetingLink, setMeetingLink] = useState('');

  const [capacity, setCapacity] = useState('');
  const [tokens, setTokens] = useState('');

  const [startAt, setStartAt] = useState<Date>(new Date());
  const [endAt, setEndAt] = useState<Date>(new Date(Date.now() + 2 * 60 * 60 * 1000));

  const [startAtText, setStartAtText] = useState('');
  const [endAtText, setEndAtText] = useState('');

  const [editableImages, setEditableImages] = useState<EditableImage[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);

  // modal do picker de data/hora (mobile)
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);

  const titleCount = title.trim().length;
  const descriptionCount = description.trim().length;

  const totalImagesCount = editableImages.length + newImages.length;

  const formatDateTime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const parseDateTime = (value: string): Date | null => {
    const text = value.trim();
    const m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
    if (!m) return null;

    const [, dd, mm, yyyy, hh, min] = m;
    const day = Number(dd);
    const month = Number(mm) - 1;
    const year = Number(yyyy);
    const hour = Number(hh);
    const minute = Number(min);

    const d = new Date(year, month, day, hour, minute);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  };

  useEffect(() => {
    const formattedStart = formatDateTime(startAt);
    const formattedEnd = formatDateTime(endAt);
    setStartAtText(formattedStart);
    setEndAtText(formattedEnd);
  }, [startAt, endAt]);

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
        const anyW: any = w;

        setTitle(w.titulo ?? '');
        const desc = anyW?.descricao?.descricao ?? anyW?.descricao ?? '';
        setDescription(desc);

        const start = w.dataInicio ?? new Date();
        const end = anyW?.dataTermino ?? new Date(Date.now() + 2 * 60 * 60 * 1000);
        setStartAt(start);
        setEndAt(end);

        const link = anyW?.linkMeet ?? '';
        setMeetingLink(link);

        if (anyW?.capacidade != null) {
          setCapacity(String(anyW.capacidade));
        } else if (anyW?.vagasTotais != null) {
          setCapacity(String(anyW.vagasTotais));
        }

        if (anyW?.custo != null) {
          setTokens(String(anyW.custo));
        } else if (anyW?.tokens != null) {
          setTokens(String(anyW.tokens));
        }

        const rawArray = anyW?.urlsImagens ?? anyW?.imagens;
        const descObj = anyW?.descricao;

        let mapped: EditableImage[] = [];

        if (Array.isArray(rawArray) && rawArray.length > 0) {
          mapped = rawArray
            .map((img: any) => {
              const url = String(img?.urlImagem ?? img?.url ?? '').trim();
              const rawId = Number(img?.id ?? img?.imagemId);
              if (!url || !Number.isFinite(rawId)) return null;
              return { id: rawId, url };
            })
            .filter(Boolean) as EditableImage[];
        } else if (descObj?.urlImagem && descObj?.idImagem != null) {
          mapped = [
            {
              id: Number(descObj.idImagem),
              url: String(descObj.urlImagem),
            },
          ];
        }

        setEditableImages(mapped);
        setRemovedImageIds([]);
        setNewImages([]);
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
    const _link = meetingLink.trim();

    const baseOk = _title.length >= 4 && _desc.length >= 20;
    const timeOk = startAt.getTime() < endAt.getTime();
    const imagesOk = totalImagesCount <= MAX_IMAGES;
    const linkOk = !_link || _link.length >= 6;

    return baseOk && linkOk && timeOk && imagesOk && !loading;
  }, [title, description, meetingLink, startAt, endAt, totalImagesCount, loading]);

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

  const handleRemoveExistingImage = (imageId: number) => {
    setEditableImages((prev) => prev.filter((img) => img.id !== imageId));
    setRemovedImageIds((prev) => (prev.includes(imageId) ? prev : [...prev, imageId]));
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
    const _link = meetingLink.trim();

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
    if (_link && _link.length < 6) {
      Toast.show({ type: 'error', text1: 'Link inválido', text2: 'Informe um link válido.' });
      Alert.alert('Link inválido', 'Informe um link válido.');
      return;
    }

    try {
      setLoading(true);
      Toast.show({ type: 'info', text1: 'Salvando...', text2: 'Atualizando workshop' });

      const tema = _title;
      const payload: any = {
        titulo: _title,
        linkMeet: _link || undefined,
        dataInicio: toIsoWithMillis(startAt),
        dataTermino: toIsoWithMillis(endAt),
        descricao: { tema, descricao: _desc },
        capacidade: Number(capacity || 0),
        custo: Number(tokens || 0),
      };

      console.log('[EditWorkshop] UPDATE payload', { id, payload });
      await updateWorkshop(id, payload);

      const imagesToUpdate = editableImages.filter((img) => img.localUri);
      if (imagesToUpdate.length > 0) {
        for (const img of imagesToUpdate) {
          try {
            console.log('[EditWorkshop] update image', img.id, img.localUri);
            await updateWorkshopImage(img.id, img.localUri!);
          } catch (imgErr: any) {
            console.log('[EditWorkshop] ERRO updateWorkshopImage', {
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

      if (removedImageIds.length > 0) {
        for (const imgId of removedImageIds) {
          try {
            console.log('[EditWorkshop] delete image', imgId);
            await deleteWorkshopImage(imgId);
          } catch (imgErr: any) {
            console.log('[EditWorkshop] ERRO deleteWorkshopImage', {
              id: imgId,
              message: imgErr?.message,
            });
            Alert.alert(
              'Aviso',
              'O workshop foi atualizado, mas ocorreu um erro ao remover uma das imagens.'
            );
          }
        }
      }

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
    meetingLink,
    startAt,
    endAt,
    totalImagesCount,
    editableImages,
    newImages,
    removedImageIds,
    navigation,
    capacity,
    tokens,
  ]);

  // ==== helpers do picker (mobile) ====
  const openPicker = (target: 'start' | 'end') => {
    if (IS_WEB) return;
    setPickerTarget(target);
    setPickerVisible(true);
  };

  const closePicker = () => {
    setPickerVisible(false);
    setPickerTarget(null);
  };

  const handleConfirmPicker = (date: Date) => {
    if (pickerTarget === 'start') {
      setStartAt(date);
    } else if (pickerTarget === 'end') {
      setEndAt(date);
    }
    closePicker();
  };

  return (
    <AppLayout
      wrapWithScroll={false}
      initialActivePage="Workshops"
      backgroundColor="rgb(17, 17, 17)"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: HEADER_OFFSET + 16, android: 0 })}
      >
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: FOOTER_OFFSET + 48 }}
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

            {/* Link (apenas input, sem toggle) */}
            <Text style={styles.label}>Link do encontro (opcional)</Text>
            <AppInput
              placeholder="Link da reunião (Zoom/Meet/Teams...)"
              value={meetingLink}
              onChangeText={setMeetingLink}
              autoCapitalize="none"
            />

            {/* Datas e horas */}
            <View style={styles.datetimeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Início</Text>

                {IS_WEB ? (
                  <AppInput
                    placeholder="dd/mm/aaaa hh:mm"
                    value={startAtText}
                    onChangeText={(text) => {
                      setStartAtText(text);
                      const parsed = parseDateTime(text);
                      if (parsed) setStartAt(parsed);
                    }}
                    autoCapitalize="none"
                  />
                ) : (
                  <TouchableOpacity style={styles.dtBtn} onPress={() => openPicker('start')}>
                    <Text style={styles.dtBtnText}>{formatDateTime(startAt)}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ width: 12 }} />

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Término</Text>

                {IS_WEB ? (
                  <AppInput
                    placeholder="dd/mm/aaaa hh:mm"
                    value={endAtText}
                    onChangeText={(text) => {
                      setEndAtText(text);
                      const parsed = parseDateTime(text);
                      if (parsed) setEndAt(parsed);
                    }}
                    autoCapitalize="none"
                  />
                ) : (
                  <TouchableOpacity style={styles.dtBtn} onPress={() => openPicker('end')}>
                    <Text style={styles.dtBtnText}>{formatDateTime(endAt)}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Capacidade / Tokens */}
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

            {/* Imagens já existentes do workshop */}
            {editableImages.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.label}>Imagens do workshop</Text>
                <View style={styles.imageList}>
                  {editableImages.map((img) => (
                    <View key={img.id} style={styles.imageItem}>
                      <Image
                        source={{ uri: img.localUri || img.url }}
                        style={styles.image}
                        resizeMode="cover"
                      />

                      {/* X para remover imagem existente */}
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

            {/* ImageUploader para NOVAS imagens do workshop*/}
            {editableImages.length === 0 && (
              <>
                <View style={[styles.inlineHeader, { marginTop: 16 }]}>
                  <Text style={styles.label}>Novas imagens</Text>
                  <Text style={styles.hint}>
                    {totalImagesCount}/{MAX_IMAGES}
                  </Text>
                </View>
                <ImageUploader onChange={handleNewImagesChange} maxImages={MAX_IMAGES} />
              </>
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

        {/* Modal nativo de data/hora (iOS / Android) */}
        {!IS_WEB && (
          <DateTimePickerModal
            isVisible={pickerVisible}
            mode="datetime"
            date={pickerTarget === 'end' ? endAt : startAt}
            locale="pt-BR"
            themeVariant="dark"
            textColor="#FFFFFF"
            buttonTextColorIOS="#00FFA3"
            pickerStyleIOS={{ backgroundColor: '#111111' }}
            backdropStyleIOS={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            onConfirm={handleConfirmPicker}
            onCancel={closePicker}
          />
        )}
      </KeyboardAvoidingView>
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

  tipBorder: { borderRadius: 12, padding: 1, marginBottom: 24 },
  tipCard: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 12 },
  tipTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 6 },
  tipText: { color: '#ccc', fontSize: 13 },
});
