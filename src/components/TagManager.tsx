// src/components/TagManager.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AppInput from './AppInput';
import Tag from './Tag';
import { getPopularTags } from '../services/tags';

interface TagManagerProps {
  tags: string[]; // nomes selecionados
  onChange: (tags: string[]) => void;
  maxTags?: number;
  maxLength?: number;
}

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

export default function TagManager({
  tags,
  onChange,
  maxTags = 10,
  maxLength = 30,
}: TagManagerProps) {
  const [input, setInput] = useState('');
  const [popular, setPopular] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await getPopularTags(12);
      if (!mounted) return;
      const names = (list ?? []).map((t) => String(t?.name ?? '').trim()).filter(Boolean);
      setPopular(names);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedSet = useMemo(() => new Set(tags.map(norm)), [tags]);

  const addTag = (raw?: string) => {
    const value = (raw ?? input).trim().replace(/\s+/g, ' ');
    if (!value) return;
    if (value.length > maxLength) {
      Alert.alert('Tag muito grande', `Use no máximo ${maxLength} caracteres.`);
      return;
    }
    if (tags.length >= maxTags) {
      Alert.alert('Limite atingido', `Você pode adicionar até ${maxTags} tags.`);
      return;
    }
    const key = norm(value);
    if (selectedSet.has(key)) {
      setInput('');
      return;
    }
    onChange([...tags, value]);
    setInput('');
  };

  const removeTag = (t: string) => {
    onChange(tags.filter((x) => norm(x) !== norm(t)));
  };

  const togglePopular = (t: string) => {
    const key = norm(t);
    if (selectedSet.has(key)) {
      onChange(tags.filter((x) => norm(x) !== key));
    } else {
      if (tags.length >= maxTags) {
        Alert.alert('Limite atingido', `Você pode adicionar até ${maxTags} tags.`);
        return;
      }
      onChange([...tags, t.trim()]);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}># Tags</Text>
      {/* Input + Botão */}
      <View style={styles.tagInputRow}>
        <View style={styles.inputContainer}>
          <AppInput
            placeholder="Digite sua tag e pressione Enter..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => addTag()}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity onPress={() => addTag()} style={styles.addTagButton}>
          <Text style={styles.addTagText}>Adicionar</Text>
        </TouchableOpacity>
      </View>
      {/* Selecionadas */}
      <View style={styles.tagList}>
        {tags.map((t, i) => (
          <Tag key={`sel-${i}-${t}`} name={t} type="added" removable onPress={() => removeTag(t)} />
        ))}
      </View>
      {/* Populares */}
      {!!popular.length && <Text style={styles.label}>Populares:</Text>}
      <View style={styles.tagList}>
        {popular.map((t, i) => (
          <Tag
            key={`pop-${i}-${t}`}
            name={t}
            type="suggested"
            active={selectedSet.has(norm(t))}
            onPress={() => togglePopular(t)}
          />
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
  inputContainer: {
    flex: 1,
  },
  addTagButton: {
    backgroundColor: '#8f00ff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 8,
    flexShrink: 0,
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
