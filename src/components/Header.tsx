import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Logo from './Logo';

export default function Header() {
  return (
    <View
      style={{
        height: 80,
        backgroundColor: '#111',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
      }}
    >
      <Logo />
      <TouchableOpacity>
        <Feather name="bell" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
