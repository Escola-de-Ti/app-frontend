import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  StatusBar,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Logo from '../components/LogoWhitName';
import AppInput from '../components/AppInput';

export default function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  // animação de altura do card
  const cardHeight = useRef(new Animated.Value(460)).current;

  useEffect(() => {
    Animated.timing(cardHeight, {
      toValue: isRegister ? 720 : 460, // aumenta na tela de criar conta
      duration: 400,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false, // altura não suporta driver nativo
    }).start();
  }, [isRegister]);

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
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      enableOnAndroid
      extraScrollHeight={60}
      keyboardOpeningTime={100}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Logo />
      </View>

      <Animated.View style={[styles.card, { height: cardHeight }]}>
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
                <Text style={styles.tabTextInactive}>Criar Contaaaa</Text>
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
            <AppInput
              placeholder="Digite seu e-mail"
              keyboardType="email-address"
              style={styles.inputStyle}
            />

            <Text style={styles.label}>
              Senha <Text style={styles.required}>*</Text>
            </Text>
            <AppInput placeholder="Digite sua senha" secureTextEntry style={styles.inputStyle} />

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
            <View style={{ paddingBottom: 60 }}>
              <Text style={styles.label}>
                Nome de Usuário <Text style={styles.required}>*</Text>
              </Text>
              <AppInput placeholder="Digite seu nome de usuário" style={styles.inputStyle} />

              <Text style={styles.label}>
                CPF <Text style={styles.required}>*</Text>
              </Text>
              <AppInput
                placeholder="Digite seu CPF"
                keyboardType="numeric"
                style={styles.inputStyle}
              />

              <Text style={styles.label}>
                E-mail <Text style={styles.required}>*</Text>
              </Text>
              <AppInput
                placeholder="Digite seu e-mail"
                keyboardType="email-address"
                style={styles.inputStyle}
              />

              <Text style={styles.label}>Telefone (opcional)</Text>
              <AppInput
                placeholder="Digite seu telefone"
                keyboardType="phone-pad"
                style={styles.inputStyle}
              />

              <Text style={styles.label}>
                Senha <Text style={styles.required}>*</Text>
              </Text>
              <AppInput placeholder="Crie uma senha" secureTextEntry style={styles.inputStyle} />

              <Text style={styles.label}>
                Confirmar Senha <Text style={styles.required}>*</Text>
              </Text>
              <AppInput
                placeholder="Confirme sua senha"
                secureTextEntry
                style={styles.inputStyle}
              />

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
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E0E' },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  formWrapper: { width: '100%', minHeight: 460 },
  form: { position: 'absolute', width: '100%', top: 0 },
  label: { color: '#fff', fontSize: 14, marginBottom: 0, marginTop: 10 },
  inputStyle: { height: 50, marginTop: 10 },
  required: { color: '#FF6B6B' },
  forgotPassword: {
    color: '#00FFA3',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'right',
    marginTop: 10,
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
    marginTop: 10,
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
