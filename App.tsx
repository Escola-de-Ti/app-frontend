import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PostCard } from './src/components/posts/PostCard';
import { PostDetails } from './src/components/posts/PostDetails';
import { TransactionHistory } from './src/screens/TransactionHistory';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <TransactionHistory />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <PostCard />
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
