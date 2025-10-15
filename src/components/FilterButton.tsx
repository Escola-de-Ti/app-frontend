import React from 'react';
import { TouchableOpacity, StyleSheet, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

type FilterButtonProps = {
  onPress?: () => void;
  size?: number;
};

export function FilterButton({ onPress, size = 25 }: FilterButtonProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <LinearGradient
        colors={['#ff00cc', '#7928ca', '#0066ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.innerCircle}>
          <Feather name="sliders" size={size} color="#ff8ce6" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradientBorder: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#7928ca',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 15,
    ...Platform.select({
      android: {
        elevation: 12,
      },
    }),
  },

  innerCircle: {
    width: 66,
    height: 66,
    borderRadius: 18,
    backgroundColor: '#0b0b0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
