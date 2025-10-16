import React from 'react';
import { TouchableOpacity, StyleSheet, View, Platform, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

type OpenFilterButtonProps = {
  onPress?: () => void;
};

export function OpenFilterButton({ onPress }: OpenFilterButtonProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <LinearGradient
        colors={['#ff00cc', '#7928ca', '#0066ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.innerContent}>
          <Feather name="sliders" size={22} color="#ff8ce6" />
          <Text style={styles.text}>Filtros</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradientBorder: {
    width: 160,
    height: 55,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#7928ca',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    ...Platform.select({
      android: {
        elevation: 10,
      },
    }),
  },

  innerContent: {
    width: 156,
    height: 51,
    borderRadius: 13,
    backgroundColor: '#0b0b0f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  text: {
    color: '#c68cff',
    fontSize: 18,
    fontWeight: '600',
  },
});
