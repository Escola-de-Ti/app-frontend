// src/components/TagManager.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import AppInput from './AppInput';
import Tag from './Tag';

interface TagManagerProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

const suggestedTags = [
  'React',
  'JavaScript',
  'TypeScript',
  'Python',
  'React Native',
  'Clean Architecture',
  'Node.js',
];

export default function TagManager({ tags, onChange }: TagManagerProps) {
  const [tag, setTag] = useState('');

  const addTag = () => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      onChange([...tags, tag.trim()]);
      setTag('');
    }
  };

  const removeTag = (t: string) => {
    onChange(tags.filter((tag) => tag !== t));
  };

  const handleSuggested = (t: string) => {
    if (!tags.includes(t)) onChange([...tags, t]);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}># Tags</Text>

      {/* Input + Botão */}
      <View style={styles.tagInputRow}>
        <AppInput placeholder="Digite sua tag..." value={tag} onChangeText={setTag} />
        <TouchableOpacity onPress={addTag} style={styles.addTagButton}>
          <Text style={styles.addTagText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {/* Tags criadas */}
      <View style={styles.tagList}>
        {tags.map((t, i) => (
          <Tag key={i} name={`${t} ✕`} type="added" onPress={() => removeTag(t)} />
        ))}
      </View>

      {/* Tags sugeridas */}
      <Text style={styles.label}>Tags sugeridas:</Text>
      <View style={styles.tagList}>
        {suggestedTags.map((t, i) => (
          <Tag key={i} name={t} type="suggested" onPress={() => handleSuggested(t)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#121212',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 8,
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addTagButton: {
    backgroundColor: '#8f00ff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 8,
  },
  addTagText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  label: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 10,
  },
});
