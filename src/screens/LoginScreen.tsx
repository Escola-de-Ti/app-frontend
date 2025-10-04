import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import CheckBox from 'expo-checkbox';

const RegisterScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');
  const [isChecked, setIsChecked] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* LOGO */}
        <Text style={styles.logo}>KNOWHALL</Text>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'register' && styles.activeTab]}
            onPress={() => setActiveTab('register')}
          >
            <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>
              Criar Conta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'login' && styles.activeTab]}
            onPress={() => setActiveTab('login')}
          >
            <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
              Entrar
            </Text>
          </TouchableOpacity>
        </View>

        {/* FORM */}
        <TextInput
          placeholder="Nome de Usuário *"
          placeholderTextColor="#ccc"
          style={styles.input}
        />
        <TextInput
          placeholder="CPF *"
          placeholderTextColor="#ccc"
          style={styles.input}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="E-mail *"
          placeholderTextColor="#ccc"
          style={styles.input}
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Telefone (opcional)"
          placeholderTextColor="#ccc"
          style={styles.input}
          keyboardType="phone-pad"
        />
        <TextInput
          placeholder="Senha *"
          placeholderTextColor="#ccc"
          style={styles.input}
          secureTextEntry
        />
        <TextInput
          placeholder="Confirmar Senha *"
          placeholderTextColor="#ccc"
          style={styles.input}
          secureTextEntry
        />

        {/* Checkbox */}
        <View style={styles.checkboxContainer}>
          <CheckBox
            value={isChecked}
            onValueChange={setIsChecked}
            color={isChecked ? '#00ffcc' : '#fff'}
          />

          <Text style={styles.checkboxText}>
            Li e estou de Acordo com os <Text style={styles.link}>Termos de privacidade</Text>
          </Text>
        </View>

        {/* Botão */}
        <TouchableOpacity disabled={!isChecked}>
          <LinearGradient
            colors={['#00ffcc', '#7a5cff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>CADASTRAR</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  scroll: {
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ffcc',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#222',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#333',
  },
  tabText: {
    color: '#aaa',
    fontSize: 16,
  },
  activeTabText: {
    color: '#00ffcc',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  checkboxText: {
    color: '#fff',
    fontSize: 12,
    flexShrink: 1,
  },
  link: {
    color: '#7a5cff',
    textDecorationLine: 'underline',
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RegisterScreen;
