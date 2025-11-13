import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  onSearch?: (t: string) => void;
  onDebouncedChange?: (t: string) => void; // opcional: útil p/ buscar no back
  loading?: boolean;
  placeholder?: string;
  debounceMs?: number;
  inputProps?: TextInputProps; // passa props extras pro TextInput
};

export default function InputFilterFeed({
  value,
  onChangeText,
  onSearch,
  onDebouncedChange,
  loading,
  placeholder = 'Buscar posts e usuários…',
  debounceMs = 280,
  inputProps,
}: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // debounced callback (opcional)
  useEffect(() => {
    if (!onDebouncedChange) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onDebouncedChange(value), debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, onDebouncedChange, debounceMs]);

  const showClear = useMemo(() => !!value?.length && !loading, [value, loading]);

  return (
    <View style={styles.wrap}>
      <Feather name="search" size={16} color="#9AA0A6" style={styles.leftIcon} />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#777"
        returnKeyType="search"
        onSubmitEditing={() => onSearch?.(value)}
        style={styles.input}
        autoCapitalize="none"
        {...inputProps}
      />

      {loading ? (
        <ActivityIndicator style={styles.rightIcon} />
      ) : showClear ? (
        <TouchableOpacity
          style={styles.rightIcon}
          onPress={() => onChangeText('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="x" size={16} color="#9AA0A6" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    backgroundColor: '#1A1A1F',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  input: {
    color: '#EDEDF5',
    paddingVertical: 10,
    paddingLeft: 36, // espaço pro ícone
    paddingRight: 32, // espaço pro clear/loader
    fontSize: 14,
  },
  leftIcon: { position: 'absolute', left: 10, top: 11 },
  rightIcon: { position: 'absolute', right: 8, top: 8 },
});
