import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import AuthScreen from './src/screens/AuthScreen';
import CreateWorkshopScreen from './src/screens/CreateWorkshopScreen';
import WorkshopScreen from './src/screens/WorkshopsScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RankingScreen from './src/screens/RankingScreen';
import TransactionHistoryScreen from 'src/screens/TransactionHistoryScreen';

const Stack = createNativeStackNavigator();

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // opcional: splash/loader
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // Telas privadas
          <>
            <Stack.Screen name="FeedScreen" component={FeedScreen} />
            <Stack.Screen name="CreatePost" component={CreatePostScreen} />
            <Stack.Screen name="CreateWorkshopScreen" component={CreateWorkshopScreen} />
            <Stack.Screen name="WorkshopScreen" component={WorkshopScreen} />
            <Stack.Screen name="RankingScreen" component={RankingScreen} />
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
            <Stack.Screen name="TransactionHistoryScreen" component={TransactionHistoryScreen} />
          </>
        ) : (
          // Telas públicas
          <>
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
      <Toast />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0f',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
});
