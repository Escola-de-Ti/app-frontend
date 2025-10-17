// src/components/Tag.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TagProps {
  name: string;
  onPress?: () => void;
}

export default function Tag({ name, onPress }: TagProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient colors={['#0ff', '#8f00ff']} start={[0, 0]} end={[1, 1]} style={styles.tag}>
        <Text style={styles.text}>{name}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 6,
  },
  text: {
    color: '#fff',
    fontSize: 14,
  },
});
