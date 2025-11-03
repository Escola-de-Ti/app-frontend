import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Platform,
  Text,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

type FilterButtonProps = {
  size?: number;
  onSelectFilter: (filter: string) => void;
};

export function FilterButton({ size = 25, onSelectFilter }: FilterButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [buttonHeight, setButtonHeight] = useState(0);

  const filters = ['Mais votados', 'Mais recentes', 'Mais comentados'];

  const onButtonLayout = (event: LayoutChangeEvent) => {
    setButtonHeight(event.nativeEvent.layout.height);
  };

  const handleSelectFilter = (filter: string) => {
    onSelectFilter(filter);
    setIsMenuOpen(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsMenuOpen(!isMenuOpen)}
        onLayout={onButtonLayout}
      >
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

      {isMenuOpen && (
        <View style={[styles.dropdown, { top: buttonHeight + 10 }]}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={styles.option}
              onPress={() => handleSelectFilter(filter)}
            >
              <Text style={styles.optionText}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'flex-end',
  },
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
      android: { elevation: 12 },
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
  dropdown: {
    position: 'absolute',
    right: 0,
    backgroundColor: '#0b0b0f',
    borderRadius: 12,
    paddingVertical: 8,
    width: 180,
    shadowColor: '#7928ca',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    ...Platform.select({
      android: { elevation: 10 },
    }),
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
});
