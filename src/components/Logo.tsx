import React from 'react';
import { View, StyleSheet } from 'react-native';
import LogoWithNameSvg from '../../assets/images/LogoWithName.svg';

export default function Logo() {
  return (
    <View style={styles.container}>
      <LogoWithNameSvg width={300} height={160} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    alignItems: 'center',
  },
});
