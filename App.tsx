import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Alert } from 'react-native';
import { FilterButton } from './src/components/FilterButton';
import { OpenFilterButton } from './src/components/OpenFilterButton';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/*<FilterButton/>*/}
      <OpenFilterButton />
    </View>
  );
}
