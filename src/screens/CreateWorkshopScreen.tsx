// === src/screens/CreateWorkshopScreen.tsx ===
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
  Pressable,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppLayout, { HEADER_OFFSET, FOOTER_OFFSET } from '../components/AppLayout';
import AppInput from '../components/AppInput';
import ImageUploader from '../components/ImageUploader';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';

import type { Workshop } from '../types';
import { toUtcNoMillis, toIsoWithMillis } from '../types';
import {
  getWorkshopById,
  createWorkshop,
  updateWorkshop,
  uploadWorkshopImages,
} from '../services/workshops';

import { useAuth } from '../hooks/useAuth';
import { getAccessToken } from '../lib/secure';
import { getUserIdFromJwt, getEmailFromJwt } from '../lib/jwt';
import { getUsuarioIdByEmail } from '../services/user';

const MAX_IMAGES = 10;

const IS_WEB = Platform.OS === ('web' as any);

type RouteParams = { id?: number };

export default function CreateWorkshopScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id } = (route?.params || {}) as RouteParams;
  const isEdit = useMemo(() => typeof id === 'number', [id]);

  // animação de scroll pro AppLayout (header/footer colapsáveis)
  const layoutScrollY = useRef(new Animated.Value(0)).current;

  // Media & meta
  const [images, setImages] = useState<string[]>([]);

  // Campos principais
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Link (apenas link, sem "online/presencial")
  const [meetingLink, setMeetingLink] = useState('');

  // Capacidade / Tokens
  const [capacity, setCapacity] = useState('');
  const [tokens, setTokens] = useState('');

  // Datas
  const [startAt, setStartAt] = useState<Date>(new Date());
  const [endAt, setEndAt] = useState<Date>(new Date(Date.now() + 2 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // textos das datas (pra web)
  const [startAtText, setStartAtText] = useState('');
  const [endAtText, setEndAtText] = useState('');

  const [loading, setLoading] = useState(false);

  const titleCount = title.trim().length;
  const descriptionCount = description.trim().length;

  const { userId } = useAuth(); // pode vir vazio dependendo do fluxo

  const formatDateTime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  // parser pra "dd/mm/aaaa hh:mm"
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

  // mantem os textos sincronizados com as datas
  useEffect(() => {
    setStartAtText(formatDateTime(startAt));
    setEndAtText(formatDateTime(endAt));
  }, [startAt, endAt]);

  // carregar dados no modo edição
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoading(true);
        const w: Workshop = await getWorkshopById(id!);
        setTitle(w.titulo ?? '');
        const desc = (w as any)?.descricao?.descricao ?? (w as any)?.descricao ?? '';
        setDescription(desc);

        const start = w.dataInicio ?? new Date();
        const end = (w as any).dataTermino ?? new Date(Date.now() + 2 * 60 * 60 * 1000);
        setStartAt(start);
        setEndAt(end);

        setCapacity(String((w as any)?.capacidade ?? (w as any)?.vagasTotais ?? ''));
        setTokens(String((w as any)?.custo ?? (w as any)?.tokens ?? ''));

        const link = (w as any).linkMeet ?? '';
        setMeetingLink(link);

        if ((w as any)?.vagasTotais != null) setCapacity(String((w as any).vagasTotais));
        if ((w as any)?.tokens != null) setTokens(String((w as any).tokens));
      } catch (e: any) {
        Toast.show({ type: 'error', text1: 'Falha ao carregar', text2: e?.message ?? '' });
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, id, navigation]);

  // validação (somente UX/visual)
  const canPublish = useMemo(() => {
    const _title = title.trim();
    const _desc = description.trim();
    const baseOk = _title.length >= 4 && _desc.length >= 20;
    const timeOk = startAt.getTime() < endAt.getTime();
    const imagesOk = images.length <= MAX_IMAGES;
    return baseOk && timeOk && imagesOk && !loading;
  }, [title, description, startAt, endAt, images, loading]);

  // 🔑 Resolve instrutorId na ordem: useAuth → token(userId) → token(email)→ API
  const resolveInstructorId = async (): Promise<number | null> => {
    if (userId && Number.isFinite(Number(userId))) return Number(userId);

    const at = await getAccessToken().catch(() => null);
    if (at) {
      const idFromJwt = getUserIdFromJwt(at);
      if (idFromJwt && Number.isFinite(Number(idFromJwt))) return Number(idFromJwt);

      const email = getEmailFromJwt(at);
      if (email) {
        try {
          const idByEmail = await getUsuarioIdByEmail(email);
          if (idByEmail && Number.isFinite(Number(idByEmail))) return Number(idByEmail);
        } catch {
          // silencioso
        }
      }
    }
    return null;
  };

  const handlePublish = useCallback(async () => {
    Toast.show({ type: 'info', text1: 'Publicar', text2: 'Disparando validação...' });

    const _title = title.trim();
    const _desc = description.trim();
    const _link = meetingLink.trim();

    // validações
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
    if (images.length > MAX_IMAGES) {
      Toast.show({
        type: 'error',
        text1: 'Imagens demais',
        text2: `Máx. ${MAX_IMAGES} imagens.`,
      });
      Alert.alert('Imagens demais', `Envie no máximo ${MAX_IMAGES} imagens.`);
      return;
    }
    if (_link && _link.length < 6) {
      Toast.show({ type: 'error', text1: 'Link inválido', text2: 'Informe um link válido.' });
      Alert.alert('Link inválido', 'Informe um link válido.');
      return;
    }

    try {
      setLoading(true);
      const tema = _title;
      Toast.show({ type: 'info', text1: isEdit ? 'Salvando...' : 'Publicando...' });

      if (isEdit) {
        const payload = {
          titulo: _title,
          linkMeet: _link || undefined,
          dataInicio: toIsoWithMillis(startAt),
          dataTermino: toIsoWithMillis(endAt),
          descricao: { tema, descricao: _desc },
          capacidade: Number(capacity),
          custo: Number(tokens),
        };

        console.log('[Workshop][UPDATE][REQ]', { id, payload });
        const updated = await updateWorkshop(id!, payload);
        console.log('[Workshop][UPDATE][OK]', updated);

        if (images.length > 0) {
          try {
            console.log('[CreateWorkshop] enviando imagens (edit) para o workshop', id, images);
            await uploadWorkshopImages(Number(id), images);
          } catch (imgErr: any) {
            console.log('[CreateWorkshop] ERRO upload imagens (edit)', imgErr?.message);
            Toast.show({
              type: 'error',
              text1: 'Imagens',
              text2: 'Workshop salvo, mas houve erro ao enviar as imagens.',
            });
            Alert.alert(
              'Aviso',
              'O workshop foi atualizado, mas ocorreu um erro ao enviar as imagens. Você pode tentar novamente.'
            );
          }
        }

        Toast.show({ type: 'success', text1: 'Workshop atualizado!' });
      } else {
        const instrutorId = await resolveInstructorId();
        if (!instrutorId) {
          Alert.alert(
            'Sessão',
            'Não consegui identificar seu usuário (instrutor). Faça login novamente.'
          );
          Toast.show({ type: 'error', text1: 'Sessão', text2: 'Instrutor não identificado.' });
          return;
        }

        const basePayload: any = {
          titulo: _title,
          linkMeet: _link || undefined,
          dataInicio: toUtcNoMillis(startAt),
          dataTermino: toUtcNoMillis(endAt),
          descricao: { tema, descricao: _desc },
          instrutorId,
          capacidade: Number(capacity),
          custo: Number(tokens),
        };

        console.log('[Workshop][CREATE][REQ]', basePayload);
        const created = await createWorkshop(basePayload);
        console.log('[Workshop][CREATE][OK]', created);

        if (images.length > 0) {
          try {
            console.log(
              '[CreateWorkshop] enviando imagens (create) para o workshop',
              created?.id,
              images
            );
            await uploadWorkshopImages(Number(created.id), images);
          } catch (imgErr: any) {
            console.log('[CreateWorkshop] ERRO upload imagens (create)', imgErr?.message);
            Toast.show({
              type: 'error',
              text1: 'Imagens',
              text2: 'Workshop criado, mas houve erro ao enviar as imagens.',
            });
            Alert.alert(
              'Aviso',
              'O workshop foi criado, mas ocorreu um erro ao enviar as imagens. Você pode tentar novamente.'
            );
          }
        }

        Toast.show({ type: 'success', text1: 'Workshop criado!' });
      }

      navigation.goBack();
    } catch (err: any) {
      console.log('❌ save failed', err?.response?.status, err?.response?.data || err?.message);
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
    isEdit,
    id,
    title,
    description,
    meetingLink,
    startAt,
    endAt,
    navigation,
    images,
    tokens,
    capacity,
  ]);

  const handleClear = useCallback(() => {
    setTitle('');
    setDescription('');
    setMeetingLink('');
    setImages([]);
    setCapacity('');
    setTokens('');
    setStartAt(new Date());
    setEndAt(new Date(Date.now() + 2 * 60 * 60 * 1000));
  }, []);

  return (
    <AppLayout
      wrapWithScroll={false}
      initialActivePage="Workshops"
      backgroundColor="rgb(17, 17, 17)"
      externalScrollY={layoutScrollY}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
      >
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: HEADER_OFFSET + 20,
            paddingBottom: FOOTER_OFFSET + 48,
          }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: layoutScrollY } } }], {
            useNativeDriver: false,
          })}
          scrollEventThrottle={16}
        >
          <View style={styles.headerView}>
            <Text style={styles.title}>{isEdit ? 'Editar Workshop' : 'Criar Workshop'}</Text>
            <Text style={styles.subtitle}>
              Divulgue seu evento e compartilhe conhecimento ao vivo
            </Text>
          </View>

          {/* Card principal */}
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

            {/* Link (apenas um input, sem toggle de modalidade) */}
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
                  <>
                    <TouchableOpacity style={styles.dtBtn} onPress={() => setShowStartPicker(true)}>
                      <Text style={styles.dtBtnText}>{formatDateTime(startAt)}</Text>
                    </TouchableOpacity>
                    {showStartPicker && !IS_WEB && (
                      <DateTimePicker
                        value={startAt}
                        mode="datetime"
                        onChange={(_, date) => {
                          setShowStartPicker(false);
                          if (date) setStartAt(date);
                        }}
                      />
                    )}
                  </>
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
                  <>
                    <TouchableOpacity style={styles.dtBtn} onPress={() => setShowEndPicker(true)}>
                      <Text style={styles.dtBtnText}>{formatDateTime(endAt)}</Text>
                    </TouchableOpacity>
                    {showEndPicker && !IS_WEB && (
                      <DateTimePicker
                        value={endAt}
                        mode="datetime"
                        onChange={(_, date) => {
                          setShowEndPicker(false);
                          if (date) setEndAt(date);
                        }}
                      />
                    )}
                  </>
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

            {/* Imagens */}
            <View style={styles.inlineHeader}>
              <Text style={styles.label}>Imagens</Text>
              <Text style={styles.hint}>
                {images.length}/{MAX_IMAGES}
              </Text>
            </View>
            <ImageUploader
              onChange={setImages}
              maxImages={MAX_IMAGES}
              label={`Imagens (máx. ${MAX_IMAGES})`}
            />

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancel} onPress={handleClear} disabled={loading}>
                <Text style={styles.btnText}>Limpar</Text>
              </TouchableOpacity>

              <Pressable
                onPress={handlePublish}
                hitSlop={12}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel={isEdit ? 'Salvar workshop' : 'Publicar workshop'}
              >
                <LinearGradient
                  colors={['#00FFA3', '#7C73FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.publish, { opacity: canPublish ? 1 : 0.6 }]}
                >
                  {loading ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={[styles.btnText, { color: '#000', fontWeight: '800' }]}>
                      {isEdit ? 'Salvar' : 'Publicar'}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* Dicas */}
          <LinearGradient
            colors={['#00FFA3', '#7C73FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tipBorder}
          >
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>Dicas</Text>
              <Text style={styles.tipText}>
                Explique objetivos, público e materiais necessários. Se for online, envie o link com
                antecedência.
              </Text>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(17, 17, 17)',
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
  headerView: { marginTop: 0, marginBottom: 16 },
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
  tipBorder: { borderRadius: 12, padding: 1, marginBottom: 24 },
  tipCard: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 12 },
  tipTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 6 },
  tipText: { color: '#ccc', fontSize: 13 },
});
