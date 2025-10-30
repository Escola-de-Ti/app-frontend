import React from 'react';
import { Animated, View, TouchableOpacity, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface FooterProps {
  translateY?: any;
  activePage: 'Feed' | 'Workshops' | 'Ranking' | 'Perfil';
  onChangePage: (page: 'Feed' | 'Workshops' | 'Ranking' | 'Perfil') => void;
}

export default function Footer({ translateY, activePage, onChangePage }: FooterProps) {
  const getColor = (page: string) => (activePage === page ? '#00FFA3' : '#fff');

  return (
    <Animated.View
      style={{
        height: 70,
        backgroundColor: '#111',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#222',
        transform: [{ translateY: translateY || 0 }],
      }}
    >
      <TouchableOpacity onPress={() => onChangePage('Feed')}>
        <View style={{ alignItems: 'center' }}>
          <Feather name="home" size={22} color={getColor('Feed')} />
          <Text style={{ color: getColor('Feed'), fontSize: 10 }}>Feed</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onChangePage('Workshops')}>
        <View style={{ alignItems: 'center' }}>
          <Feather name="book-open" size={22} color={getColor('Workshops')} />
          <Text style={{ color: getColor('Workshops'), fontSize: 10 }}>Workshops</Text>
        </View>
      </TouchableOpacity>

      <LinearGradient
        colors={['#00FFA3', '#7C73FF']}
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name="plus" size={28} color="#fff" />
      </LinearGradient>

      <TouchableOpacity onPress={() => onChangePage('Ranking')}>
        <View style={{ alignItems: 'center' }}>
          <Feather name="award" size={22} color={getColor('Ranking')} />
          <Text style={{ color: getColor('Ranking'), fontSize: 10 }}>Ranking</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onChangePage('Perfil')}>
        <View style={{ alignItems: 'center' }}>
          <Feather name="user" size={22} color={getColor('Perfil')} />
          <Text style={{ color: getColor('Perfil'), fontSize: 10 }}>Perfil</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
