// === src/screens/EditProfileScreen.tsx ===
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import AppLayout from '../components/AppLayout';
import AppInput from '../components/AppInput';
import ImageUploader from '../components/ImageUploader';
import Toast from 'react-native-toast-message';

import { getMyProfile, updateMyProfile, type MyProfile } from '../services/profile';

const COLOR_PRESETS = ['#b14cb3', '#2edba7', '#4562f0', '#a65bf7', '#d36d6d', '#00FFA3', '#7C73FF'];

/** Converte HEX + opacidade (0..1) -> rgba() pra mostrar na UI */
function hexToRgba(hex?: string | null, opacity?: number | null) {
  const safeHex = (hex || '#141417').replace('#', '');
  const o = typeof opacity === 'number' ? Math.min(1, Math.max(0, opacity)) : 0.2;
  const bigint = parseInt(safeHex.length === 3 ? safeHex.repeat(2) : safeHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${o})`;
}

export default function EditProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // dados do usuário
  const [profile, setProfile] = useState<MyProfile | null>(null);

  // campos editáveis
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // banner
  const [bannerHex, setBannerHex] = useState<string>('#141417');
  const [bannerOpacity, setBannerOpacity] = useState<number>(0.2);
  const bannerColorPreview = useMemo(
    () => hexToRgba(bannerHex, bannerOpacity),
    [bannerHex, bannerOpacity]
  );

  // modal de edição do banner
  const [openBannerModal, setOpenBannerModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getMyProfile();
      setProfile(me);

      setNome(me.nome ?? '');
      setSobrenome(me.sobrenome ?? '');
      setTelefone(me.telefone ?? '');
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canSave = useMemo(() => {
    return nome.trim().length >= 2 && !saving;
  }, [nome, saving]);

  const handleSave = useCallback(async () => {
    if (!canSave) {
      Alert.alert('Validação', 'Informe pelo menos o nome (mínimo 2 caracteres).');
      return;
    }
    try {
      setSaving(true);
      // se você tiver um fluxo de upload real de avatar, faça aqui e pegue a URL final
      // por enquanto, mandamos a URI local como avatarUrl (se o back ignorar, ok)
      const payload = {
        nome: nome.trim(),
        sobrenome: sobrenome.trim() || undefined,
        telefone: telefone.trim() || undefined,
        avatarUrl: avatarUri || null,
        bannerColorHex: bannerHex || null,
        bannerOpacity: Number.isFinite(bannerOpacity) ? bannerOpacity : 0.2,
      };
      const updated = await updateMyProfile(payload);
      setProfile(updated);
      Toast.show({ type: 'success', text1: 'Perfil atualizado!' });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Não foi possível salvar.';
      Toast.show({ type: 'error', text1: 'Erro ao salvar', text2: msg });
      Alert.alert('Erro', msg);
    } finally {
      setSaving(false);
    }
  }, [avatarUri, bannerHex, bannerOpacity, nome, sobrenome, telefone, canSave]);

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
        {/* BANNER */}
        <View style={[styles.banner, { backgroundColor: bannerColorPreview }]}>
          <View style={styles.bannerRow}>
            <Text style={styles.bannerTitle}>Seu banner</Text>
            <TouchableOpacity style={styles.editPill} onPress={() => setOpenBannerModal(true)}>
              <Feather name="edit-3" size={14} color="#0B0B0E" />
              <Text style={styles.editPillText}>Editar</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>Foto de perfil</Text>
            <ImageUploader
              onChange={(uris) => setAvatarUri(uris?.[0] ?? null)}
              initialUris={avatarUri ? [avatarUri] : []}
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

          <Text style={styles.label}>Sobrenome</Text>
          <AppInput
            value={sobrenome}
            onChangeText={setSobrenome}
            placeholder="Seu sobrenome"
            returnKeyType="next"
          />

          <Text style={styles.label}>Telefone</Text>
          <AppInput
            value={telefone}
            onChangeText={setTelefone}
            placeholder="(00) 00000-0000"
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'phone-pad'}
          />

          <Text style={styles.label}>E-mail</Text>
          <AppInput value={profile?.email ?? ''} editable={false} />

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

      {/* MODAL DO BANNER */}
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
            {/* Slider “manual” com 5 steps sem lib externa */}
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

  banner: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },

  editPill: {
    backgroundColor: '#00FFA3',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editPillText: { color: '#0B0B0E', fontWeight: '800', fontSize: 12 },

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
