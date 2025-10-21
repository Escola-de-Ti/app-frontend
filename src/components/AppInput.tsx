import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

export default function AppInput(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={props.placeholderTextColor || '#777'}
      style={[styles.input, props.style]} // permite sobrescrever estilos
    />
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    backgroundColor: '#121212',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 8,
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
});
