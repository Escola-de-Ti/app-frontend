// import React, { useState } from 'react';
// import { ScrollView, StyleSheet, View } from 'react-native';
// import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import Logo from '../components/LogoWhitName';
// import AuthTabs from '../components/AuthTabs';
// import RegisterForm from '../components/RegisterForm';
// import TermsCheckbox from '../components/TermsCheckbox';
// import GradientButton from '../components/GradientButton';

// export default function RegisterScreen() {
//   const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');
//   const [isChecked, setIsChecked] = useState(false);

//   return (
//     <SafeAreaProvider>
//       <SafeAreaView style={styles.container}>
//         <ScrollView contentContainerStyle={styles.scroll}>
//           <Logo />
//           {/* <View style={styles.containerForm}> */}
//           <AuthTabs activeTab={activeTab} setActiveTab={setActiveTab} />
//           <RegisterForm />
//           <TermsCheckbox isChecked={isChecked} setIsChecked={setIsChecked} />
//           <GradientButton
//             title="CADASTRAR"
//             disabled={!isChecked}
//             onPress={() => console.log('ok')}
//           />
//           {/* </View> */}
//         </ScrollView>
//       </SafeAreaView>
//     </SafeAreaProvider>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#111',
//   },
//   containerForm: {
//     flex: 1,
//     backgroundColor: '#373737',
//     paddingTop: 15,
//     paddingBottom: 15,
//     paddingHorizontal: 10,
//   },
//   scroll: {
//     alignItems: 'center',
//     padding: 20,
//   },
// });

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen() {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.header}>
        {/* <Logo width={40} height={40} /> */}
        <Logo />
      </View>

      {/* Card principal */}
      <View style={styles.card}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <LinearGradient
            colors={['#00FFA3', '#7C73FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tabActive}
          >
            <Text style={styles.tabTextActive}>Criar Conta</Text>
          </LinearGradient>

          <TouchableOpacity style={styles.tabInactive}>
            <Text style={styles.tabTextInactive}>Entrar</Text>
          </TouchableOpacity>
        </View>

        {/* Inputs */}
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

        {/* Checkbox */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity onPress={() => setIsChecked(!isChecked)} style={styles.checkboxWrapper}>
            <View style={[styles.checkbox, isChecked && styles.checkboxChecked]} />
          </TouchableOpacity>
          <Text style={styles.checkboxText}>
            Li e estou de Acordo com os <Text style={styles.linkText}>Termos de privacidade</Text>
          </Text>
        </View>

        {/* Botão cadastrar */}
        <TouchableOpacity style={{ marginTop: 10 }}>
          <LinearGradient
            colors={['#00FFA3', '#7C73FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitButton}
          >
            <Text style={styles.submitText}>CADASTRAR</Text>
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
  required: {
    color: '#FF6B6B',
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#fff',
    marginBottom: 12,
    height: 40,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  checkboxWrapper: {
    marginRight: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#aaa',
  },
  checkboxChecked: {
    backgroundColor: '#00FFA3',
    borderColor: '#00FFA3',
  },
  checkboxText: {
    color: '#ccc',
    fontSize: 13,
    flexShrink: 1,
  },
  linkText: {
    color: '#00FFA3',
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
