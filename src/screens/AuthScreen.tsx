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
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import Logo from '../components/LogoWhitName';
import AppInput from '../components/AppInput';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../lib/errors';

export default function AuthScreen() {
  const { login, register, isLoading } = useAuth();
  const navigation = useNavigation<any>();

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

  // anim
  const [isRegister, setIsRegister] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const cardHeight = useRef(new Animated.Value(460)).current;

  useEffect(() => {
    Animated.timing(cardHeight, {
      toValue: isRegister ? 720 : 460,
      duration: 400,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
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

  const translateXLogin = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -350] });
  const translateXRegister = anim.interpolate({ inputRange: [0, 1], outputRange: [350, 0] });
  const opacityLogin = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const opacityRegister = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

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
      // ✅ logou: navega para CreatePost
      navigation.reset({ index: 0, routes: [{ name: 'CreatePost' }] });
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
    try {
      await register({
        nome: nome.trim(),
        email: emailReg.trim(),
        senha: senhaReg,
        cpf: cpf.replace(/\D/g, ''),
        telefone: telefone.trim() || undefined,
      });

      // ✅ cadastro OK: mostra toast e só então volta pro "Entrar"
      Toast.show({
        type: 'success',
        text1: 'Conta criada com sucesso!',
        text2: 'Agora faça seu login.',
        // ao fechar o toast (auto-hide), troca pra aba Entrar
        onHide: () => {
          if (isRegister) toggleForm();
        },
      });

      // limpa o form de cadastro
      setNome('');
      setCpf('');
      setEmailReg('');
      setTelefone('');
      setSenhaReg('');
      setConfirmSenha('');
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
          {/* Entrar */}
          <Animated.View
            style={{
              flex: 1,
              opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] }),
              transform: [
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] }) },
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
              opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
              transform: [
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
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

        {/* Forms */}
        <View style={styles.formWrapper}>
          {/* Login */}
          <Animated.View
            style={[
              styles.form,
              { transform: [{ translateX: translateXLogin }], opacity: opacityLogin },
            ]}
          >
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
            <TouchableOpacity>
              <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
            </TouchableOpacity>
            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton} disabled>
                <LinearGradient colors={['#00FFA3', '#7C73FF']} style={styles.socialBorder}>
                  <View style={styles.socialInner}>
                    <Feather name="github" size={28} color="#00FFA3" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} disabled>
                <LinearGradient colors={['#00FFA3', '#7C73FF']} style={styles.socialBorder}>
                  <View style={styles.socialInner}>
                    <Text style={styles.socialText}>G</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
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
              { transform: [{ translateX: translateXRegister }], opacity: opacityRegister },
            ]}
          >
            <View style={{ paddingBottom: 60 }}>
              <Text style={styles.label}>
                Nome de Usuário <Text style={styles.required}>*</Text>
              </Text>
              <AppInput
                placeholder="Digite seu nome de usuário"
                style={styles.inputStyle}
                value={nome}
                onChangeText={setNome}
              />
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
              <Text style={styles.label}>Telefone (opcional)</Text>
              <AppInput
                placeholder="Digite seu telefone"
                keyboardType="phone-pad"
                style={styles.inputStyle}
                value={telefone}
                onChangeText={setTelefone}
              />
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
              <TouchableOpacity
                style={{ marginTop: 10 }}
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
  socialContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, gap: 20 },
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
  submitButton: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#000', fontWeight: '700', fontSize: 16 },
  backToLogin: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  backText: { color: '#ccc', fontSize: 14 },
  backLink: { color: '#00FFA3', fontSize: 14, fontWeight: '600' },
});
