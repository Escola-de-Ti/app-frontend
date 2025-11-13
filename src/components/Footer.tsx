import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

type Page = 'Feed' | 'Workshops' | 'Ranking' | 'Perfil';

type Props = {
  translateY: Animated.AnimatedInterpolation<number>;
  activePage: Page | null;
  onChangePage: (p: Page | null) => void;
};

const ROUTES = {
  CREATE_POST: 'CreatePost',
  CREATE_WORKSHOP: 'WorkshopScreen',
  FEED: 'FeedScreen',
  RANKING: 'RankingScreen',
  PROFILE: 'ProfileScreen',
};

export default function Footer({ translateY, activePage, onChangePage }: Props) {
  const navigation = useNavigation<any>();

  const goCreatePost = () => {
    navigation.navigate(ROUTES.CREATE_POST);
    onChangePage(null);
  };

  const goWorkshops = () => {
    navigation.navigate(ROUTES.CREATE_WORKSHOP);
    onChangePage('Workshops');
  };

  const goFeed = () => {
    navigation.navigate(ROUTES.FEED);
    onChangePage('Feed');
  };

  const goRanking = () => {
    navigation.navigate(ROUTES.RANKING);
    onChangePage('Ranking');
  };

  const goProfile = () => {
    navigation.navigate(ROUTES.PROFILE);
    onChangePage('Perfil');
  };

  const Item = ({
    isActive,
    icon,
    label,
    onPress,
  }: {
    isActive: boolean;
    icon: keyof typeof Feather.glyphMap;
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Feather name={icon} size={20} color={isActive ? '#00FFA3' : '#aaa'} />
      <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateY }] }]}>
      <Item isActive={activePage === 'Feed'} icon="home" label="Feed" onPress={goFeed} />
      <Item
        isActive={activePage === 'Workshops'}
        icon="calendar"
        label="Workshops"
        onPress={goWorkshops}
      />

      <TouchableOpacity
        style={styles.plusWrap}
        onPress={goCreatePost}
        accessibilityLabel="Criar post"
      >
        <LinearGradient
          colors={['#00FFA3', '#7C73FF']}
          style={styles.plusBtn}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="plus" size={24} color="#0E0E0E" />
        </LinearGradient>
      </TouchableOpacity>

      <Item isActive={activePage === 'Ranking'} icon="award" label="Ranking" onPress={goRanking} />
      <Item isActive={activePage === 'Perfil'} icon="user" label="Perfil" onPress={goProfile} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // 🔥 sem background aqui! Quem pinta é o AppLayout
  wrap: {
    borderTopColor: '#656565',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  item: { alignItems: 'center', gap: 4, paddingVertical: 8, flex: 1 },
  label: { color: '#aaa', fontSize: 12, fontWeight: '600' },
  labelActive: { color: '#00FFA3' },
  plusWrap: { width: 64, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  plusBtn: {
    width: 50,
    height: 50,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00FFA3',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
