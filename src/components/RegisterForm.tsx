import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

export default function RegisterForm() {
  return (
    <>
      <TextInput placeholder="Nome de Usuário *" placeholderTextColor="#ccc" style={styles.input} />
      <TextInput
        placeholder="CPF *"
        placeholderTextColor="#ccc"
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="E-mail *"
        placeholderTextColor="#ccc"
        style={styles.input}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Telefone (opcional)"
        placeholderTextColor="#ccc"
        style={styles.input}
        keyboardType="phone-pad"
      />
      <TextInput
        placeholder="Senha *"
        placeholderTextColor="#ccc"
        style={styles.input}
        secureTextEntry
      />
      <TextInput
        placeholder="Confirmar Senha *"
        placeholderTextColor="#ccc"
        style={styles.input}
        secureTextEntry
      />
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
});
