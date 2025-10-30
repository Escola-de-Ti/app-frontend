import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TagProps {
  key?: string | number;
  name: string;
  type?: 'added' | 'suggested';
  onPress?: () => void;
}

export default function Tag({ name, type = 'added', onPress }: TagProps) {
  const gradientColors =
    type === 'added'
      ? (['rgba(0,255,255,0.5)', 'rgba(143,0,255,0.5)'] as const)
      : (['rgba(0,255,170,0.5)', 'rgba(0,255,204,0.5)'] as const);

  const borderColor = gradientColors[1];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.5}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderColor }]}
      >
        {/* camada interna com o fundo translúcido */}
        <View style={styles.inner}>
          <Text style={styles.text}>{name}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 6,
    overflow: 'hidden',
  },
  inner: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  text: {
    color: '#fff',
    fontSize: 14,
  },
});
