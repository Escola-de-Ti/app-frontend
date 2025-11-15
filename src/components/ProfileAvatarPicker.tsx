// === src/components/ProfileAvatarPicker.tsx ===
import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Alert, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

export interface ProfileAvatarPickerProps {
  /** URI atual da foto de perfil (http:// ou file://) */
  uri?: string | null;
  /** Callback disparado quando o usuário escolhe outra imagem (ou remove) */
  onChange: (uri: string | null) => void;
  /** Tamanho do avatar em px (largura/altura) */
  size?: number;
  /** Opcional: rótulo abaixo do avatar */
  label?: string;
}

export default function ProfileAvatarPicker({
  uri,
  onChange,
  size = 96,
  label,
}: ProfileAvatarPickerProps) {
  const [currentUri, setCurrentUri] = useState<string | null>(uri ?? null);

  // sincroniza quando o pai mudar a uri (ex.: recarregando perfil)
  useEffect(() => {
    setCurrentUri(uri ?? null);
  }, [uri]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para alterar a foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newUri = result.assets[0]?.uri ?? null;
      setCurrentUri(newUri);
      onChange(newUri);
    }
  };

  const avatarSizeStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={pickImage}
        style={[styles.avatarWrapper, avatarSizeStyle]}
      >
        {currentUri ? (
          <Image source={{ uri: currentUri }} style={[styles.avatarImage, avatarSizeStyle]} />
        ) : (
          <View style={[styles.avatarPlaceholder, avatarSizeStyle]}>
            <Feather name="user" size={size * 0.4} color="#777" />
          </View>
        )}

        {/* Badge de câmera no canto inferior direito */}
        <View style={styles.cameraBadge}>
          <Feather name="camera" size={14} color="#0B0B0E" />
        </View>
      </TouchableOpacity>

      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  avatarWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111116',
    borderWidth: 2,
    borderColor: '#2A2A33',
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#00FFA3',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#0B0B0E',
  },
  label: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
});
