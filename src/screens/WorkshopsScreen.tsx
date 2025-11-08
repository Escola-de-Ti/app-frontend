import React, { useMemo, useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';

import type { Workshop } from '../types';
import AvailableWorkshops from '../components/workshops/AvailableWorkshops';
import MyWorkshops from '../components/workshops/MyWorkshops';
import EnrolledWorkshops from '../components/workshops/EnrolledWorkshops';
import {
  listAvailableWorkshops,
  listMyWorkshops,
  listEnrolledWorkshops,
  enrollInWorkshop,
  cancelEnrollment,
} from '../services/workshops';

type Mode = 'Disponíveis' | 'Meus Workshops' | 'Inscritos';

const USE_MOCK = true; // mude para false quando ligar no back

// --- Dropdown de modo (igual ao seu visual) ---
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
  const [mode, setMode] = useState<Mode>('Disponíveis');
  const navigation = useNavigation<any>();

  // estados das listas
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState<Workshop[]>([]);
  const [mine, setMine] = useState<Workshop[]>([]);
  const [enrolled, setEnrolled] = useState<Workshop[]>([]);

  // mocks no formato do nosso tipo Workshop
  const load = async () => {
    setLoading(true);
    try {
      if (USE_MOCK) {
        const base: Workshop[] = [
          {
            id: 1,
            titulo: 'Introdução ao React Hooks',
            descricao: 'Aprenda os conceitos fundamentais dos React Hooks e como utilizá-los.',
            dataInicio: new Date(Date.now() + 86400000),
            local: 'Online',
            nivel: 'BASICO',
            tokens: 500,
            vagasTotais: 100,
            vagasDisponiveis: 82,
            criadoPorUsuarioId: 10,
            inscrito: false,
          },
          {
            id: 2,
            titulo: 'Python para Análise de Dados',
            descricao: 'Manipule, analise e visualize dados com Python e Pandas.',
            dataInicio: new Date(Date.now() + 172800000),
            local: 'São Paulo — Centro',
            nivel: 'INTERMEDIARIO',
            tokens: 650,
            vagasTotais: 40,
            vagasDisponiveis: 12,
            criadoPorUsuarioId: 77,
            inscrito: true,
          },
          {
            id: 3,
            titulo: 'TypeScript Avançado',
            descricao: 'Funcionalidades avançadas do TS e padrões de projeto.',
            dataInicio: new Date(Date.now() + 259200000),
            nivel: 'AVANCADO',
            tokens: 300,
            criadoPorUsuarioId: 77,
            inscrito: true,
          },
        ];
        setAvailable(base.filter((b) => !b.inscrito));
        setMine(base.filter((b) => b.criadoPorUsuarioId === 77));
        setEnrolled(base.filter((b) => b.inscrito));
      } else {
        const [a, m, e] = await Promise.all([
          listAvailableWorkshops(),
          listMyWorkshops(),
          listEnrolledWorkshops(),
        ]);
        setAvailable(a);
        setMine(m);
        setEnrolled(e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Handlers (casam com os botões das listas)
  const onInscrever = async (id: number) => {
    if (!USE_MOCK) await enrollInWorkshop(id);
    Alert.alert('Inscrição', `Você se inscreveu no workshop #${id}`);
    load();
  };

  const onCancelar = async (id: number) => {
    if (!USE_MOCK) await cancelEnrollment(id);
    Alert.alert('Inscrição', `Inscrição cancelada para o workshop #${id}`);
    load();
  };

  const onEditar = (id: number) => {
    navigation.navigate('CreateWorkshopScreen', { id });
  };

  const goCreateWorkshop = () => {
    navigation.navigate('CreateWorkshopScreen');
  };

  // qual lista mostrar
  const content = useMemo(() => {
    if (mode === 'Disponíveis') {
      return (
        <AvailableWorkshops
          data={available}
          loading={loading}
          onRefresh={load}
          onEnroll={onInscrever}
        />
      );
    }
    if (mode === 'Inscritos') {
      return (
        <EnrolledWorkshops
          data={enrolled}
          loading={loading}
          onRefresh={load}
          onCancel={onCancelar}
        />
      );
    }
    return <MyWorkshops data={mine} loading={loading} onRefresh={load} onEdit={onEditar} />;
  }, [mode, available, enrolled, mine, loading]);

  return (
    <AppLayout initialActivePage="Workshops">
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* header (igual ao seu layout) */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.h1}>Workshops</Text>

            {/* Botão "Criar workshop" só em "Meus Workshops" */}
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
            <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
              <LinearGradient colors={['#7C73FF', '#8D7CFF']} style={styles.filterBtnInner}>
                <Feather name="sliders" size={16} color="#0B0B0E" />
              </LinearGradient>
            </TouchableOpacity>
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

  /* Botão criar */
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
    marginLeft: 'auto',
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
