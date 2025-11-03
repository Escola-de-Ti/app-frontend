import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import AuthScreen from './src/screens/AuthScreen';
import { FilterButton } from './src/components/FilterButton';
import { OpenFilterButton } from './src/components/OpenFilterButton';
import { FilterSection } from './src/components/FilterSection';

// import { PostCard } from './src/components/PostCard';
import { PostDetails } from './src/components/PostDetails';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const comments = [
    {
      id: '1',
      user: 'Andre Jacob',
      content:
        'Excelente post! Eu também passei por uma experiência similar ao implementar Clean Architecture em um projeto grande.',
      upvotes: 21,
      replies: [
        {
          id: '1-1',
          user: 'Willyan Tomaz',
          content: 'Valeu, André! Fico feliz que tenha dado certo pra você também.',
          upvotes: 8,
        },
      ],
    },
    {
      id: '2',
      user: 'Maria Souza',
      content: 'Adorei o conteúdo! Você poderia compartilhar o repositório do projeto?',
      upvotes: 14,
    },
  ];

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <PostDetails
            userName="Willyan Tomaz"
            userLevel="13"
            postDate="2d atrás"
            title="Como implementar Clean Architecture em projetos Node.js"
            content="Neste post vou compartilhar como estruturei meu último projeto utilizando os princípios da Clean Architecture. A separação clara de responsabilidades trouxe muitos benefícios. Aqui está o conteúdo completo com mais detalhes sobre a implementação da Clean Architecture. Esta abordagem revolucionou a forma como estruturo meus projetos backend."
            imageUri="https://placehold.co/600x300"
            comments={comments}
          />
          {/* <PostCard
            userName='Gabriel Marassi'
            userLevel='14'
            postDate='2d atrás'
            title='Como vocês organizam os estudos de programação?'
            description='Estou tentando conciliar faculdade, projetos pessoais e cursos online. Alguém tem uma rotina que funcione bem?'
            tag='Dúvida'
            upvotes={102}
            comments={37}
          /> */}
          {/* <CreatePostScreen /> */}
          {/* <RegisterScreen /> */}
          {/* <LoginScreen /> */}
          {/* <AuthScreen /> */}
        </ScrollView>
      </View>
      {/* <CreatePostScreen /> */}
      {/* <RegisterScreen /> */}
      {/* <LoginScreen /> */}
      {/* <CreatePostScreen /> */}
      {/* <FilterSection /> */}
      {/*<OpenFilterButton />*/}
      <AuthScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0f',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
});
