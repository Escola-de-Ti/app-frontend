// import React, { useEffect, useMemo, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   Image,
//   Modal,
//   Alert,
//   ScrollView,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Feather } from '@expo/vector-icons';

// import AppLayout from '../components/AppLayout';
// import AppInput from '../components/AppInput';
// import Tag from '../components/Tag';

// import { useAuth } from '../hooks/useAuth';
// import { getUsuarioById, updateUsuario } from '../services/user';

// type Perfil = {
//   id: number | string;
//   nome?: string;
//   email?: string;
//   bio?: string;
//   avatarUrl?: string;
//   nivel?: number;   // opcional
//   tokens?: number;  // opcional
//   tags?: string[];  // opcional
//   stats?: {
//     posts?: number;
//     respostas?: number;
//     workshops?: number;
//     seguidores?: number;
//     seguindo?: number;
//   };
// };

// export default function ProfileScreen() {
//   const { userId, logout } = useAuth();

//   const [loading, setLoading] = useState(true);
//   const [perfil, setPerfil] = useState<Perfil | null>(null);

//   const [editOpen, setEditOpen] = useState(false);
//   const [editNome, setEditNome] = useState('');
//   const [editBio, setEditBio] = useState('');

//   // carregamento do perfil
//   useEffect(() => {
//     (async () => {
//       try {
//         if (!userId) {
//           setLoading(false);
//           return;
//         }
//         const idNum = Number(userId);
//         const data = await getUsuarioById(idNum);
//         const normalized: Perfil = {
//           id: data?.id ?? idNum,
//           nome: data?.nome ?? '',
//           email: data?.email ?? '',
//           bio: data?.bio ?? '',
//           avatarUrl: data?.avatarUrl ?? '',
//           nivel: Number.isFinite(Number(data?.nivel)) ? Number(data?.nivel) : undefined,
//           tokens: Number.isFinite(Number(data?.tokens)) ? Number(data?.tokens) : undefined,
//           tags: Array.isArray(data?.tags)
//             ? data.tags.map((t: any) => String(t?.name ?? t ?? '')).filter(Boolean)
//             : [],
//           stats: {
//             posts: Number.isFinite(Number(data?.posts)) ? Number(data?.posts) : data?.stats?.posts,
//             respostas: Number.isFinite(Number(data?.respostas))
//               ? Number(data?.respostas)
//               : data?.stats?.respostas,
//             workshops: Number.isFinite(Number(data?.workshops))
//               ? Number(data?.workshops)
//               : data?.stats?.workshops,
//             seguidores: Number.isFinite(Number(data?.seguidores))
//               ? Number(data?.seguidores)
//               : data?.stats?.seguidores,
//             seguindo: Number.isFinite(Number(data?.seguindo))
//               ? Number(data?.seguindo)
//               : data?.stats?.seguindo,
//           },
//         };
//         setPerfil(normalized);
//       } catch (e: any) {
//         console.log('[Profile] load error', e?.message);
//         Alert.alert('Ops', 'Não foi possível carregar seu perfil.');
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [userId]);

//   // derive iniciais
//   const initials = useMemo(() => {
//     const n = perfil?.nome?.trim() || '';
//     const parts = n.split(/\s+/).slice(0, 2);
//     return parts.map((p) => p[0]?.toUpperCase?.() || '').join('');
//   }, [perfil?.nome]);

//   // abrir modal de edição preenchendo os campos
//   const openEdit = () => {
//     setEditNome(perfil?.nome ?? '');
//     setEditBio(perfil?.bio ?? '');
//     setEditOpen(true);
//   };

//   const saveEdit = async () => {
//     try {
//       if (!perfil) return;
//       const idNum = Number(perfil.id);
//       const payload: any = {
//         nome: editNome.trim(),
//         bio: editBio.trim(),
//       };
//       await updateUsuario(idNum, payload);
//       setPerfil((prev) =>
//         prev
//           ? {
//               ...prev,
//               nome: payload.nome ?? prev.nome,
//               bio: payload.bio ?? prev.bio,
//             }
//           : prev
//       );
//       setEditOpen(false);
//       Alert.alert('Pronto!', 'Perfil atualizado com sucesso.');
//     } catch (e: any) {
//       const msg = e?.response?.data?.message || e?.message || 'Falha ao salvar.';
//       Alert.alert('Erro', msg);
//     }
//   };

