import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import Logo from '../components/Logo';
import AuthTabs from '../components/AuthTabs';
import RegisterForm from '../components/RegisterForm';
import TermsCheckbox from '../components/TermsCheckbox';
import GradientButton from '../components/GradientButton';

export default function RegisterScreen() {
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');
  const [isChecked, setIsChecked] = useState(false);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Logo />
          {/* <View style={styles.containerForm}> */}
          <AuthTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <RegisterForm />
          <TermsCheckbox isChecked={isChecked} setIsChecked={setIsChecked} />
          <GradientButton
            title="CADASTRAR"
            disabled={!isChecked}
            onPress={() => console.log('ok')}
          />
          {/* </View> */}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  containerForm: {
    flex: 1,
    backgroundColor: '#373737',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 10,
  },
  scroll: {
    alignItems: 'center',
    padding: 20,
  },
});
