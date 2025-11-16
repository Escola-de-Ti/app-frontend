// src/components/Header.tsx
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Logo from './Logo';

export const HEADER_HEIGHT = 56; // use se quiser alinhar paddings em telas

export default function Header() {
  return (
    <View
      style={{
        height: HEADER_HEIGHT, // altura fixa real
        backgroundColor: '#111111', // igual ao background do app
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
      }}
    >
      <Logo />
      {/* <TouchableOpacity>
        <Feather name="bell" size={22} color="#fff" />
      </TouchableOpacity> */}
    </View>
  );
}
