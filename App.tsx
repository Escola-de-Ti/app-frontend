import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Alert } from 'react-native';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import AuthScreen from './src/screens/AuthScreen';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleLogin() {
    if (email === 'teste@teste.com' && password === '1234') {
      Alert.alert('Sucesso', 'Login realizado!');
    } else {
      Alert.alert('Erro', 'Credenciais inválidas');
    }
  }

  // return <RegisterScreen />;
  // return <LoginScreen />;
  // return <CreatePostScreen />;
  return <AuthScreen />;
}
