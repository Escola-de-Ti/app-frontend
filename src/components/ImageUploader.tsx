import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

interface ImageUploaderProps {
  onChange: (uris: string[]) => void;
}

export default function ImageUploader({ onChange }: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>([]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para escolher imagens.');
      return;
    }

    if (images.length >= 4) {
      Alert.alert('Limite atingido', 'Você pode adicionar no máximo 4 imagens.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,

      allowsMultipleSelection: true,
      selectionLimit: 4 - images.length,
      quality: 0.7,
    });

    if (!result.canceled) {
      const selectedUris = result.assets.map((asset) => asset.uri);
      const newImages = [...images, ...selectedUris].slice(0, 4);
      setImages(newImages);
      onChange(newImages);
    }
  };

  const removeImage = (uri: string) => {
    const filtered = images.filter((img) => img !== uri);
    setImages(filtered);
    onChange(filtered);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Imagens (máx. 4)</Text>

      <TouchableOpacity style={styles.uploadBox} onPress={pickImage} activeOpacity={0.8}>
        <Feather name="upload" size={32} color="#999" />
        <Text style={styles.text}>Clique para adicionar imagens</Text>
      </TouchableOpacity>

      <View style={styles.previewContainer}>
        {images.map((uri) =>
          React.createElement(
            View,
            { key: uri, style: styles.previewWrapper },
            <>
              <Image source={{ uri }} style={styles.preview} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(uri)}
                activeOpacity={0.8}
              >
                <Feather name="x" size={14} color="#fff" />
              </TouchableOpacity>
            </>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  label: { color: '#fff', fontWeight: 'bold', marginBottom: 8, fontSize: 16 },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#555',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { color: '#aaa', marginTop: 6 },
  previewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 10,
  },
  previewWrapper: {
    position: 'relative',
  },
  preview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 3,
  },
});
