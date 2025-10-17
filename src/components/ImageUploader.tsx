// src/components/ImageUploader.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

interface ImageUploaderProps {
  onChange: (uri: string[]) => void;
}

export default function ImageUploader({ onChange }: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>([]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permissão para acessar a galeria é necessária!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const selectedUris = result.assets.map((asset) => asset.uri);
      const newImages = [...images, ...selectedUris];
      setImages(newImages);
      onChange(newImages);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Imagens (opcional)</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
        <Feather name="upload" size={32} color="#999" />
        <Text style={styles.text}>Clique para adicionar imagens</Text>
      </TouchableOpacity>

      <View style={styles.previewContainer}>
        {images.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.preview} />
        ))}
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
    gap: 8,
  },
  preview: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
});
