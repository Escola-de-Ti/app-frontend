import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import AuthScreen from './src/screens/AuthScreen';
import CreateWorkshopScreen from './src/screens/CreateWorkshopScreen';
import { AuthProvider } from './src/hooks/useAuth';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/* <CreatePostScreen /> */}
        {/* <RegisterScreen /> */}
        {/* <LoginScreen /> */}
        {/* <CreatePostScreen /> */}
        <AuthScreen />
        {/* <CreateWorkshopScreen /> */}
      </AuthProvider>
    </SafeAreaProvider>
  );
}
