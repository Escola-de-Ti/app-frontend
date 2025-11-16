import React from 'react';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import AuthScreen from './src/screens/AuthScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import CreateWorkshopScreen from './src/screens/CreateWorkshopScreen';
import WorkshopScreen from './src/screens/WorkshopsScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RankingScreen from './src/screens/RankingScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import EditPostScreen from './src/screens/EditPostScreen';
import EditWorkshopScreen from './src/screens/EditWorkshopScreen';

const Stack = createNativeStackNavigator();

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // aqui você pode colocar uma tela de splash/carregando se quiser
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            {/* Telas privadas */}
            <Stack.Screen name="FeedScreen" component={FeedScreen} />
            <Stack.Screen name="CreatePost" component={CreatePostScreen} />
            <Stack.Screen name="CreateWorkshopScreen" component={CreateWorkshopScreen} />
            <Stack.Screen name="WorkshopScreen" component={WorkshopScreen} />
            <Stack.Screen name="RankingScreen" component={RankingScreen} />
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
            <Stack.Screen name="TransactionHistoryScreen" component={TransactionHistoryScreen} />
            <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
            <Stack.Screen name="EditPostScreen" component={EditPostScreen} />
            <Stack.Screen name="EditWorkshopScreen" component={EditWorkshopScreen} />
          </>
        ) : (
          <>
            {/* Telas públicas */}
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Router />
        <Toast />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
