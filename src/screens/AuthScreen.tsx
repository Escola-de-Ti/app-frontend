import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Logo from '../components/LogoWhitName';
import AppInput from '../components/AppInput'; // 👈 import do input customizado

export default function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggleForm = () => {
    Animated.timing(anim, {
      toValue: isRegister ? 0 : 1,
      duration: 600,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start(() => setIsRegister(!isRegister));
  };

  const translateXLogin = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -350],
  });

  const translateXRegister = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [350, 0],
  });

  const opacityLogin = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const opacityRegister = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Logo />
        </View>

        <View style={styles.card}>
          {/* Tabs animadas */}
          <View style={styles.tabs}>
            {/* Entrar */}
            <Animated.View
              style={{
                flex: 1,
                opacity: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.4],
                }),
                transform: [
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.95],
                    }),
                  },
                ],
              }}
            >
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
            </Animated.View>

            {/* Criar Conta */}
            <Animated.View
              style={{
                flex: 1,
                opacity: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1],
                }),
                transform: [
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              }}
            >
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
            </Animated.View>
          </View>

          {/* Forms com slide + fade */}
          <View style={styles.formWrapper}>
            {/* Login */}
            <Animated.View
              style={[
                styles.form,
                {
                  transform: [{ translateX: translateXLogin }],
                  opacity: opacityLogin,
                },
              ]}
            >
              <Text style={styles.label}>
                E-mail <Text style={styles.required}>*</Text>
              </Text>
              <AppInput placeholder="Digite seu e-mail" keyboardType="email-address" />

              <Text style={styles.label}>
                Senha <Text style={styles.required}>*</Text>
              </Text>
              <AppInput placeholder="Digite sua senha" secureTextEntry />

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
            <Animated.View
              style={[
                styles.form,
                {
                  transform: [{ translateX: translateXRegister }],
                  opacity: opacityRegister,
                },
              ]}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                <Text style={styles.label}>
                  Nome de Usuário <Text style={styles.required}>*</Text>
                </Text>
                <AppInput placeholder="Digite seu nome de usuário" />

                <Text style={styles.label}>
                  CPF <Text style={styles.required}>*</Text>
                </Text>
                <AppInput placeholder="Digite seu CPF" keyboardType="numeric" />

                <Text style={styles.label}>
                  E-mail <Text style={styles.required}>*</Text>
                </Text>
                <AppInput placeholder="Digite seu e-mail" keyboardType="email-address" />

                <Text style={styles.label}>Telefone (opcional)</Text>
                <AppInput placeholder="Digite seu telefone" keyboardType="phone-pad" />

                <Text style={styles.label}>
                  Senha <Text style={styles.required}>*</Text>
                </Text>
                <AppInput placeholder="Crie uma senha" secureTextEntry />

                <Text style={styles.label}>
                  Confirmar Senha <Text style={styles.required}>*</Text>
                </Text>
                <AppInput placeholder="Confirme sua senha" secureTextEntry />

                <TouchableOpacity style={{ marginTop: 10 }}>
                  <LinearGradient colors={['#00FFA3', '#7C73FF']} style={styles.submitButton}>
                    <Text style={styles.submitText}>Cadastrar</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.backToLogin}>
                  <Text style={styles.backText}>Já tem uma conta?</Text>
                  <TouchableOpacity onPress={toggleForm}>
                    <Text style={styles.backLink}> Entrar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E0E' },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: { alignItems: 'center', marginBottom: 30 },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    overflow: 'hidden',
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
  formWrapper: { width: '100%', overflow: 'hidden', minHeight: 440 },
  form: { position: 'absolute', width: '100%', top: 0 },
  label: { color: '#fff', fontSize: 14, marginBottom: 4 },
  required: { color: '#FF6B6B' },
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
  backToLogin: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  backText: { color: '#ccc', fontSize: 14 },
  backLink: { color: '#00FFA3', fontSize: 14, fontWeight: '600' },
});
