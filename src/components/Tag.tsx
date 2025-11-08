import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, GestureResponderEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type TagKind = 'added' | 'suggested';

interface TagProps {
  name: string;
  type?: TagKind; // 'added' | 'suggested'
  removable?: boolean; // mostra o "✕" (visual) sem alterar o name enviado
  active?: boolean; // para sugeridas já ativas (fica com visual de "added")
  onPress?: (e: GestureResponderEvent) => void;
  testID?: string;
}

export default function Tag({
  name,
  type = 'added',
  removable = false,
  active = false,
  onPress,
  testID,
}: TagProps) {
  // se for sugerida e estiver ativa, pinta como "added"
  const visualType: TagKind = type === 'suggested' && active ? 'added' : type;

  const gradientColors =
    visualType === 'added'
      ? (['rgba(0,255,255,0.5)', 'rgba(143,0,255,0.5)'] as const)
      : (['rgba(0,255,170,0.5)', 'rgba(0,255,204,0.5)'] as const);

  const borderColor = gradientColors[1];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityRole="button"
      accessibilityLabel={`Tag ${name}${removable ? ', remover' : ''}`}
      testID={testID}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderColor }]}
      >
        <View style={styles.inner}>
          <Text style={styles.text}>
            {name}
            {removable ? '  ✕' : ''}
          </Text>
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
