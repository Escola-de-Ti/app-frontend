import React, { useCallback, useMemo, useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppLayout from '../components/AppLayout';
import AppInput from '../components/AppInput';
import ImageUploader from '../components/ImageUploader';
import TagManager from '../components/TagManager';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateWorkshopScreen() {
  // Media & meta
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState(''); // R$ string (ex: 99.90)

  // Modality & location
  const [isOnline, setIsOnline] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [address, setAddress] = useState('');

  // Date/Time
  const [startAt, setStartAt] = useState<Date>(new Date());
  const [endAt, setEndAt] = useState<Date>(new Date(Date.now() + 2 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [loading, setLoading] = useState(false);

  const titleCount = title.trim().length;
  const descriptionCount = description.trim().length;

  const canPublish = useMemo(() => {
    const _title = title.trim();
    const _desc = description.trim();
    const _cap = Number(capacity);

    const baseOk = _title.length >= 4 && _desc.length >= 20 && !Number.isNaN(_cap) && _cap > 0;
    const locOk = isOnline ? meetingLink.trim().length >= 6 : address.trim().length >= 6;
    const timeOk = startAt.getTime() < endAt.getTime();
    const mediaOk = tags.length <= 10 && images.length <= 10;

    return baseOk && locOk && timeOk && mediaOk && !loading;
  }, [
    title,
    description,
    capacity,
    isOnline,
    meetingLink,
    address,
    startAt,
    endAt,
    tags,
    images,
    loading,
  ]);

  const getMimeFromFilename = (filename: string) => {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'heic') return 'image/heic';
    if (ext === 'webp') return 'image/webp';
    return 'application/octet-stream';
  };

  const formatDateTime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handlePublish = useCallback(async () => {
    const _title = title.trim();
    const _desc = description.trim();
    const _cap = Number(capacity);

    if (_title.length < 4) return Alert.alert('Título curto', 'Use pelo menos 4 caracteres.');
    if (_desc.length < 20)
      return Alert.alert('Descrição curta', 'Escreva pelo menos 20 caracteres.');
    if (Number.isNaN(_cap) || _cap <= 0)
      return Alert.alert('Capacidade inválida', 'Informe um número maior que zero.');
    if (!(startAt.getTime() < endAt.getTime()))
      return Alert.alert('Horário inválido', 'A data/hora de início deve ser antes do término.');
    if (tags.length > 10) return Alert.alert('Tags demais', 'Use no máximo 10 tags.');
    if (images.length > 10) return Alert.alert('Imagens demais', 'Envie no máximo 10 imagens.');
    if (isOnline && meetingLink.trim().length < 6)
      return Alert.alert('Link inválido', 'Informe um link válido para o encontro online.');
    if (!isOnline && address.trim().length < 6)
      return Alert.alert('Endereço curto', 'Informe um endereço válido.');

    try {
      setLoading(true);
      const formData = new FormData();

      images.forEach((uri, i) => {
        const filename = uri.split('/').pop() || `image-${i}.jpg`;
        const type = getMimeFromFilename(filename);
        formData.append('files', { uri, name: filename, type } as any);
      });

      formData.append('title', _title);
      formData.append('description', _desc);
      formData.append('capacity', String(_cap));
      formData.append('price', price.trim());
      formData.append('isOnline', JSON.stringify(isOnline));
      formData.append('meetingLink', meetingLink.trim());
      formData.append('address', address.trim());
      formData.append('startAt', startAt.toISOString());
      formData.append('endAt', endAt.toISOString());
      formData.append('tags', JSON.stringify(tags));

      // Exemplo de envio — não defina 'Content-Type' manualmente (o RN cuida do boundary)
      /*
      const response = await fetch('http://192.168.0.105:3000/workshops', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Erro ao criar workshop');
      const data = await response.json();
      */

      console.log('📦 Workshop pronto para envio:', {
        title: _title,
        description: _desc,
        capacity: _cap,
        price,
        isOnline,
        meetingLink,
        address,
        startAt,
        endAt,
        tags,
        images,
      });

      Alert.alert('Simulação', 'Workshop pronto para ser enviado ao servidor!');
      handleClear();
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Falha ao preparar o workshop.');
    } finally {
      setLoading(false);
    }
  }, [
    title,
    description,
    capacity,
    price,
    isOnline,
    meetingLink,
    address,
    startAt,
    endAt,
    tags,
    images,
  ]);

  const handleClear = useCallback(() => {
    setTitle('');
    setDescription('');
    setCapacity('');
    setPrice('');
    setIsOnline(false);
    setMeetingLink('');
    setAddress('');
    setImages([]);
    setTags([]);
    setStartAt(new Date());
    setEndAt(new Date(Date.now() + 2 * 60 * 60 * 1000));
  }, []);

  return (
    <AppLayout>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
      >
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.headerView}>
            <Text style={styles.title}>Criar Workshop</Text>
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
                placeholder="Endereço do local (rua, número, cidade)"
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

            {/* Capacidade e preço */}
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
                <Text style={styles.label}>Preço (R$)</Text>
                <AppInput
                  placeholder="Ex.: 99.90 (opcional)"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Imagens */}
            <View style={styles.inlineHeader}>
              <Text style={styles.label}>Imagens</Text>
              <Text style={styles.hint}>{images.length}/10</Text>
            </View>
            <ImageUploader onChange={setImages} />

            {!!images.length && (
              <View style={styles.previewGrid}>
                {images.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.preview} />
                ))}
              </View>
            )}

            {/* Tags */}
            <View style={styles.inlineHeader}>
              <Text style={styles.label}>Tags</Text>
              <Text style={styles.hint}>{tags.length}/10</Text>
            </View>
            <TagManager tags={tags} onChange={setTags} />

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancel} onPress={handleClear} disabled={loading}>
                <Text style={styles.btnText}>Limpar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={canPublish ? handlePublish : undefined}
                activeOpacity={0.9}
                disabled={!canPublish}
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
                      Publicar
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dica visual (opcional) */}
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
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  preview: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#222' },
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
