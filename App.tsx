import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import AuthScreen from './src/screens/AuthScreen';
import CreateWorkshopScreen from './src/screens/CreateWorkshopScreen';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // opcional: sua Splash/Loader
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            {/* telas privadas */}
            <Stack.Screen name="CreatePostScreen" component={CreatePostScreen} />
            {/* adicione outras privadas aqui */}
          </>
        ) : (
          <>
            {/* telas públicas */}
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
