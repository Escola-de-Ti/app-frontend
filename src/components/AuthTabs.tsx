import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  activeTab: 'register' | 'login';
  setActiveTab: (tab: 'register' | 'login') => void;
};

export default function AuthTabs({ activeTab, setActiveTab }: Props) {
  return (
    <View style={styles.container}>
      {/* Criar Conta */}
      <TouchableOpacity
        style={styles.tabWrapper}
        onPress={() => setActiveTab('register')}
        activeOpacity={0.8}
      >
        {activeTab === 'register' ? (
          <LinearGradient colors={['#00ffcc40', '#00ffcc20']} style={styles.activeBackground}>
            <Text style={styles.activeText}>Criar Conta</Text>
          </LinearGradient>
        ) : (
          <View style={styles.inactiveBackground}>
            <Text style={styles.inactiveText}>Criar Conta</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Entrar */}
      <TouchableOpacity
        style={styles.tabWrapper}
        onPress={() => setActiveTab('login')}
        activeOpacity={0.8}
      >
        {activeTab === 'login' ? (
          <LinearGradient colors={['#00ffcc40', '#00ffcc20']} style={styles.activeBackground}>
            <Text style={styles.activeText}>Entrar</Text>
          </LinearGradient>
        ) : (
          <View style={styles.inactiveBackground}>
            <Text style={styles.inactiveText}>Entrar</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 50,
    padding: 4,
    width: '100%',
    marginBottom: 25,
  },
  tabWrapper: {
    flex: 1,
  },
  activeBackground: {
    flex: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#111',
    shadowColor: '#00ffcc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  inactiveBackground: {
    flex: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
  },
  activeText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 15,
  },
  inactiveText: {
    color: '#fff',
    fontWeight: '400',
    fontSize: 15,
  },
});
