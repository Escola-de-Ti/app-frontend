import React from 'react';
import { View, StyleSheet } from 'react-native';
import LogoSvg from '../../assets/images/Logo.svg';

export default function Logo() {
  return (
    <View style={styles.container}>
      <LogoSvg width={30} height={80} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    alignItems: 'center',
  },
});
