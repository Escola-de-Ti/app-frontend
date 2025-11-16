// src/components/filters/SelectedFilterTag.tsx
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

type SelectedFilterTagProps = {
  filter: string;
  onRemove: () => void;
};

export function SelectedFilterTag({ filter, onRemove }: SelectedFilterTagProps) {
  const iconName = useMemo<keyof typeof Feather.glyphMap>(() => {
    const normalized = filter.toLowerCase();

    if (normalized.includes('votado') || normalized.includes('votos')) return 'thumbs-up';
    if (normalized.includes('recent')) return 'clock';
    if (normalized.includes('coment')) return 'message-circle';

    return 'sliders';
  }, [filter]);

  return (
    <View style={styles.container}>
      <View style={styles.tag}>
        <Feather name={iconName} size={14} color="#fff" style={styles.leftIcon} />
        <Text style={styles.text}>{filter}</Text>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Feather name="x" size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    marginRight: 8,
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5b2eff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#5b2eff',
    shadowOpacity: 0.7,
    shadowRadius: 10,
    ...Platform.select({
      android: { elevation: 4 },
    }),
  },
  leftIcon: {
    marginRight: 6,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 6,
  },
});

export default SelectedFilterTag;