//   const handleLogout = async () => {
//     try {
//       await logout();
//       // a tua stack já trata o fluxo pós-logout (AuthScreen)
//     } catch (e) {
//       // silencioso
//     }
//   };

//   if (loading) {
//     return (
//       <AppLayout initialActivePage="Perfil">
//         <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
//           <ActivityIndicator />
//         </View>
//       </AppLayout>
//     );
//   }

//   return (
//     <AppLayout initialActivePage="Perfil">
//       <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
//         {/* capa com gradiente */}
//         <LinearGradient
//           colors={['#00FFA3', '#7C73FF']}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.cover}
//         >
//           <View style={styles.avatarWrap}>
//             {perfil?.avatarUrl ? (
//               <Image source={{ uri: perfil.avatarUrl }} style={styles.avatar} />
//             ) : (
//               <View style={[styles.avatar, styles.avatarFallback]}>
//                 <Text style={styles.avatarInitials}>{initials || 'U'}</Text>
//               </View>
//             )}
//           </View>

//           <View style={styles.identity}>
//             <Text style={styles.name}>{perfil?.nome || 'Seu nome'}</Text>
//             {!!perfil?.email && (
//               <View style={styles.userRow}>
//                 <Feather name="at-sign" size={14} color="#0B0B0E" />
//                 <Text style={styles.username}>{perfil.email}</Text>
//               </View>
//             )}
//           </View>

//           {/* badges de nível/tokens se existirem */}
//           <View style={styles.badgesRow}>
//             {Number.isFinite(perfil?.nivel as any) && (
//               <View style={styles.pill}>
//                 <Feather name="bar-chart-2" size={14} color="#0B0B0E" />
//                 <Text style={styles.pillText}>Nvl. {perfil?.nivel}</Text>
//               </View>
//             )}
//             {Number.isFinite(perfil?.tokens as any) && (
//               <View style={styles.pill}>
//                 <Feather name="award" size={14} color="#0B0B0E" />
//                 <Text style={styles.pillText}>{perfil?.tokens} tokens</Text>
//               </View>
//             )}
//           </View>
//         </LinearGradient>

//         {/* cartão principal */}
//         <View style={styles.card}>
//           {/* Ações */}
//           <View style={styles.actionsRow}>
//             <TouchableOpacity onPress={openEdit} activeOpacity={0.85} style={{ flex: 1 }}>
//               <LinearGradient colors={['#00FFA3', '#7C73FF']} style={styles.primaryBtn}>
//                 <Feather name="edit-3" size={16} color="#0B0B0E" />
//                 <Text style={styles.primaryText}>Editar Perfil</Text>
//               </LinearGradient>
//             </TouchableOpacity>

//             <TouchableOpacity onPress={handleLogout} activeOpacity={0.8} style={styles.ghostBtn}>
//               <Feather name="log-out" size={16} color="#C9C9D4" />
//               <Text style={styles.ghostText}>Sair</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Bio */}
//           {!!perfil?.bio && (
//             <View style={{ marginTop: 12 }}>
//               <Text style={styles.sectionTitle}>Bio</Text>
//               <Text style={styles.bioText}>{perfil.bio}</Text>
//             </View>
//           )}

//           {/* Tags */}
//           {!!(perfil?.tags && perfil.tags.length) && (
//             <View style={{ marginTop: 16 }}>
//               <Text style={styles.sectionTitle}>Interesses</Text>
//               <View style={styles.tagsWrap}>
//                 {perfil.tags.map((t, i) => (
//                   <Tag key={`t-${i}`} name={t} type="suggested" />
//                 ))}
//               </View>
//             </View>
//           )}

