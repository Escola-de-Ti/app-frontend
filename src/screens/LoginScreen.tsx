import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Logo from '../components/LogoWhitName';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      {/* Logo e título */}
      <View style={styles.header}>
        {/* Aqui vai o SVG da logo */}
        {/* <Logo width={40} height={40} /> */}
        <Logo />
      </View>

      {/* Card de login */}
      <View style={styles.card}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity style={styles.tabInactive}>
            <Text style={styles.tabTextInactive}>Criar Conta</Text>
          </TouchableOpacity>

          <LinearGradient
            colors={['#00FFA3', '#7C73FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tabActive}
          >
            <Text style={styles.tabTextActive}>Entrar</Text>
          </LinearGradient>
        </View>

        {/* Inputs */}
        <Text style={styles.label}>
          E-mail <Text style={{ color: '#FF6B6B' }}>*</Text>
        </Text>
        <TextInput placeholder="" placeholderTextColor="#777" style={styles.input} />

        <Text style={styles.label}>
          Senha <Text style={{ color: '#FF6B6B' }}>*</Text>
        </Text>
        <TextInput
          placeholder=""
          placeholderTextColor="#777"
          style={styles.input}
          secureTextEntry
        />

        <TouchableOpacity>
          <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
        </TouchableOpacity>

        {/* Login social */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <LinearGradient
              colors={['#00FFA3', '#7C73FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.socialBorder}
            >
              <View style={styles.socialInner}>
                <Feather name="github" size={28} color="#00FFA3" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton}>
            <LinearGradient
              colors={['#00FFA3', '#7C73FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.socialBorder}
            >
              <View style={styles.socialInner}>
                <Text style={styles.socialText}>G</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Botão entrar */}
        <TouchableOpacity>
          <LinearGradient
            colors={['#00FFA3', '#7C73FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitButton}
          >
            <Text style={styles.submitText}>Entrar</Text>
          </LinearGradient>
        </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FFA3',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#00FFA3',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
  tabTextInactive: {
    color: '#ccc',
    fontWeight: '500',
  },
  tabActive: {
    flex: 1,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  label: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
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
  socialButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  socialBorder: {
    borderRadius: 12,
    padding: 2,
  },
  socialInner: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: {
    color: '#00FFA3',
    fontSize: 28,
    fontWeight: 'bold',
  },
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
});
