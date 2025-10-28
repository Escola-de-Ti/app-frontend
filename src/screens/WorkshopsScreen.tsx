import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AppLayout from 'components/AppLayout';

/** ─────────────────────────────
 *  mock data
 *  ────────────────────────────*/
type Workshop = {
  id: string;
  title: string;
  subtitle?: string;
  date: string; // ex: "18 Set 2025"
  weekday?: string; // ex: "Sáb"
  time?: string; // ex: "19:00 - 21:00"
  level?: string; // ex: "Nvl. 18"
  tokens?: number;
  speaker?: string;
  speakerLvl?: string;
  prereqs?: string[];
  topics?: string[];
  status?: 'Inscrito' | 'Concluído';
  rating?: number; // ex: 4.7
};

const AVAILABLE: Workshop[] = [
  {
    id: '1',
    title: 'Introdução ao React Hooks',
    subtitle:
      'Aprenda os conceitos fundamentais dos React Hooks e como utilizá-los em seus projetos.',
    date: '18 Set 2025',
    weekday: 'Sáb',
    time: '19:00 - 21:00',
    level: 'Nvl. 18',
    tokens: 500,
    speaker: 'Matheus Rossini',
    speakerLvl: 'Nvl. 18',
    prereqs: ['Conhecimento básico de React', 'JavaScript ES6+'],
    topics: ['Context', 'Custom Hooks', 'Boas Práticas'],
  },
  {
    id: '2',
    title: 'Python para Análise de Dados',
    subtitle: 'Manipule, analise e visualize dados com Python e Pandas.',
    date: '18 Set 2025',
    weekday: 'Qua',
    time: '08:00 - 10:00',
    tokens: 650,
    speaker: 'André Jacob',
    speakerLvl: 'Nvl. 15',
    topics: ['Pandas', 'DataFrame', 'Plotting'],
  },
  {
    id: '3',
    title: 'APIs com Node.js e Express',
    subtitle: 'APIs REST rápidas e escaláveis para web usando Express.',
    date: '18 Set 2025',
    weekday: 'Sáb',
    time: '19:00 - 21:00',
    tokens: 500,
    speaker: 'Gabriel Marassi',
    speakerLvl: 'Nvl. 12',
    topics: ['REST', 'Middlewares', 'Deploy'],
  },
  {
    id: '4',
    title: 'Desenvolvimento Mobile com Flutter',
    subtitle: 'Crie apps nativos Android/iOS com Flutter.',
    date: '18 Set 2025',
    weekday: 'Sex',
    time: '17:00 - 20:00',
    tokens: 600,
    speaker: 'Kauan Bertalha',
    speakerLvl: 'Nvl. 17',
    topics: ['Widgets', 'State', 'Performance'],
  },
];

const MINE: Workshop[] = [
  {
    id: '1',
    title: 'Introdução ao React Hooks',
    subtitle:
      'Aprenda os conceitos fundamentais dos React Hooks e como utilizá-los em seus projetos.',
    date: '18 Set 2025',
    weekday: 'Sáb',
    time: '19:00 - 21:00',
    level: 'Nvl. 18',
    tokens: 500,
    speaker: 'Matheus Rossini',
    speakerLvl: 'Nvl. 18',
    prereqs: ['Conhecimento básico de React', 'JavaScript ES6+'],
    topics: ['Context', 'Custom Hooks', 'Boas Práticas'],
  },
  {
    id: '2',
    title: 'Python para Análise de Dados',
    subtitle: 'Manipule, analise e visualize dados com Python e Pandas.',
    date: '18 Set 2025',
    weekday: 'Qua',
    time: '08:00 - 10:00',
    tokens: 650,
    speaker: 'André Jacob',
    speakerLvl: 'Nvl. 15',
    topics: ['Pandas', 'DataFrame', 'Plotting'],
  },
];

const ENROLLED: Workshop[] = [
  {
    id: 'ts-1',
    title: 'TypeScript Avançado',
    subtitle: 'Workshop sobre funcionalidades avançadas do TypeScript.',
    date: '21 Nov 2025',
    status: 'Concluído',
    rating: 4.7,
  },
  {
    id: 'ts-2',
    title: 'TypeScript Avançado',
    subtitle: 'Workshop sobre funcionalidades avançadas do TypeScript.',
    date: '21 Nov 2025',
    status: 'Inscrito',
  },
  {
    id: 'ts-3',
    title: 'TypeScript Avançado',
    subtitle: 'Workshop sobre funcionalidades avançadas do TypeScript.',
    date: '21 Nov 2025',
    status: 'Inscrito',
  },
];

