import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
import AppLayout from '../components/AppLayout';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import type { Workshop } from '../types';
import AvailableWorkshops from '../components/workshops/AvailableWorkshops';
import MyWorkshops from '../components/workshops/MyWorkshops';
import EnrolledWorkshops from '../components/workshops/EnrolledWorkshops';
import { listAll, listOpen } from '../services/workshops';

// 🔑 resolução de usuário “do jeito certo”
import { useAuth } from '../hooks/useAuth';
import { getAccessToken } from '../lib/secure';
import { getUserIdFromJwt, getEmailFromJwt } from '../lib/jwt';
import { getUsuarioIdByEmail } from '../services/user';

// ⬇️ novo: input de filtro específico de workshops
import FilterInputWorkshop from '../components/filters/FilterInputWorkshop';

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

export default function WorkshopsScreen() {
  const navigation = useNavigation<any>();
  const { userId } = useAuth();

  const [mode, setMode] = useState<Mode>('Disponíveis');
  const [loading, setLoading] = useState(false);

  const [available, setAvailable] = useState<Workshop[]>([]);
  const [mine, setMine] = useState<Workshop[]>([]);
  const [enrolled, setEnrolled] = useState<Workshop[]>([]);

  // ⬇️ novo: termo de busca
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);

  // 🔑 resolve instrutorId: useAuth → token(userId) → token(email) → API
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
          /* silencioso; tratamos no load() */
        }
      }
    }
    return null;
  }, [userId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const myId = await resolveUserId();

      // Disponíveis (ABERTOS)
      let abertos = await listOpen();
      // se o DTO trouxer `inscrito`, não listar como disponível algo já inscrito
      abertos = abertos.filter((w: any) => !w?.inscrito);
      setAvailable(abertos);

      // Meus (por instrutorId)
      const meus = myId ? await listAll({ instrutorId: myId }) : [];
      setMine(meus);

      // Inscritos (heurística até existir endpoint dedicado)
      const andamento = await listAll({ status: 'EM_ANDAMENTO' });
      const concluido = await listAll({ status: 'CONCLUIDO' });

      let inscritos = [...andamento, ...concluido];

      // 1) se vier `inscrito` do back, usa-o como verdade
      if (inscritos.some((w: any) => 'inscrito' in w)) {
        inscritos = inscritos.filter((w: any) => w?.inscrito === true);
      }

      // 2) exclui workshops em que eu sou o instrutor
      const myIdNum = myId != null ? Number(myId) : null;
      if (myIdNum != null) {
        inscritos = inscritos.filter((w) => Number(w.instrutorId) !== myIdNum);
      }

      // 3) remove duplicatas por id
      const uniq = new Map<number, Workshop>();
      inscritos.forEach((w) => uniq.set(Number(w.id), w));
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

  // 🔎 filtro client-side mínimo
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
    // Mantemos local: apenas setamos q. Se futuramente tiver endpoint, plugamos aqui.
    setSearching(true);
    try {
      setQ(term);
      // se quiser debounce/await de rede, fica aqui
    } finally {
      setSearching(false);
    }
  }, []);

  // Handlers — plugue seus endpoints quando tiver (inscrever/cancelar)
  const onInscrever = async (id: number) => {
    Alert.alert('Inscrição', `Ação de inscrição simulada para o workshop #${id}`);
  };

  const onCancelar = async (id: number) => {
    Alert.alert('Inscrição', `Cancelamento de inscrição simulado para o workshop #${id}`);
  };

  const onEditar = (id: number) => {
    navigation.navigate('CreateWorkshopScreen', { id });
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
  }, [mode, filteredAvailable, filteredEnrolled, filteredMine, loading, load]);

  return (
    <AppLayout initialActivePage="Workshops" backgroundColor="rgb(17, 17, 17)">
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.h1}>Workshops</Text>

            {mode === 'Meus Workshops' && (
              <TouchableOpacity activeOpacity={0.9} onPress={goCreateWorkshop}>
                <LinearGradient colors={['#00FFA3', '#7C73FF']} style={styles.createBtn}>
                  <Feather name="plus-circle" size={16} color="#0B0B0E" />
                  <Text style={styles.createBtnText}>Criar workshop</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.subtitleHeader}>Aprenda com especialistas da comunidade</Text>

          <View style={styles.headerRow}>
            <ModeDropdown value={mode} onChange={setMode} />

            {/* ⬇️ novo input de filtro */}
            <View style={{ flex: 1 }}>
              <FilterInputWorkshop
                value={q}
                onChangeText={setQ}
                loading={searching}
                onSearch={onSearch}
                placeholder="Buscar workshops, temas, instrutor…"
              />
            </View>

            {/* <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
              <LinearGradient colors={['#7C73FF', '#8D7CFF']} style={styles.filterBtnInner}>
                <Feather name="sliders" size={16} color="#0B0B0E" />
              </LinearGradient>
            </TouchableOpacity> */}
          </View>
        </View>

        <View style={{ paddingHorizontal: 14, paddingBottom: 24 }}>{content}</View>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgb(17, 17, 17)' },

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
  },

  createBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createBtnText: {
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
