// === src/screens/ProfileScreen.tsx ===
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import AppLayout, { HEADER_OFFSET, FOOTER_OFFSET } from '../components/AppLayout';
import Tag from '../components/Tag';
import type { MyProfile } from '../types';
import { getMyProfile, getUserById, getUserDetails } from '../services/profile';
import { getUserIdFromJwt } from '../lib/jwt';
import { useAuth } from '../hooks/useAuth';

const TOKENS = {
  coverPaddingTop: 18,
  coverPaddingBottom: 88,
  avatarSize: 92,
  avatarBorder: 3,
  cardRadius: 16,
  cardMarginTop: -56,
  cardBorder: '#2A2A33',
  surface: '#1A1A1A',
  surfaceAlt: '#17171C',
  txtPrimary: '#EDEDF5',
  txtSecondary: '#BDBDCC',
  txtMuted: '#A9A9B2',
  gradientA: '#00FFA3',
  gradientB: '#7C73FF',
};

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
function withOpacity(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  const a = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function normalizeHex(s: string, fallback: string) {
  const v = (s || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toUpperCase();
  return fallback;
}
const toNumOrNull = (v: unknown) => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { userId: userIdFromAuth, logout } = useAuth();

  const myIdNum = toNumOrNull(userIdFromAuth ?? getUserIdFromJwt?.());
  const viewedIdNum = toNumOrNull(route?.params?.userId);
  const fetchId = viewedIdNum ?? myIdNum;

  const isMe = myIdNum !== null && fetchId !== null && myIdNum === fetchId;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [colorA, setColorA] = useState<string>(TOKENS.gradientA);
  const [colorB, setColorB] = useState<string>(TOKENS.gradientB);
  const [opacityPct, setOpacityPct] = useState<number>(100);
  const opacity = Math.max(0, Math.min(100, opacityPct)) / 100;

  const [editBgOpen, setEditBgOpen] = useState(false);
  const [draftA, setDraftA] = useState(colorA);
  const [draftB, setDraftB] = useState(colorB);
  const [draftPct, setDraftPct] = useState(String(opacityPct));

  const previewA = withOpacity(draftA, Math.max(0, Math.min(100, Number(draftPct) || 0)) / 100);
  const previewB = withOpacity(draftB, Math.max(0, Math.min(100, Number(draftPct) || 0)) / 100);

  const avatarUrl = useMemo(() => {
    if (!profile) return null;
    const anyP: any = profile;
    return anyP.avatarUrl ?? anyP.imagemUrl ?? null;
  }, [profile]);

  const initials = useMemo(() => {
    const parts = (profile?.nome || '').trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase?.() || '').join('');
  }, [profile?.nome]);

  const openBgEditor = () => {
    setDraftA(colorA);
    setDraftB(colorB);
    setDraftPct(String(opacityPct));
    setEditBgOpen(true);
  };

  const applyBg = () => {
    const finalA = normalizeHex(draftA, colorA);
    const finalB = normalizeHex(draftB, colorB);
    const pct = Math.max(0, Math.min(100, Number(draftPct) || 0));
    setColorA(finalA);
    setColorB(finalB);
    setOpacityPct(pct);
    setEditBgOpen(false);
  };

  const load = useCallback(async () => {
    if (fetchId === null) {
      setError('ID de usuário inválido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isMe) {
        const base = await getMyProfile();

        let details: any | null = null;
        if ((base as any)?.id != null) {
          details = await getUserDetails((base as any).id);
        }

        const merged: any = {
          ...(base || {}),
          ...(details || {}),
        };

        merged.avatarUrl = merged.avatarUrl ?? merged.imagemUrl ?? null;

        setProfile(merged as MyProfile);
      } else {
        const base = await getUserById(fetchId);
        const details = await getUserDetails(fetchId);

        const merged: any = {
          ...(base || {}),
          ...(details || {}),
        };

        merged.avatarUrl = merged.avatarUrl ?? merged.imagemUrl ?? null;

        setProfile(merged as MyProfile);
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Não foi possível carregar o perfil do usuário.';
      setError(msg);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [fetchId, isMe]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEdit = () => {
    if (!isMe) return;
    navigation.navigate('EditProfileScreen');
  };
  const handleHistory = () => isMe && navigation.navigate('TransactionHistoryScreen');

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
  };

  if (loading) {
    return (
      <AppLayout
        wrapWithScroll={false}
        initialActivePage="Perfil"
        backgroundColor="rgb(17, 17, 17)"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgb(17,17,17)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: HEADER_OFFSET,
            paddingBottom: FOOTER_OFFSET,
          }}
        >
          <ActivityIndicator size="large" color="#00FFA3" />
          <Text style={{ color: '#D8D8E3', marginTop: 10 }}>Carregando perfil…</Text>
        </View>
      </AppLayout>
    );
  }

  if (error || !profile) {
    return (
      <AppLayout
        wrapWithScroll={false}
        initialActivePage="Perfil"
        backgroundColor="rgb(17, 17, 17)"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgb(17,17,17)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            paddingTop: HEADER_OFFSET,
            paddingBottom: FOOTER_OFFSET,
          }}
        >
          <Text style={{ color: '#ff9aa2', fontWeight: '800', textAlign: 'center' }}>
            {error || 'Perfil não encontrado.'}
          </Text>
          <TouchableOpacity onPress={load} style={{ marginTop: 12 }}>
            <LinearGradient
              colors={['#00FFA3', '#7C73FF']}
              style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
            >
              <Text style={{ color: '#0B0B0E', fontWeight: '900' }}>Tentar novamente</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </AppLayout>
    );
  }

  const anyProfile: any = profile;
  const email = anyProfile.email ?? 'email não informado';
  const tipoUsuario = anyProfile.tipoUsuario ?? 'Usuário';

  // ====== STATS DO PERFIL (detalhes) ======
  const nivel = Number(anyProfile.nivel ?? 1) || 1;
  const xp = Number(anyProfile.xp ?? anyProfile.qntdXp ?? 0) || 0;
  const tokens = Number(anyProfile.tokens ?? anyProfile.qntdToken ?? 0) || 0;
  const qtdPosts = Number(anyProfile.qtdPosts ?? 0) || 0;
  const qtdComentarios = Number(anyProfile.qtdComentarios ?? 0) || 0;
  const qtdUpVotes = Number(anyProfile.qtdUpVotes ?? 0) || 0;
  const qtdSuperVotes = Number(anyProfile.qtdSuperVotes ?? 0) || 0;
  const qtdWorkshops = Number(anyProfile.qtdWorkshops ?? 0) || 0;
  const totalVotes = qtdUpVotes + qtdSuperVotes;

  // ====== TAGS (abaixo da Bio) ======
  const tagsArray: string[] =
    Array.isArray(anyProfile.tags) && anyProfile.tags.length > 0
      ? anyProfile.tags
          .map((t: any) => {
            if (typeof t === 'string') return t;
            if (typeof t === 'number') return String(t);
            return t?.name ?? t?.nome ?? '';
          })
          .filter((n: string) => !!n && !!n.trim())
      : [];

  return (
    <AppLayout wrapWithScroll={false} initialActivePage="Perfil" backgroundColor="rgb(17, 17, 17)">
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* CAPA / HERO */}
        <LinearGradient
          colors={[withOpacity(colorA, opacity), withOpacity(colorB, opacity)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cover}
        >
          {isMe && (
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.8}
              style={styles.logOutButton}
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            >
              <Feather name="log-out" size={16} color="#656565" />
            </TouchableOpacity>
          )}

          {/* {isMe && (
            <LinearGradient
              colors={['#55F6C9', '#F985CD', '#5468FF', '#8476D9', '#F08E90']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.editFabBorder}
            >
              <TouchableOpacity
                style={styles.editFabInner}
                onPress={openBgEditor}
                activeOpacity={0.85}
                hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
              >
                <Feather name="edit-2" size={16} color="#656565" />
              </TouchableOpacity>
            </LinearGradient>
          )}*/}

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{initials || 'U'}</Text>
              </View>
            )}
          </View>

          {/* Nome + Email */}
          <View style={styles.identity}>
            <Text style={styles.name}>{profile.nome}</Text>
            <View style={styles.usernamePill}>
              <Feather name="at-sign" size={14} color="#0B0B0E" />
              <Text style={styles.usernameText}>{email}</Text>
            </View>
          </View>

          {/* Badges */}
          <View style={styles.badgesRow}>
            <View style={styles.badgePill}>
              <Feather name="award" size={14} color="#0B0B0E" />
              <Text style={styles.badgeText}>{tipoUsuario}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* CARD PRINCIPAL */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Visão geral</Text>
            {isMe && (
              <TouchableOpacity style={styles.iconGhostBtn} onPress={handleEdit}>
                <Feather name="edit-2" size={16} color="#C9C9D4" />
                <Text style={styles.iconGhostText}>Editar Perfil</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* STATS / TOKENS / NÍVEL / ATIVIDADE */}
          <View style={styles.statsWrap}>
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>Nível</Text>
              <Text style={styles.statValue}>{nivel}</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>XP</Text>
              <Text style={styles.statValue}>{xp}</Text>
            </View>
            <View style={[styles.statPill, styles.statPillAccent]}>
              <View style={styles.statTokenRow}>
                <Feather name="hexagon" size={14} color="#00FFA3" />
                <Text style={styles.statLabel}>Tokens</Text>
              </View>
              <Text style={styles.statValue}>{tokens}</Text>
            </View>
          </View>

          <View style={[styles.statsWrap, { marginTop: 8 }]}>
            <View style={styles.statPillSmall}>
              <Text style={styles.statLabel}>Posts</Text>
              <Text style={styles.statValueSmall}>{qtdPosts}</Text>
            </View>
            <View style={styles.statPillSmall}>
              <Text style={styles.statLabel}>Comentários</Text>
              <Text style={styles.statValueSmall}>{qtdComentarios}</Text>
            </View>
            <View style={styles.statPillSmall}>
              <Text style={styles.statLabel}>Votos recebidos</Text>
              <Text style={styles.statValueSmall}>{totalVotes}</Text>
            </View>
            <View style={styles.statPillSmall}>
              <Text style={styles.statLabel}>Workshops</Text>
              <Text style={styles.statValueSmall}>{qtdWorkshops}</Text>
            </View>
          </View>

          {/* BIO */}
          {!!profile.biografia && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.subSectionTitle}>Bio</Text>
              <Text style={styles.bioText}>{profile.biografia}</Text>
            </View>
          )}

          {/* TAGS ABAIXO DA BIO */}
          {tagsArray.length > 0 && (
            <View style={{ marginTop: profile.biografia ? 12 : 16 }}>
              <Text style={styles.subSectionTitle}>Tags</Text>
              <View style={styles.tagsWrap}>
                {tagsArray.map((name: string, i: number) => (
                  <Tag key={`tag-${i}`} name={name} type="suggested" />
                ))}
              </View>
            </View>
          )}

          {isMe && (
            <TouchableOpacity onPress={handleHistory} activeOpacity={0.8} style={{ marginTop: 15 }}>
              <View style={styles.ghostBtn}>
                <Feather name="log-out" size={16} color="#C9C9D4" />
                <Text style={styles.ghostText}>Histórico de Tranferências</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* CARD SUGESTÕES */}
        <View style={styles.cardAlt}>
          <Text style={styles.subSectionTitle}>Sugestões para você</Text>
          <View style={{ gap: 10, marginTop: 10 }}>
            <Suggestion
              title="Complete seu perfil"
              icon="user"
              hint="Adicione uma foto e uma bio mais detalhada"
            />
            <Suggestion
              title="Participe de um workshop"
              icon="users"
              hint="Ganhe experiência e tokens participando"
            />
            <Suggestion
              title="Publique um post"
              icon="edit-3"
              hint="Compartilhe conhecimento com a comunidade"
            />
          </View>
        </View>
      </ScrollView>

      {/* MODAL: EDITAR FUNDO */}
      <Modal
        transparent
        visible={editBgOpen}
        animationType="fade"
        onRequestClose={() => setEditBgOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar fundo do perfil</Text>

            <Text style={styles.modalLabel}>Preview</Text>
            <LinearGradient
              colors={[previewA, previewB]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewBox}
            />

            <Text style={styles.modalLabel}>Cor A (HEX)</Text>
            <View style={styles.row}>
              <TextInput
                value={draftA}
                onChangeText={setDraftA}
                placeholder="#00FFA3"
                placeholderTextColor="#777"
                style={styles.hexInput}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Swatch color="#00FFA3" onPick={setDraftA} />
              <Swatch color="#7C73FF" onPick={setDraftA} />
              <Swatch color="#14F195" onPick={setDraftA} />
              <Swatch color="#FF7CF0" onPick={setDraftA} />
            </View>

            <Text style={styles.modalLabel}>Cor B (HEX)</Text>
            <View style={styles.row}>
              <TextInput
                value={draftB}
                onChangeText={setDraftB}
                placeholder="#7C73FF"
                placeholderTextColor="#777"
                style={styles.hexInput}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Swatch color="#7C73FF" onPick={setDraftB} />
              <Swatch color="#00FFA3" onPick={setDraftB} />
              <Swatch color="#00D4FF" onPick={setDraftB} />
              <Swatch color="#FFAF00" onPick={setDraftB} />
            </View>

            <Text style={styles.modalLabel}>Opacidade (%)</Text>
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() => setDraftPct((p) => String(Math.max(0, (Number(p) || 0) - 10)))}
                style={styles.stepBtn}
              >
                <Feather name="minus" size={14} color="#C9C9D4" />
              </TouchableOpacity>
              <TextInput
                value={draftPct}
                onChangeText={(t) => setDraftPct(t.replace(/[^\d]/g, '').slice(0, 3))}
                keyboardType="numeric"
                style={[styles.hexInput, { textAlign: 'center' }]}
                placeholder="100"
                placeholderTextColor="#777"
              />
              <TouchableOpacity
                onPress={() => setDraftPct((p) => String(Math.min(100, (Number(p) || 0) + 10)))}
                style={styles.stepBtn}
              >
                <Feather name="plus" size={14} color="#C9C9D4" />
              </TouchableOpacity>
              <Text style={{ color: '#C9C9D4', marginLeft: 8 }}>%</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <View style={styles.ghostBtn}>
                <Feather name="x" size={16} color="#C9C9D4" />
                <Text style={styles.ghostText} onPress={() => setEditBgOpen(false)}>
                  Cancelar
                </Text>
              </View>
              <TouchableOpacity onPress={applyBg} style={{ flex: 1 }}>
                <LinearGradient colors={['#00FFA3', '#7C73FF']} style={styles.primaryBtn}>
                  <Feather name="save" size={16} color="#0B0B0E" />
                  <Text style={styles.primaryText}>Aplicar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppLayout>
  );
}

