import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

type SelectedFilterTagProps = {
  filter: string;
  onRemove: () => void;
};

export function SelectedFilterTag({ filter, onRemove }: SelectedFilterTagProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tag}>
        <Text style={styles.text}>{filter}</Text>
        <TouchableOpacity onPress={onRemove}>
          <Feather name="x" size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
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
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 6,
  },
});