//           {/* Stats */}
//           <View style={[styles.statsCard, { marginTop: 16 }]}>
//             <Stat label="Posts" value={perfil?.stats?.posts ?? 0} />
//             <Stat label="Respostas" value={perfil?.stats?.respostas ?? 0} />
//             <Stat label="Workshops" value={perfil?.stats?.workshops ?? 0} />
//             <Stat label="Seguidores" value={perfil?.stats?.seguidores ?? 0} />
//             <Stat label="Seguindo" value={perfil?.stats?.seguindo ?? 0} />
//           </View>
//         </View>

//         {/* Atividades recentes (placeholder) */}
//         <View style={styles.card}>
//           <Text style={styles.sectionTitle}>Atividades recentes</Text>
//           <View style={{ gap: 10, marginTop: 8 }}>
//             <ActivityItem
//               icon="message-square"
//               title="Comentou em um post"
//               subtitle="“Gostei muito do conteúdo!”"
//               when="há 2 dias"
//             />
//             <ActivityItem
//               icon="bookmark"
//               title="Favoritou um post"
//               subtitle="Clean Architecture na prática"
//               when="há 4 dias"
//             />
//             <ActivityItem
//               icon="users"
//               title="Inscreveu-se em um workshop"
//               subtitle="APIs com Node.js e Express"
//               when="há 1 semana"
//             />
//           </View>
//         </View>
//       </ScrollView>

//       {/* Modal de Edição */}
//       <Modal
//         transparent
//         visible={editOpen}
//         animationType="fade"
//         onRequestClose={() => setEditOpen(false)}
//       >
//         <View style={styles.backdrop}>
//           <View style={styles.modalCard}>
//             <Text style={styles.modalTitle}>Editar Perfil</Text>

//             <Text style={styles.modalLabel}>Nome</Text>
//             <AppInput value={editNome} onChangeText={setEditNome} placeholder="Seu nome" />

//             <Text style={styles.modalLabel}>Bio</Text>
//             <AppInput
//               value={editBio}
//               onChangeText={setEditBio}
//               placeholder="Conte um pouco sobre você"
//               multiline
//               style={{ height: 100, textAlignVertical: 'top' }}
//             />

//             <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
//               <TouchableOpacity onPress={() => setEditOpen(false)} style={styles.ghostBtn}>
//                 <Feather name="x" size={16} color="#C9C9D4" />
//                 <Text style={styles.ghostText}>Cancelar</Text>
//               </TouchableOpacity>

//               <TouchableOpacity onPress={saveEdit} style={{ flex: 1 }}>
//                 <LinearGradient colors={['#00FFA3', '#7C73FF']} style={styles.primaryBtn}>
//                   <Feather name="save" size={16} color="#0B0B0E" />
//                   <Text style={styles.primaryText}>Salvar</Text>
//                 </LinearGradient>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </AppLayout>
//   );
// }

// function Stat({ label, value }: { label: string; value: number }) {
//   return (
//     <View style={styles.statItem}>
//       <Text style={styles.statValue}>{value}</Text>
//       <Text style={styles.statLabel}>{label}</Text>
//     </View>
//   );
// }

// function ActivityItem({
//   icon,
//   title,
//   subtitle,
//   when,
// }: {
//   icon: keyof typeof Feather.glyphMap;
//   title: string;
//   subtitle?: string;
//   when?: string;
// }) {
//   return (
//     <View style={styles.activityItem}>
//       <View style={styles.activityIcon}>
//         <Feather name={icon} size={16} color="#0B0B0E" />
//       </View>
//       <View style={{ flex: 1 }}>
//         <Text style={styles.activityTitle}>{title}</Text>
//         {subtitle ? <Text style={styles.activitySub}>{subtitle}</Text> : null}
//       </View>
//       {when ? <Text style={styles.activityWhen}>{when}</Text> : null}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: 'rgb(17, 17, 17)' },

