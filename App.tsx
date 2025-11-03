import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import AuthScreen from './src/screens/AuthScreen';
import { FilterButton } from './src/components/FilterButton';
import { OpenFilterButton } from './src/components/OpenFilterButton';
import { FilterSection } from './src/components/FilterSection';

import { PostCard } from './src/components/PostCard';
import { PostDetails } from './src/components/PostDetails';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* <PostDetails /> */}
          {/* <PostCard /> */}
          {/* <CreatePostScreen /> */}
          {/* <RegisterScreen /> */}
          {/* <LoginScreen /> */}
          {/* <AuthScreen /> */}
          {/* <FilterSection /> */}
        </ScrollView>
      </View>
    </SafeAreaProvider>
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
