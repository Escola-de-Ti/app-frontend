// src/components/filters/FilterButton.tsx
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
  /** Filtro atualmente ativo (ex.: 'Mais votados') */
  activeFilter?: string | null;
};

type FilterIcon =
  | 'activity'
  | 'thumbs-up'
  | 'thumbs-down'
  | 'clock'
  | 'rotate-ccw'
  | 'message-circle';

type FilterDef = {
  label:
    | 'Relevância'
    | 'Mais votados'
    | 'Menos votados'
    | 'Mais recentes'
    | 'Mais antigos'
    | 'Mais comentados';
  icon: FilterIcon;
};

const FILTERS: FilterDef[] = [
  { label: 'Relevância', icon: 'activity' },
  { label: 'Mais votados', icon: 'thumbs-up' },
  { label: 'Menos votados', icon: 'thumbs-down' },
  { label: 'Mais recentes', icon: 'clock' },
  { label: 'Mais antigos', icon: 'rotate-ccw' },
  { label: 'Mais comentados', icon: 'message-circle' },
];

export function FilterButton({ size = 20, onSelectFilter, activeFilter }: FilterButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [buttonHeight, setButtonHeight] = useState(0);

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
        onPress={() => setIsMenuOpen((prev) => !prev)}
        onLayout={onButtonLayout}
      >
        <LinearGradient
          colors={['#ff00cc', '#7928ca', '#0066ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientBorder, activeFilter && styles.gradientBorderActive]}
        >
          <View style={styles.innerCircle}>
            <Feather name="sliders" size={size} color="#ff8ce6" />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {isMenuOpen && (
        <View style={[styles.dropdown, { top: buttonHeight + 8 }]}>
          {FILTERS.map(({ label, icon }) => {
            const isActive = activeFilter === label;

            return (
              <TouchableOpacity
                key={label}
                style={[styles.option, isActive && styles.optionActive]}
                onPress={() => handleSelectFilter(label)}
              >
                <View style={styles.optionContent}>
                  <Feather
                    name={icon}
                    size={16}
                    color={isActive ? '#ff8ce6' : '#ffffff'}
                    style={styles.optionIcon}
                  />
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                    {label}
                  </Text>
                  {isActive && (
                    <Feather name="check" size={16} color="#ff8ce6" style={styles.checkIcon} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'flex-end',
    // garante que o container do botão já tenha prioridade na pilha
    zIndex: 20,
  },
  gradientBorder: {
    width: 52, // menor
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7928ca',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    ...Platform.select({
      android: { elevation: 6 },
    }),
  },
  gradientBorderActive: {
    shadowOpacity: 0.9,
    shadowRadius: 12,
  },
  innerCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
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
    width: 220,
    shadowColor: '#7928ca',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    zIndex: 999, // 🔝 fica acima dos cards do FlatList
    ...Platform.select({
      android: { elevation: 20 }, // 🔝 importante no Android
    }),
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionActive: {
    backgroundColor: '#181528',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 8,
  },
  optionText: {
    color: '#fff',
    fontSize: 15,
  },
  optionTextActive: {
    fontWeight: '700',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
});

export default FilterButton;
