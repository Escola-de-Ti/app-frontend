import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import AuthScreen from './src/screens/AuthScreen';
import { FilterButton } from './src/components/FilterButton';
import { OpenFilterButton } from './src/components/OpenFilterButton';
import { FilterSection } from './src/components/FilterSection';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleLogin() {
    if (email === 'teste@teste.com' && password === '1234') {
      Alert.alert('Sucesso', 'Login realizado!');
    } else {
      Alert.alert('Error', 'Credenciais inválidas');
    }
  }

  return (
    <SafeAreaProvider>
      {/* <CreatePostScreen /> */}
      {/* <RegisterScreen /> */}
      {/* <LoginScreen /> */}
      {/* <CreatePostScreen /> */}
      {/* <FilterSection /> */}
      {/*<OpenFilterButton />*/}
      <AuthScreen />
    </SafeAreaProvider>
  );
}
