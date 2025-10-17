import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Logo from '../components/LogoWhitName';

export default function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggleForm = () => {
    Animated.timing(anim, {
      toValue: isRegister ? 0 : 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => setIsRegister(!isRegister));
  };

  // animações de slide
  const translateXLogin = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -400],
  });

  const translateXRegister = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Logo />
      </View>

      <View style={styles.card}>
        {/* Tabs */}
        <View style={styles.tabs}>
          {!isRegister ? (
            <LinearGradient
              colors={['#00FFA3', '#7C73FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabActive}
            >
              <Text style={styles.tabTextActive}>Entrar</Text>
            </LinearGradient>
          ) : (
            <TouchableOpacity style={styles.tabInactive} onPress={toggleForm}>
              <Text style={styles.tabTextInactive}>Entrar</Text>
            </TouchableOpacity>
          )}

          {isRegister ? (
            <LinearGradient
              colors={['#00FFA3', '#7C73FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabActive}
            >
              <Text style={styles.tabTextActive}>Criar Conta</Text>
            </LinearGradient>
          ) : (
            <TouchableOpacity style={styles.tabInactive} onPress={toggleForm}>
              <Text style={styles.tabTextInactive}>Criar Conta</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Login */}
        <Animated.View style={[styles.form, { transform: [{ translateX: translateXLogin }] }]}>
          <Text style={styles.label}>
            E-mail <Text style={styles.required}>*</Text>
          </Text>
          <TextInput style={styles.input} placeholder="" placeholderTextColor="#777" />

          <Text style={styles.label}>
            Senha <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#777"
            secureTextEntry
          />

          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <LinearGradient colors={['#00FFA3', '#7C73FF']} style={styles.socialBorder}>
                <View style={styles.socialInner}>
                  <Feather name="github" size={28} color="#00FFA3" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton}>
              <LinearGradient colors={['#00FFA3', '#7C73FF']} style={styles.socialBorder}>
                <View style={styles.socialInner}>
                  <Text style={styles.socialText}>G</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity>
            <LinearGradient colors={['#00FFA3', '#7C73FF']} style={styles.submitButton}>
              <Text style={styles.submitText}>Entrar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Registro */}
        <Animated.View style={[styles.form, { transform: [{ translateX: translateXRegister }] }]}>
          <Text style={styles.label}>
            Nome de Usuário <Text style={styles.required}>*</Text>
          </Text>
          <TextInput style={styles.input} placeholder="" placeholderTextColor="#777" />

          <Text style={styles.label}>
            CPF <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#777"
            keyboardType="numeric"
          />

          <Text style={styles.label}>
            E-mail <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#777"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Telefone (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#777"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>
            Senha <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#777"
            secureTextEntry
          />

          <Text style={styles.label}>
            Confirmar Senha <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#777"
            secureTextEntry
          />

          <TouchableOpacity style={{ marginTop: 10 }}>
            <LinearGradient colors={['#00FFA3', '#7C73FF']} style={styles.submitButton}>
              <Text style={styles.submitText}>Cadastrar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: { alignItems: 'center', marginBottom: 20 },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    overflow: 'hidden',
    height: '60%',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 24,
    marginBottom: 20,
    padding: 4,
  },
  tabInactive: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingVertical: 10,
  },
  tabActive: {
    flex: 1,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabTextInactive: { color: '#ccc', fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  label: { color: '#fff', fontSize: 14, marginBottom: 4 },
  required: { color: '#FF6B6B' },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#fff',
    marginBottom: 12,
    height: 40,
  },
  forgotPassword: {
    color: '#00FFA3',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'right',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 20,
  },
  socialButton: { borderRadius: 12, overflow: 'hidden' },
  socialBorder: { borderRadius: 12, padding: 2 },
  socialInner: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: { color: '#00FFA3', fontSize: 28, fontWeight: 'bold' },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  form: {
    position: 'absolute',
    width: '100%',
    top: 70,
  },
});
