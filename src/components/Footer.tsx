import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Footer() {
  return (
    <View
      style={{
        height: 70,
        backgroundColor: '#111',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#222',
        paddingBottom: 10,
      }}
    >
      <TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Feather name="home" size={22} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 10 }}>Feed</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Feather name="book-open" size={22} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 10 }}>Workshops</Text>
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

      <TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Feather name="award" size={22} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 10 }}>Ranking</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Feather name="user" size={22} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 10 }}>Perfil</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
