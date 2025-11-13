import React from 'react';
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
  onSearch: (q: string) => void;
  loading?: boolean;
  placeholder?: string;
} & Omit<TextInputProps, 'onChangeText' | 'placeholder' | 'value'>;

export default function FilterInputWorkshop({
  value,
  onChangeText,
  onSearch,
  loading,
  placeholder = 'Buscar workshops…',
  ...inputProps
}: Props) {
  const doSearch = () => onSearch(value.trim());

  return (
    <View style={styles.wrapper}>
      <Feather name="search" size={16} color="#9aa0a6" style={styles.leftIcon} />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#7a7f86"
        style={styles.input}
        returnKeyType="search"
        onSubmitEditing={doSearch}
        {...inputProps}
      />

      {loading ? (
        <ActivityIndicator size="small" color="#7C73FF" style={styles.rightAddon} />
      ) : value ? (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          hitSlop={{ top: 6, left: 6, right: 6, bottom: 6 }}
        >
          <Feather name="x" size={18} color="#9aa0a6" style={styles.rightAddon} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={doSearch} hitSlop={{ top: 6, left: 6, right: 6, bottom: 6 }}>
          <Feather name="arrow-right-circle" size={18} color="#9aa0a6" style={styles.rightAddon} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1F',
    borderColor: '#2A2A33',
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 34,
    paddingRight: 8,
    height: 40,
  },
  input: {
    flex: 1,
    color: '#EDEDF5',
    fontSize: 14,
    paddingVertical: 8,
  },
  leftIcon: {
    position: 'absolute',
    left: 10,
  },
  rightAddon: {
    marginLeft: 8,
  },
});
