// src/screens/AuthScreen.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Toast from 'react-native-toast-message';

import Logo from '../components/LogoWhitName';
import AppInput from '../components/AppInput';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../lib/errors';
import type { TipoUsuario } from '../types';

export default function AuthScreen() {
  const { login, register, isLoading } = useAuth();

  // login
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');

  // registro
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [emailReg, setEmailReg] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senhaReg, setSenhaReg] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario | null>(null);

  // anim
  const [isRegister, setIsRegister] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const cardHeight = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    Animated.spring(cardHeight, {
      toValue: isRegister ? 820 : 400,
      friction: 10,
      tension: 50,
      useNativeDriver: false,
    }).start();
  }, [isRegister, cardHeight]);

  const toggleForm = () => {
    setIsRegister(!isRegister);
    
    Animated.timing(anim, {
      toValue: isRegister ? 0 : 1,
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1), // ease-in-out suave
      useNativeDriver: true,
    }).start();
  };

  const translateXLogin = anim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [0, -400],
    extrapolate: 'clamp',
  });
  
  const translateXRegister = anim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [400, 0],
    extrapolate: 'clamp',
  });
  
  const opacityLogin = anim.interpolate({ 
    inputRange: [0, 0.3, 1], 
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });
  
  const opacityRegister = anim.interpolate({ 
    inputRange: [0, 0.7, 1], 
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const scaleLogin = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const scaleRegister = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
    extrapolate: 'clamp',
  });

  // ====== AÇÕES ======
  const handleLogin = async () => {
    if (!emailLogin.trim() || !senhaLogin.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Campos obrigatórios',
        text2: 'Preencha e-mail e senha para entrar.',
      });
      return;
    }
    try {
      await login(emailLogin.trim(), senhaLogin);
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Falha no login',
        text2: getErrorMessage(e, 'Não foi possível entrar.'),
      });
    }
  };

  const handleRegister = async () => {
    if (
      !nome.trim() ||
      !cpf.trim() ||
      !emailReg.trim() ||
      !senhaReg.trim() ||
      !confirmSenha.trim()
    ) {
      Toast.show({
        type: 'error',
        text1: 'Campos obrigatórios',
        text2: 'Preencha todos os campos marcados com *.',
      });
      return;
    }
    if (senhaReg !== confirmSenha) {
      Toast.show({
        type: 'error',
        text1: 'Senhas diferentes',
        text2: 'A confirmação precisa ser igual à senha.',
      });
      return;
    }
    if (!tipoUsuario) {
      Toast.show({
        type: 'error',
        text1: 'Selecione o tipo de conta',
        text2: 'Escolha ALUNO ou INSTRUTOR.',
      });
      return;
    }

    try {
      await register({
        nome: nome.trim(),
        email: emailReg.trim(),
        senha: senhaReg,
        cpf: cpf.replace(/\D/g, ''),
        telefone: telefone.trim() || undefined,
        tipoUsuario,
      });

      Toast.show({
        type: 'success',
        text1: 'Conta criada com sucesso!',
        text2: 'Agora faça seu login.',
        onHide: () => {
          if (isRegister) toggleForm();
        },
      });

      setNome('');
      setCpf('');
      setEmailReg('');
      setTelefone('');
      setSenhaReg('');
      setConfirmSenha('');
      setTipoUsuario(null);
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro no cadastro',
        text2: getErrorMessage(e, 'Não foi possível cadastrar.'),
      });
    }
  };

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
        {/* Tabs */}
        <View style={styles.tabs}>
          {/* Tab Entrar */}
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
            <TouchableOpacity style={styles.tabInactive} onPress={toggleForm} activeOpacity={0.7}>
              <Text style={styles.tabTextInactive}>Entrar</Text>
            </TouchableOpacity>
          )}

          {/* Tab Criar Conta */}
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
            <TouchableOpacity style={styles.tabInactive} onPress={toggleForm} activeOpacity={0.7}>
              <Text style={styles.tabTextInactive}>Criar Conta</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Forms */}
        <View style={styles.formWrapper}>
          {/* Login */}
          <Animated.View
            style={[
              styles.form,
              { 
                transform: [
                  { translateX: translateXLogin },
                  { scale: scaleLogin },
                ], 
                opacity: opacityLogin,
                zIndex: !isRegister ? 10 : 1,
              },
            ]}
            pointerEvents={!isRegister ? 'auto' : 'none'}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                E-mail <Text style={styles.required}>*</Text>
              </Text>
              <AppInput
                placeholder="Digite seu e-mail"
                keyboardType="email-address"
                style={styles.inputStyle}
                value={emailLogin}
                onChangeText={setEmailLogin}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Senha <Text style={styles.required}>*</Text>
              </Text>
              <AppInput
                placeholder="Digite sua senha"
                secureTextEntry
                style={styles.inputStyle}
                value={senhaLogin}
                onChangeText={setSenhaLogin}
              />
            </View>

            <TouchableOpacity onPress={handleLogin} disabled={isLoading} style={{ marginTop: 24 }}>
              <LinearGradient colors={['#00FFA3', '#7C73FF']} style={styles.submitButton}>
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.submitText}>Entrar</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Registro */}
          <Animated.View
            style={[
              styles.form,
              { 
                transform: [
                  { translateX: translateXRegister },
                  { scale: scaleRegister },
                ], 
                opacity: opacityRegister,
                zIndex: isRegister ? 10 : 1,
              },
            ]}
            pointerEvents={isRegister ? 'auto' : 'none'}
          >
            <View style={{ paddingBottom: 60 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Nome de Usuário <Text style={styles.required}>*</Text>
                </Text>
                <AppInput
                  placeholder="Digite seu nome de usuário"
                  style={styles.inputStyle}
                  value={nome}
                  onChangeText={setNome}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  CPF <Text style={styles.required}>*</Text>
                </Text>
                <AppInput
                  placeholder="Digite seu CPF"
                  keyboardType="numeric"
                  style={styles.inputStyle}
                  value={cpf}
                  onChangeText={setCpf}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  E-mail <Text style={styles.required}>*</Text>
                </Text>
                <AppInput
                  placeholder="Digite seu e-mail"
                  keyboardType="email-address"
                  style={styles.inputStyle}
                  value={emailReg}
                  onChangeText={setEmailReg}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefone (opcional)</Text>
                <AppInput
                  placeholder="Digite seu telefone"
                  keyboardType="phone-pad"
                  style={styles.inputStyle}
                  value={telefone}
                  onChangeText={setTelefone}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Senha <Text style={styles.required}>*</Text>
                </Text>
                <AppInput
                  placeholder="Crie uma senha"
                  secureTextEntry
                  style={styles.inputStyle}
                  value={senhaReg}
                  onChangeText={setSenhaReg}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Confirmar Senha <Text style={styles.required}>*</Text>
                </Text>
                <AppInput
                  placeholder="Confirme sua senha"
                  secureTextEntry
                  style={styles.inputStyle}
                  value={confirmSenha}
                  onChangeText={setConfirmSenha}
                />
              </View>

              {/* Tipo de Conta (exclusivo) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Tipo de conta <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.radioRow}>
                  <TouchableOpacity
                    style={styles.radioItem}
                    onPress={() => setTipoUsuario('ALUNO')}
                    activeOpacity={0.8}
                  >
                    <Feather
                      name={tipoUsuario === 'ALUNO' ? 'check-square' : 'square'}
                      size={20}
                      color={tipoUsuario === 'ALUNO' ? '#00FFA3' : '#888'}
                    />
                    <Text style={styles.radioText}>Aluno</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioItem}
                    onPress={() => setTipoUsuario('INSTRUTOR')}
                    activeOpacity={0.8}
                  >
                    <Feather
                      name={tipoUsuario === 'INSTRUTOR' ? 'check-square' : 'square'}
                      size={20}
                      color={tipoUsuario === 'INSTRUTOR' ? '#00FFA3' : '#888'}
                    />
                    <Text style={styles.radioText}>Instrutor</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={{ marginTop: 20 }}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <LinearGradient colors={['#00FFA3', '#7C73FF']} style={styles.submitButton}>
                  {isLoading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.submitText}>Cadastrar</Text>
                  )}
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
    paddingVertical: 40,
  },
  header: { alignItems: 'center', marginBottom: 32 },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 24,
    marginBottom: 28,
    padding: 6,
    gap: 8,
  },
  tabInactive: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  tabActive: {
    flex: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  tabTextInactive: {
    color: '#BDBDCC',
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#0E0E0E',
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'center',
  },

  formWrapper: { width: '100%', minHeight: 300 },
  form: { 
    position: 'absolute', 
    width: '100%', 
    top: 0,
  },

  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  inputStyle: {
    height: 50,
  },
  required: { color: '#FF6B6B' },

  submitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: { color: '#0E0E0E', fontWeight: '800', fontSize: 16 },

  backToLogin: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  backText: { color: '#BDBDCC', fontSize: 14 },
  backLink: { color: '#00FFA3', fontSize: 14, fontWeight: '700' },

  radioRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#15151A',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A33',
    flex: 1,
  },
  radioText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});