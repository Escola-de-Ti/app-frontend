// === src/screens/WorkshopsScreen.tsx ===
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AppLayout, { HEADER_OFFSET, FOOTER_OFFSET } from '../components/AppLayout';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import {
  listAll,
  listOpen,
  enrollInWorkshop,
  OwnWorkshopEnrollError,
  NotEnoughTokensEnrollError,
} from '../services/workshops';

import type { Workshop, ID } from '../types';
import AvailableWorkshops from '../components/workshops/AvailableWorkshops';
import MyWorkshops from '../components/workshops/MyWorkshops';
import EnrolledWorkshops from '../components/workshops/EnrolledWorkshops';

import { useAuth } from '../hooks/useAuth';
import { getAccessToken } from '../lib/secure';
import { getUserIdFromJwt, getEmailFromJwt } from '../lib/jwt';
import { getUsuarioIdByEmail } from '../services/user';
import { getUserDetails } from '../services/profile';

type Mode = 'Disponíveis' | 'Meus Workshops' | 'Inscritos';

function ModeDropdown({ value, onChange }: { value: Mode; onChange: (v: Mode) => void }) {
  const [open, setOpen] = useState(false);
  const opts: Mode[] = ['Disponíveis', 'Meus Workshops', 'Inscritos'];

  return (
    <View style={{ position: 'relative' }}>
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        style={styles.dropdownTrigger}
        activeOpacity={0.8}
      >
        <Text style={styles.dropdownText}>{value}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#EDEDF5" />
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.dropdownMenu}>
          {opts.map((o) => (
            <TouchableOpacity
              key={o}
              style={[styles.dropdownItem, o === value && { backgroundColor: '#2A2A33' }]}
              onPress={() => {
                onChange(o);
                setOpen(false);
              }}
            >
              <Text style={styles.dropdownItemText}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

function TokenBadge({ tokens }: { tokens: number | null }) {
  if (tokens == null || Number.isNaN(tokens)) return null;

  const formatted = tokens.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

  return (
    <LinearGradient
      colors={['#3CF6B4', '#6F9CFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.tokenBadge}
    >
      <View style={styles.tokenIcon}>
        <Text style={styles.tokenIconText}>T</Text>
      </View>
      <Text style={styles.tokenText}>{formatted}</Text>
    </LinearGradient>
  );
}

export default function WorkshopsScreen() {
  const navigation = useNavigation<any>();
  const { userId } = useAuth();

  const [mode, setMode] = useState<Mode>('Disponíveis');
  const [loading, setLoading] = useState(false);

  const [available, setAvailable] = useState<Workshop[]>([]);
  const [mine, setMine] = useState<Workshop[]>([]);
  const [enrolled, setEnrolled] = useState<Workshop[]>([]);

  const [isInstructor, setIsInstructor] = useState(false);
  const [userTokens, setUserTokens] = useState<number | null>(null);

  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);

  const resolveUserId = useCallback(async (): Promise<number | null> => {
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
  }, [userId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const myId = await resolveUserId();

      if (myId != null) {
        try {
          const details: any = await getUserDetails(myId);

          const tipo =
            details?.tipo ??
            details?.tipoUsuario ??
            details?.role ??
            details?.perfil ??
            details?.perfilUsuario;
          setIsInstructor(String(tipo).toUpperCase() === 'INSTRUTOR');

          const tokensRaw =
            details?.tokens ??
            details?.saldoTokens ??
            details?.saldoToken ??
            details?.tokensDisponiveis ??
            details?.qtdTokens;

          const tokensNum = Number(tokensRaw);
          setUserTokens(Number.isFinite(tokensNum) ? tokensNum : null);
        } catch (e) {
          console.log(
            '[WorkshopsScreen] erro ao carregar tipo / tokens do usuário',
            (e as any)?.message
          );
          setIsInstructor(false);
          setUserTokens(null);
        }
      } else {
        setIsInstructor(false);
        setUserTokens(null);
      }

      const abertosRaw = await listOpen();
      const disponiveis = (abertosRaw as any[]).filter((w) => !w?.inscrito);
      setAvailable(disponiveis);

      const meus = myId ? await listAll({ instrutorId: myId }) : [];
      setMine(meus);

      const todos = await listAll();
      const myIdNum = myId != null ? Number(myId) : null;

      let inscritos = (todos as any[]).filter((w) => w?.inscrito === true);

      if (myIdNum != null) {
        inscritos = inscritos.filter((w) => Number(w.instrutorId) !== myIdNum);
      }

      const uniq = new Map<number, Workshop>();
      inscritos.forEach((w: any) => {
        const idNum = Number(w.id);
        if (Number.isFinite(idNum)) {
          uniq.set(idNum, w as Workshop);
        }
      });

      setEnrolled(Array.from(uniq.values()));
    } catch (e: any) {
      console.log('[WorkshopsScreen] load error:', e?.message);
    } finally {
      setLoading(false);
    }
  }, [resolveUserId]);

  useFocusEffect(
    React.useCallback(() => {
      load();
      return () => {};
    }, [load])
  );

  const matches = useCallback((w: Workshop, term: string) => {
    if (!term) return true;
    const t = term.toLowerCase();
    const campos = [
      w.titulo,
      (w as any).instrutorNome,
      (w.descricao as any)?.tema,
      (w.descricao as any)?.descricao,
    ]
      .filter(Boolean)
      .map(String)
      .join(' ')
      .toLowerCase();
    return campos.includes(t);
  }, []);

  const filteredAvailable = useMemo(
    () => available.filter((w) => matches(w, q)),
    [available, q, matches]
  );
  const filteredMine = useMemo(() => mine.filter((w) => matches(w, q)), [mine, q, matches]);
  const filteredEnrolled = useMemo(
    () => enrolled.filter((w) => matches(w, q)),
    [enrolled, q, matches]
  );

  const onSearch = useCallback(async (term: string) => {
    setSearching(true);
    try {
      setQ(term);
    } finally {
      setSearching(false);
    }
  }, []);

  const onInscrever = async (id: ID) => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return;

    try {
      await enrollInWorkshop(numericId);

      Toast.show({
        type: 'success',
        text1: 'Inscrição realizada!',
        text2: 'Você foi inscrito neste workshop.',
      });

      await load();
    } catch (e: any) {
      if (e instanceof OwnWorkshopEnrollError) {
        Toast.show({
          type: 'error',
          text1: 'Não permitido',
          text2: e.message || 'Você não pode se inscrever no seu próprio workshop.',
        });
        return;
      }

      if (e instanceof NotEnoughTokensEnrollError) {
        Toast.show({
          type: 'error',
          text1: 'Tokens insuficientes',
          text2: e.message || 'Você não possui tokens suficientes para este workshop.',
        });
        return;
      }

      Toast.show({
        type: 'error',
        text1: 'Erro ao se inscrever',
        text2: e?.message || 'Não foi possível concluir a inscrição. Tente novamente.',
      });
    }
  };

  const onCancelar = async (id: ID) => {
    const numericId = Number(id);
    if (!Number.isNaN(numericId)) {
      Alert.alert('Inscrição', `Cancelamento de inscrição simulado para o workshop #${numericId}`);
    }
  };

  const onEditar = (id: ID) => {
    const numericId = Number(id);
    if (!Number.isNaN(numericId)) {
      navigation.navigate('EditWorkshopScreen', { id: numericId });
    }
  };

  const goCreateWorkshop = () => {
    navigation.navigate('CreateWorkshopScreen');
  };

  const content = useMemo(() => {
    if (mode === 'Disponíveis') {
      return (
        <AvailableWorkshops
          data={filteredAvailable}
          loading={loading}
          onRefresh={load}
          onEnroll={onInscrever}
        />
      );
    }
    if (mode === 'Inscritos') {
      return (
        <EnrolledWorkshops
          data={filteredEnrolled}
          loading={loading}
          onRefresh={load}
          onCancel={onCancelar}
        />
      );
    }
    return <MyWorkshops data={filteredMine} loading={loading} onRefresh={load} onEdit={onEditar} />;
  }, [
    mode,
    filteredAvailable,
    filteredEnrolled,
    filteredMine,
    loading,
    load,
    onInscrever,
    onCancelar,
    onEditar,
  ]);

  const canShowCreateButton = isInstructor && mode === 'Meus Workshops';

  return (
    <AppLayout
      wrapWithScroll={false}
      initialActivePage="Workshops"
      backgroundColor="rgb(17, 17, 17)"
      collapsible={false}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.h1}>Workshops</Text>
            <TokenBadge tokens={userTokens} />
          </View>

          <Text style={styles.subtitleHeader}>Aprenda com especialistas da comunidade</Text>

          <View style={styles.headerRow}>
            <ModeDropdown value={mode} onChange={setMode} />

            {canShowCreateButton && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={goCreateWorkshop}
                style={styles.createBtnWrapper}
              >
                <LinearGradient
                  colors={['#00FFA3', '#7C73FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.createBtn}
                >
                  <Feather name="plus-circle" size={16} color="#0B0B0E" />
                  <Text style={styles.createBtnText}>Criar workshop</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* aqui o conteúdo das listas */}
        <View
          style={{
            paddingHorizontal: 14,
            paddingBottom: 24,
          }}
        >
          {content}
        </View>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(17, 17, 17)',
    paddingTop: HEADER_OFFSET,
    // 👇 aumentei o "respiro" embaixo pra compensar o footer
    paddingBottom: FOOTER_OFFSET + 100,
  },

  header: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  h1: { color: '#F9F9FF', fontSize: 24, fontWeight: '800', flex: 1 },
  subtitleHeader: { color: '#BDBDCC', marginTop: 4 },

  headerRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between',
  },

  createBtnWrapper: {
    flexShrink: 0,
  },

  createBtn: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  createBtnText: {
    color: '#0B0B0E',
    fontWeight: '800',
    fontSize: 12,
  },

  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tokenIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0B0B0E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  tokenIconText: {
    color: '#00FFA3',
    fontSize: 11,
    fontWeight: '900',
  },
  tokenText: {
    color: '#0B0B0E',
    fontWeight: '800',
    fontSize: 12,
  },

  filterBtn: {
    borderRadius: 5,
    overflow: 'hidden',
  },
  filterBtnInner: {
    padding: 10,
    borderRadius: 12,
  },

  dropdownTrigger: {
    backgroundColor: '#1A1A1F',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A33',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownText: { color: '#EDEDF5', fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  dropdownMenu: {
    position: 'absolute',
    top: 88,
    left: 16,
    backgroundColor: '#1A1A1F',
    borderRadius: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2A2A33',
    width: 200,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownItemText: { color: '#EDEDF5', fontWeight: '500' },
});