//   cover: {
//     borderRadius: 0,
//     paddingHorizontal: 16,
//     paddingTop: 18,
//     paddingBottom: 80,
//   },
//   avatarWrap: { alignItems: 'center', marginTop: 4 },
//   avatar: {
//     width: 84,
//     height: 84,
//     borderRadius: 42,
//     borderWidth: 3,
//     borderColor: '#0B0B0E',
//     backgroundColor: '#0B0B0E',
//   },
//   avatarFallback: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   avatarInitials: { color: '#fff', fontWeight: '800', fontSize: 28 },

//   identity: { alignItems: 'center', marginTop: 10 },
//   name: { color: '#0B0B0E', fontWeight: '900', fontSize: 20, letterSpacing: 0.2 },
//   userRow: {
//     marginTop: 4,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     backgroundColor: 'rgba(11,11,14,0.1)',
//     borderRadius: 999,
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//   },
//   username: { color: '#0B0B0E', fontWeight: '700', fontSize: 12 },

//   badgesRow: {
//     marginTop: 12,
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 10,
//   },
//   pill: {
//     backgroundColor: 'rgba(11,11,14,0.2)',
//     borderRadius: 999,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   pillText: { color: '#0B0B0E', fontWeight: '800', fontSize: 12 },

//   card: {
//     backgroundColor: '#1A1A1A',
//     borderRadius: 16,
//     padding: 16,
//     marginHorizontal: 16,
//     marginTop: -50,
//     borderWidth: 1,
//     borderColor: '#2A2A33',
//   },

//   actionsRow: { flexDirection: 'row', gap: 10 },
//   primaryBtn: {
//     borderRadius: 12,
//     paddingVertical: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexDirection: 'row',
//     gap: 8,
//   },
//   primaryText: { color: '#0B0B0E', fontWeight: '800' },
//   ghostBtn: {
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#2A2A33',
//     backgroundColor: '#15151A',
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   ghostText: { color: '#C9C9D4', fontWeight: '700' },

//   sectionTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
//   bioText: { color: '#D8D8E3', marginTop: 6, lineHeight: 18 },

//   tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },

//   statsCard: {
//     backgroundColor: '#17171C',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#2A2A33',
//     padding: 12,
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   statItem: { width: '48%', marginVertical: 6 },
//   statValue: { color: '#EDEDF5', fontSize: 18, fontWeight: '900' },
//   statLabel: { color: '#A9A9B2' },

//   activityItem: {
//     backgroundColor: '#17171C',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#2A2A33',
//     padding: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   activityIcon: {
//     backgroundColor: '#00FFA3',
//     borderRadius: 999,
//     padding: 8,
//   },
//   activityTitle: { color: '#EDEDF5', fontWeight: '800' },
//   activitySub: { color: '#BDBDCC', marginTop: 2 },
//   activityWhen: { color: '#A9A9B2', fontSize: 12 },
//   backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 16, justifyContent: 'center' },
//   modalCard: {
//     backgroundColor: '#1A1A1A',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: '#2A2A33',
//     padding: 16,
//   },
//   modalTitle: { color: '#fff', fontWeight: '900', fontSize: 18, marginBottom: 10 },
//   modalLabel: { color: '#C9C9D4', marginTop: 10, marginBottom: 6 },
// });

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import Tag from '../components/Tag';

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
  const v = s.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toUpperCase();
  return fallback;
}

