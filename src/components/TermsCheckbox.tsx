import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Checkbox from 'expo-checkbox';

type Props = {
  isChecked: boolean;
  setIsChecked: (value: boolean) => void;
};

export default function TermsCheckbox({ isChecked, setIsChecked }: Props) {
  return (
    <View style={styles.checkboxContainer}>
      <Checkbox
        value={isChecked}
        onValueChange={setIsChecked}
        color={isChecked ? '#00ffcc' : undefined}
      />
      <Text style={styles.checkboxText}>
        Li e estou de Acordo com os <Text style={styles.link}>Termos de privacidade</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  checkboxText: {
    color: '#fff',
    fontSize: 12,
    flexShrink: 1,
    marginLeft: 8,
  },
  link: {
    color: '#7a5cff',
    textDecorationLine: 'underline',
  },
});