/* ---------- Subcomponentes ---------- */
function Suggestion({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon: keyof typeof Feather.glyphMap;
}) {
  return (
    <View style={styles.suggestionItem}>
      <View style={styles.suggestionIcon}>
        <Feather name={icon} size={16} color="#0B0B0E" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.suggestionTitle}>{title}</Text>
        {hint ? <Text style={styles.suggestionHint}>{hint}</Text> : null}
      </View>
      <Feather name="chevron-right" size={18} color="#C9C9D4" />
    </View>
  );
}
function Swatch({ color, onPick }: { color: string; onPick: (hex: string) => void }) {
  return (
    <TouchableOpacity
      onPress={() => onPick(color)}
      style={[styles.swatch, { backgroundColor: color }]}
    />
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(17, 17, 17)',
    paddingTop: HEADER_OFFSET,
    paddingBottom: FOOTER_OFFSET,
  },

  cover: {
    paddingHorizontal: 16,
    paddingTop: TOKENS.coverPaddingTop,
    paddingBottom: TOKENS.coverPaddingBottom,
  },

  editFabBorder: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 999,
    padding: 2,
    zIndex: 100,
    elevation: 10,
  },
  editFabInner: {
    backgroundColor: 'rgb(17, 17, 17)',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logOutButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgb(17,17,17)',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#656565',
    zIndex: 100,
    elevation: 10,
  },

  avatarWrap: { alignItems: 'center', marginTop: 6 },
  avatar: {
    width: TOKENS.avatarSize,
    height: TOKENS.avatarSize,
    borderRadius: TOKENS.avatarSize / 2,
    borderWidth: TOKENS.avatarBorder,
    borderColor: '#0B0B0E',
    backgroundColor: '#0B0B0E',
  },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontWeight: '900', fontSize: 30, letterSpacing: 0.3 },

  identity: { alignItems: 'center', marginTop: 10 },
  name: { color: '#0B0B0E', fontWeight: '900', fontSize: 20, letterSpacing: 0.2 },
  usernamePill: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(11,11,14,0.1)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  usernameText: { color: '#0B0B0E', fontWeight: '700', fontSize: 12 },

  badgesRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'center', gap: 10 },
  badgePill: {
    backgroundColor: 'rgba(11,11,14,0.22)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  badgeText: { color: '#0B0B0E', fontWeight: '800', fontSize: 12 },

  card: {
    backgroundColor: TOKENS.surface,
    borderRadius: TOKENS.cardRadius,
    padding: 16,
    marginHorizontal: 16,
    marginTop: TOKENS.cardMarginTop,
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
  },
  cardAlt: {
    backgroundColor: TOKENS.surfaceAlt,
    borderRadius: TOKENS.cardRadius,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
  },

  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { color: TOKENS.txtPrimary, fontWeight: '900', fontSize: 16 },
  iconGhostBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
    backgroundColor: '#15151A',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconGhostText: { color: '#C9C9D4', fontWeight: '700' },

  subSectionTitle: { color: TOKENS.txtPrimary, fontWeight: '800', fontSize: 14 },
  bioText: { color: '#D8D8E3', marginTop: 6, lineHeight: 18 },

  statsWrap: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    flexGrow: 1,
    minWidth: '30%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
    backgroundColor: '#15151A',
  },
  statPillAccent: {
    borderColor: TOKENS.gradientA,
    backgroundColor: 'rgba(0,255,163,0.08)',
  },
  statLabel: {
    color: TOKENS.txtMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    color: TOKENS.txtPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  statTokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statPillSmall: {
    flexBasis: '48%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#24242C',
    backgroundColor: '#111116',
  },
  statValueSmall: {
    color: TOKENS.txtPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },

  suggestionItem: {
    backgroundColor: TOKENS.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  suggestionIcon: { backgroundColor: TOKENS.gradientA, borderRadius: 999, padding: 8 },
  suggestionTitle: { color: TOKENS.txtPrimary, fontWeight: '800' },
  suggestionHint: { color: TOKENS.txtSecondary, marginTop: 2 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', padding: 16, justifyContent: 'center' },
  modalCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
    padding: 16,
  },
  modalTitle: { color: '#fff', fontWeight: '900', fontSize: 18, marginBottom: 10 },
  modalLabel: { color: '#C9C9D4', marginTop: 10, marginBottom: 8 },
  previewBox: { height: 64, borderRadius: 12, borderWidth: 1, borderColor: TOKENS.cardBorder },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hexInput: {
    flex: 1,
    backgroundColor: '#121216',
    color: '#EDEDF5',
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontWeight: '700',
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
  },
  stepBtn: {
    backgroundColor: '#15151A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
    padding: 8,
  },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryText: { color: '#0B0B0E', fontWeight: '800' },

  ghostBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
    backgroundColor: '#15151A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ghostText: { color: '#C9C9D4', fontWeight: '700' },
});
