import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import AppLayout from '../components/AppLayout';
import AppInput from '../components/AppInput';
import ImageUploader from '../components/ImageUploader';
import Toast from 'react-native-toast-message';

import { getUserById, updateMyProfile } from '../services/profile';
import type { UpdateUserRequest, MyProfile } from '../types';
import { useAuth } from '../hooks/useAuth';

const COLOR_PRESETS = ['#b14cb3', '#2edba7', '#4562f0', '#a65bf7', '#d36d6d', '#00FFA3', '#7C73FF'];

/** HEX + opacidade -> rgba() (só pra UI do banner) */
function hexToRgba(hex?: string | null, opacity?: number | null) {
  const safeHex = (hex || '#141417').replace('#', '');
  const o = typeof opacity === 'number' ? Math.min(1, Math.max(0, opacity)) : 0.2;
  const bigint = parseInt(safeHex.length === 3 ? safeHex.repeat(2) : safeHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${o})`;
}
// parser local seguro
function parseUserIdLocal(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!/^\d+$/.test(s)) return null;
  const n = parseInt(s, 10);
  return n > 0 ? n : null;
}

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { userId: authUserId } = useAuth();
  const myIdNum = parseUserIdLocal(authUserId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<MyProfile | null>(null);

  // campos editáveis
  const [nome, setNome] = useState('');
  const [biografia, setBiografia] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState(''); // editável
  const [cpf, setCpf] = useState(''); // editável

  // UI only
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [bannerHex, setBannerHex] = useState<string>('#141417');
  const [bannerOpacity, setBannerOpacity] = useState<number>(0.2);
  const [openBannerModal, setOpenBannerModal] = useState(false);

  const bannerColorPreview = useMemo(
    () => hexToRgba(bannerHex, bannerOpacity),
    [bannerHex, bannerOpacity]
  );

  const load = useCallback(async () => {
    if (myIdNum === null) {
      Toast.show({ type: 'error', text1: 'Sem ID do usuário logado.' });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // preenche a tela com GET /api/usuarios/{id}
      const me = await getUserById(myIdNum);
      setProfile(me);

      setNome(me.nome ?? '');
      setBiografia(me.biografia ?? '');
      setTelefone(me.telefone ?? '');
      setEmail(me.email ?? '');
      setCpf((me.cpf as any as string) ?? ''); // se vier null/undefined, fica vazio
      setAvatarUri(me.avatarUrl ?? null);
      setBannerHex(me.bannerColorHex ?? '#141417');
      setBannerOpacity(
        typeof me.bannerOpacity === 'number' && !Number.isNaN(me.bannerOpacity)
          ? me.bannerOpacity
          : 0.2
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Falha ao carregar perfil.';
      Toast.show({ type: 'error', text1: 'Erro ao carregar', text2: msg });
    } finally {
      setLoading(false);
    }
  }, [myIdNum]);

  useEffect(() => {
    load();
  }, [load]);

  // validação simples
  const emailOk = /\S+@\S+\.\S+/.test(email.trim());
  const cpfDigits = (cpf || '').replace(/\D/g, '');
  const cpfOk = cpfDigits.length === 11;

  const canSave = useMemo(
    () => nome.trim().length >= 2 && emailOk && cpfOk && !saving,
    [nome, emailOk, cpfOk, saving]
  );

  const handleSave = useCallback(async () => {
    if (!canSave) {
      Alert.alert(
        'Validação',
        !emailOk ? 'E-mail inválido.' : !cpfOk ? 'CPF deve ter 11 dígitos.' : 'Verifique os campos.'
      );
      return;
    }
    try {
      setSaving(true);

      // Monta payload conforme teu PUT /api/usuarios/user aceita
      const payload: UpdateUserRequest = {
        email: email.trim(),
        nome: nome.trim(),
        cpf: cpfDigits || undefined,
        telefone: telefone.trim() || undefined,
        telefone2: profile?.telefone2 ?? undefined,
        biografia: biografia.trim() || undefined,
        // senha: undefined, // só enviar se for alterar
        tipoUsuario: profile?.tipoUsuario, // preserva se existir
        tags: profile?.tags ?? [],
      };

      const updated = await updateMyProfile(payload);
      setProfile(updated);
      Toast.show({ type: 'success', text1: 'Perfil atualizado!' });
      // se quiser voltar após salvar:
      // navigation.goBack();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Não foi possível salvar.';
      Toast.show({ type: 'error', text1: 'Erro ao salvar', text2: msg });
      Alert.alert('Erro', msg);
    } finally {
      setSaving(false);
    }
  }, [
    canSave,
    email,
    nome,
    cpfDigits,
    telefone,
    biografia,
    profile?.telefone2,
    profile?.tipoUsuario,
    profile?.tags,
  ]);

  if (loading) {
    return (
      <AppLayout initialActivePage={null}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#00FFA3" />
          <Text style={{ color: '#ccc', marginTop: 12 }}>Carregando perfil…</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout initialActivePage={null}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header: Voltar + Título */}
        <View style={styles.headerWrap}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="chevron-left" size={20} color="#EDEDF5" />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.pageTitle}>Editar Perfil</Text>
        </View>

        {/* BANNER (UI only) */}
        <View style={[styles.banner, { backgroundColor: bannerColorPreview }]}>
          <View style={{ marginTop: 0 }}>
            <ImageUploader
              onChange={(uris) => setAvatarUri(uris?.[0] ?? null)} // UI only
              initialUris={avatarUri ? [avatarUri] : []}
              maxImages={1}
              label="Foto de perfil"
            />
          </View>
        </View>

        {/* CARD PRINCIPAL */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>

          <Text style={styles.label}>Nome</Text>
          <AppInput
            value={nome}
            onChangeText={setNome}
            placeholder="Seu nome"
            returnKeyType="next"
          />

          <Text style={styles.label}>E-mail</Text>
          <AppInput
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={styles.label}>CPF</Text>
          <AppInput
            value={cpf}
            onChangeText={setCpf}
            placeholder="Somente números"
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
            maxLength={14}
          />

          <Text style={styles.label}>Telefone</Text>
          <AppInput
            value={telefone}
            onChangeText={setTelefone}
            placeholder="(00) 00000-0000"
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'phone-pad'}
          />

          <Text style={styles.label}>Biografia</Text>
          <AppInput
            value={biografia}
            onChangeText={setBiografia}
            placeholder="Sua biografia"
            multiline
            style={{ height: 180, textAlignVertical: 'top' }}
            returnKeyType="done"
          />

          <View style={styles.footer}>
            <TouchableOpacity
              disabled={!canSave}
              onPress={handleSave}
              activeOpacity={0.9}
              style={{ alignSelf: 'flex-end' }}
            >
              <LinearGradient
                colors={['#00FFA3', '#7C73FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.saveBtn, { opacity: canSave ? 1 : 0.6 }]}
              >
                {saving ? (
                  <ActivityIndicator color="#0B0B0E" />
                ) : (
                  <Text style={styles.saveText}>Salvar</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* MODAL DO BANNER (UI only) */}
      <Modal
        transparent
        visible={openBannerModal}
        animationType="fade"
        onRequestClose={() => setOpenBannerModal(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setOpenBannerModal(false)}
        />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Editar banner</Text>

          <Text style={[styles.label, { marginTop: 6 }]}>Cores rápidas</Text>
          <View style={styles.colorsRow}>
            {COLOR_PRESETS.map((hex) => {
              const selected = hex.toLowerCase() === bannerHex.toLowerCase();
              return (
                <TouchableOpacity
                  key={hex}
                  style={[
                    styles.colorDot,
                    { backgroundColor: hex, borderColor: selected ? '#fff' : '#333' },
                  ]}
                  onPress={() => setBannerHex(hex)}
                />
              );
            })}
          </View>

          <Text style={[styles.label, { marginTop: 14 }]}>
            Opacidade: {Math.round(bannerOpacity * 100)}%
          </Text>
          <View style={styles.opacityRow}>
            {[0, 0.25, 0.5, 0.75, 1].map((v) => {
              const active = Math.abs(bannerOpacity - v) < 0.001;
              return (
                <TouchableOpacity
                  key={String(v)}
                  style={[
                    styles.opacityStep,
                    { opacity: active ? 1 : 0.5, borderColor: active ? '#7C73FF' : '#333' },
                  ]}
                  onPress={() => setBannerOpacity(v)}
                >
                  <View
                    style={[styles.opacityChip, { backgroundColor: hexToRgba(bannerHex, v) }]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ marginTop: 16, alignItems: 'flex-end' }}>
            <TouchableOpacity onPress={() => setOpenBannerModal(false)} activeOpacity={0.9}>
              <LinearGradient colors={['#7C73FF', '#8D7CFF']} style={styles.closeBtn}>
                <Text style={styles.closeText}>Concluir</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f' },

  headerWrap: { paddingHorizontal: 16, paddingTop: 16, marginBottom: 8 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingRight: 8,
    paddingLeft: 2,
    alignSelf: 'flex-start',
  },
  backText: { color: '#EDEDF5', fontWeight: '700', fontSize: 14 },
  pageTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 8 },

  banner: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 0 },

  card: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: { color: '#fff', fontWeight: '800', fontSize: 16, marginBottom: 10 },

  label: { color: '#ccc', marginTop: 10, marginBottom: 6 },

  footer: { marginTop: 16 },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    minWidth: 120,
    alignItems: 'center',
  },
  saveText: { color: '#0B0B0E', fontWeight: '800' },

  // modal
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 120,
    backgroundColor: '#15151a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A33',
    padding: 16,
  },
  modalTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },

  colorsRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  colorDot: { width: 28, height: 28, borderRadius: 16, borderWidth: 2 },

  opacityRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  opacityStep: { flex: 1, borderWidth: 1.5, borderRadius: 8, padding: 6, alignItems: 'center' },
  opacityChip: { width: '100%', height: 10, borderRadius: 6 },

  closeBtn: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  closeText: { color: '#0B0B0E', fontWeight: '800' },
});
