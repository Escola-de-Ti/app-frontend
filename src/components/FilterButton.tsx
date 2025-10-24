import React, { useState, useRef } from 'react';
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

export function FilterButton({ size = 25 }: { size?: number }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [buttonHeight, setButtonHeight] = useState(0);
  const [filterHeight, setFilterHeight] = useState(0);

  const handleSelectFilter = (filter: string) => {
    setSelectedFilter(filter);
    setIsMenuOpen(false);
  };

  const handleRemoveFilter = () => {
    setSelectedFilter(null);
  };

  const onButtonLayout = (event: LayoutChangeEvent) => {
    setButtonHeight(event.nativeEvent.layout.height);
  };

  const onFilterLayout = (event: LayoutChangeEvent) => {
    setFilterHeight(event.nativeEvent.layout.height);
  };

  return (
    <View style={styles.container}>
      {selectedFilter && (
        <View style={styles.activeFilterContainer} onLayout={onFilterLayout}>
          <View style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>{selectedFilter}</Text>
            <TouchableOpacity onPress={handleRemoveFilter}>
              <Feather name="x" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

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
        <View style={[styles.dropdown, { top: buttonHeight + filterHeight + 10 }]}>
          {['Mais votados', 'Mais recentes', 'Mais comentados'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.option, selectedFilter === filter && styles.optionSelected]}
              onPress={() => handleSelectFilter(filter)}
            >
              <Text
                style={[styles.optionText, selectedFilter === filter && styles.optionTextSelected]}
              >
                {filter}
              </Text>
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

  optionSelected: {
    backgroundColor: '#3b1b99',
    borderRadius: 8,
  },

  optionText: {
    color: '#fff',
    fontSize: 16,
  },

  optionTextSelected: {
    color: '#ff8ce6',
    fontWeight: 'bold',
  },

  activeFilterContainer: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },

  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5b2eff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#5b2eff',
    shadowOpacity: 0.7,
    shadowRadius: 10,
  },

  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 6,
  },
});
