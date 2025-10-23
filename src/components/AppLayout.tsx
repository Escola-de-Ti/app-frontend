import React, { useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from './Header';
import Footer from './Footer';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const [activePage, setActivePage] = useState<'Feed' | 'Workshops' | 'Ranking' | 'Perfil'>('Feed');

  // animação do header (some quando rola pra baixo)
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [0, -80],
    extrapolate: 'clamp',
  });

  // animação do footer (some quando rola pra baixo)
  const footerTranslateY = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: [0, 80],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: true,
  });

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* HEADER */}
      <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}>
        <Header />
      </Animated.View>

      {/* CONTEÚDO */}
      <Animated.ScrollView
        style={styles.content}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={{ paddingTop: 90, paddingBottom: 100 }}
      >
        {children}
      </Animated.ScrollView>

      {/* FOOTER */}
      <Animated.View
        style={[
          styles.footer,
          {
            transform: [{ translateY: footerTranslateY }],
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <Footer
          translateY={footerTranslateY}
          activePage={activePage}
          onChangePage={setActivePage}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(17, 17, 17);',
  },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 10,
  },
});
