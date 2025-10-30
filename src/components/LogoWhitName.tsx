import React from 'react';
import { View, StyleSheet } from 'react-native';
import LogoWithNameSvg from '../../assets/images/LogoWithName.svg';

export default function Logo() {
  return (
    <View style={styles.container}>
      <LogoWithNameSvg width={300} height={100} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    alignItems: 'center',
  },
});