export default function ProfileOverviewScreen() {
  // MOCK visual
  const [profile] = useState({
    nome: 'Matheus Toscano',
    email: 'matheus.toscano@example.com',
    bio: 'Dev mobile & web. Curto Flutter, React Native e arquitetura limpa. Entusiasta de DX.',
    avatarUrl: '',
    nivel: 18,
    tokens: 2300,
    tags: ['React', 'TypeScript', 'Node.js', 'React Native', 'Clean Architecture'],
    stats: { posts: 12, respostas: 48, workshops: 3, seguidores: 120, seguindo: 85 },
  });

  // ====== ESTADO DO FUNDO EDITÁVEL ======
  const [colorA, setColorA] = useState<string>(TOKENS.gradientA);
  const [colorB, setColorB] = useState<string>(TOKENS.gradientB);
  const [opacityPct, setOpacityPct] = useState<number>(100); // 0..100
  const opacity = Math.max(0, Math.min(100, opacityPct)) / 100;

  const [editBgOpen, setEditBgOpen] = useState(false);
  const [draftA, setDraftA] = useState(colorA);
  const [draftB, setDraftB] = useState(colorB);
  const [draftPct, setDraftPct] = useState(String(opacityPct));

  const previewA = withOpacity(draftA, Math.max(0, Math.min(100, Number(draftPct) || 0)) / 100);
  const previewB = withOpacity(draftB, Math.max(0, Math.min(100, Number(draftPct) || 0)) / 100);

  const initials = useMemo(() => {
    const parts = (profile.nome || '').trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase?.() || '').join('');
  }, [profile.nome]);

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

  return (
    <AppLayout initialActivePage="Perfil">
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* CAPA / HERO */}
        <LinearGradient
          colors={[withOpacity(colorA, opacity), withOpacity(colorB, opacity)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cover}
        >
          {/* Botão lápis (editar fundo) */}
          <TouchableOpacity style={styles.editFab} onPress={openBgEditor} activeOpacity={0.85}>
            <Feather name="edit-2" size={16} color="#0B0B0E" />
          </TouchableOpacity>

          {/* Avatar central */}
          <View style={styles.avatarWrap}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{initials || 'U'}</Text>
              </View>
            )}
          </View>

          {/* Nome + username pill */}
          <View style={styles.identity}>
            <Text style={styles.name}>{profile.nome}</Text>
            <View style={styles.usernamePill}>
              <Feather name="at-sign" size={14} color="#0B0B0E" />
              <Text style={styles.usernameText}>{profile.email}</Text>
            </View>
          </View>

          {/* Badges */}
          <View style={styles.badgesRow}>
            <View style={styles.badgePill}>
              <Feather name="bar-chart-2" size={14} color="#0B0B0E" />
              <Text style={styles.badgeText}>Nvl. {profile.nivel}</Text>
            </View>
            <View style={styles.badgePill}>
              <Feather name="award" size={14} color="#0B0B0E" />
              <Text style={styles.badgeText}>{profile.tokens} tokens</Text>
            </View>
          </View>
        </LinearGradient>

        {/* CARD PRINCIPAL */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Visão geral</Text>
            <View style={styles.iconGhostBtn}>
              <Feather name="share-2" size={16} color="#C9C9D4" />
              <Text style={styles.iconGhostText}>Compartilhar</Text>
            </View>
          </View>

          {/* Bio */}
          <View style={{ marginTop: 10 }}>
            <Text style={styles.subSectionTitle}>Bio</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>

          {/* Interesses */}
          <View style={{ marginTop: 16 }}>
            <Text style={styles.subSectionTitle}>Áreas de Interesse</Text>
            <View style={styles.tagsWrap}>
              {profile.tags.map((t, i) => (
                <Tag key={`t-${i}`} name={t} type="suggested" />
              ))}
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.statsCard, { marginTop: 16 }]}>
            <Stat label="Posts" value={profile.stats.posts} />
            <Stat label="Comentários" value={profile.stats.respostas} />
            <Stat label="Workshops" value={profile.stats.workshops} />
            <Stat label="Seguidores" value={profile.stats.seguidores} />
            <Stat label="Seguindo" value={profile.stats.seguindo} />
          </View>
        </View>

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

      {/* ======= MODAL: EDITAR FUNDO ======= */}
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
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
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
  container: { flex: 1, backgroundColor: 'rgb(17, 17, 17)' },

  cover: {
    paddingHorizontal: 16,
    paddingTop: TOKENS.coverPaddingTop,
    paddingBottom: TOKENS.coverPaddingBottom,
  },
  editFab: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
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

  badgesRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
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

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },

  statsCard: {
    backgroundColor: TOKENS.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: { width: '48%', marginVertical: 8 },
  statValue: { color: TOKENS.txtPrimary, fontSize: 18, fontWeight: '900' },
  statLabel: { color: TOKENS.txtMuted },

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

  // Modal
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
  previewBox: {
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
  },
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