/** ─────────────────────────────
 *  ui helpers
 *  ────────────────────────────*/
const Chip = ({ text }: { text: string }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>{text}</Text>
  </View>
);

const Pill = ({ text }: { text: string }) => (
  <View style={styles.pill}>
    <Text style={styles.pillText}>{text}</Text>
  </View>
);

const LevelBadge = ({ text }: { text: string }) => (
  <View style={styles.levelBadge}>
    <Text style={styles.levelText}>{text}</Text>
  </View>
);

const TokenBadge = ({ amount }: { amount?: number }) =>
  amount ? (
    <View style={styles.tokenBadge}>
      <Text style={styles.tokenText}>{amount} tokens</Text>
    </View>
  ) : null;

const StatusBadge = ({ status }: { status?: 'Inscrito' | 'Concluído' }) =>
  status ? (
    <View
      style={[
        styles.statusBadge,
        status === 'Concluído' ? styles.statusDone : styles.statusEnrolled,
      ]}
    >
      <Text style={styles.statusText}>{status}</Text>
    </View>
  ) : null;

/** ─────────────────────────────
 *  card principal (varia por modo)
 *  ────────────────────────────*/
type Mode = 'Disponíveis' | 'Meus Workshops' | 'Inscritos';

function WorkshopCard({
  item,
  mode,
  onPrimary,
  onSecondary,
}: {
  item: Workshop;
  mode: Mode;
  onPrimary?: (w: Workshop) => void;
  onSecondary?: (w: Workshop) => void;
}) {
  return (
    <View style={styles.card}>
      {/* header */}
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.title}</Text>
        {mode !== 'Inscritos' ? (
          <TokenBadge amount={item.tokens} />
        ) : (
          <StatusBadge status={item.status} />
        )}
      </View>

      {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}

      {/* speaker/level */}
      {mode !== 'Inscritos' && item.speaker ? (
        <View style={styles.speakerRow}>
          <View style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.speaker}>{item.speaker}</Text>
            {item.speakerLvl ? <LevelBadge text={item.speakerLvl} /> : null}
          </View>
        </View>
      ) : null}

      {/* infos (data / semana / hora) */}
      <View style={styles.metaRow}>
        <Feather name="calendar" size={14} color="#A9A9B2" />
        <Text style={styles.metaText}>{item.date}</Text>

        {item.weekday ? (
          <>
            <View style={styles.dot} />
            <Feather name="clock" size={14} color="#A9A9B2" />
            <Text style={styles.metaText}>{item.weekday}</Text>
          </>
        ) : null}

        {item.time ? (
          <>
            <View style={styles.dot} />
            <Feather name="watch" size={14} color="#A9A9B2" />
            <Text style={styles.metaText}>{item.time}</Text>
          </>
        ) : null}
      </View>

      {/* prereqs */}
      {mode !== 'Inscritos' && item.prereqs?.length ? (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.sectionLabel}>Pré-requisitos:</Text>
          {item.prereqs.map((p, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>{p}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* topics */}
      {mode !== 'Inscritos' && item.topics?.length ? (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.sectionLabel}>Tópicos abordados:</Text>
          <View style={styles.chipsRow}>
            {item.topics.map((t, i) => (
              <Chip key={i} text={t} />
            ))}
          </View>
        </View>
      ) : null}

      {/* rating para inscritos concluídos */}
      {mode === 'Inscritos' && item.rating ? (
        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Feather name="star" size={14} color="#FFB800" />
          <Text style={[styles.metaText, { color: '#FFB800' }]}>{item.rating.toFixed(1)}</Text>
        </View>
      ) : null}

      {/* ação principal por modo */}
      <View style={styles.actions}>
        {mode === 'Disponíveis' && (
          <TouchableOpacity onPress={() => onPrimary?.(item)} activeOpacity={0.9}>
            <LinearGradient colors={['#00FFA3', '#7C73FF']} style={styles.primaryBtn}>
              <Feather name="log-in" size={18} color="#0B0B0E" />
              <Text style={styles.primaryText}>Inscreva-se</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {mode === 'Meus Workshops' && (
          <TouchableOpacity onPress={() => onSecondary?.(item)} style={styles.secondaryBtn}>
            <Feather name="settings" size={18} color="#C9C9D4" />
            <Text style={styles.secondaryText}>Editar Configurações</Text>
          </TouchableOpacity>
        )}

        {mode === 'Inscritos' && item.status === 'Inscrito' && (
          <TouchableOpacity onPress={() => onPrimary?.(item)} activeOpacity={0.9}>
            <LinearGradient colors={['#7C73FF', '#C07CFF']} style={styles.primaryBtn}>
              <Feather name="play-circle" size={18} color="#0B0B0E" />
              <Text style={styles.primaryText}>Entrar</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/** ─────────────────────────────
 *  dropdown simples
 *  ────────────────────────────*/
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

      <Modal transparent visible={open} animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View />
        </Pressable>
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

/** ─────────────────────────────
 *  SCREEN
 *  ────────────────────────────*/
export default function WorkshopsScreen() {
  const [mode, setMode] = useState<Mode>('Disponíveis');

  const data = useMemo(() => {
    if (mode === 'Disponíveis') return AVAILABLE;
    if (mode === 'Meus Workshops') return MINE;
    return ENROLLED;
  }, [mode]);

  const onInscrever = (w: Workshop) => {
    // TODO: plugar sua ação real
    console.log('Inscrever-se em:', w.title);
  };

  const onEntrar = (w: Workshop) => {
    // TODO: plugar navegação/sala
    console.log('Entrar em:', w.title);
  };

  const onEditar = (w: Workshop) => {
    // TODO: abrir modal/rotear para settings do workshop
    console.log('Editar Configuração de:', w.title);
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        {/* header */}
        <View style={styles.header}>
          <Text style={styles.h1}>Workshops</Text>
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

        {/* lista (sem FlatList para conviver com o ScrollView do AppLayout) */}
        <View style={{ paddingHorizontal: 14, paddingBottom: 24 }}>
          {data.map((item, idx) => (
            <View key={item.id} style={{ marginTop: idx === 0 ? 0 : 14 }}>
              <WorkshopCard
                item={item}
                mode={mode}
                onPrimary={mode === 'Disponíveis' ? onInscrever : onEntrar}
                onSecondary={onEditar}
              />
            </View>
          ))}
        </View>
      </View>
    </AppLayout>
  );
}

/** ─────────────────────────────
 *  STYLES
 *  ────────────────────────────*/
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E0E' },

  header: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 },
  h1: { color: '#F9F9FF', fontSize: 24, fontWeight: '800' },
  subtitleHeader: { color: '#BDBDCC', marginTop: 4 },

  headerRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  filterBtn: {
    marginLeft: 'auto',
    borderRadius: 12,
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

  card: {
    backgroundColor: '#17171C',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: {
    flex: 1,
    color: '#EDEDF5',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#BDBDCC',
    marginTop: 8,
    lineHeight: 18,
  },

  tokenBadge: {
    backgroundColor: '#2A203B',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#5B4A8F',
  },
  tokenText: { color: '#E1C9FF', fontWeight: '700', fontSize: 12 },

  statusBadge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statusEnrolled: { backgroundColor: '#2C2F4A' },
  statusDone: { backgroundColor: '#1E3A2F' },
  statusText: { color: '#DDE6FF', fontWeight: '700', fontSize: 12 },

  speakerRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#282833',
  },
  speaker: { color: '#EDEDF5', fontWeight: '700' },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#222832',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  levelText: { color: '#9DD4FF', fontSize: 12, fontWeight: '700' },

  metaRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: { color: '#A9A9B2', fontSize: 12 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3A44',
    marginHorizontal: 4,
  },

  sectionLabel: { color: '#C9C9D4', fontWeight: '700', marginTop: 2 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7C73FF',
  },
  bulletText: { color: '#D8D8E3' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    backgroundColor: '#20202A',
    borderWidth: 1,
    borderColor: '#343445',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  chipText: { color: '#BDBDCC', fontSize: 12 },

  actions: { marginTop: 14 },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryText: { color: '#0B0B0E', fontWeight: '800' },
  secondaryBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#1E1E26',
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  secondaryText: { color: '#C9C9D4', fontWeight: '700' },
  pill: {
    backgroundColor: '#2A203B',
    borderWidth: 1,
    borderColor: '#5B4A8F',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  pillText: {
    color: '#E1C9FF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
