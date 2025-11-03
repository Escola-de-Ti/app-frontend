import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from './Header';
import Footer from './Footer';

export type Page = 'Feed' | 'Workshops' | 'Ranking' | 'Perfil';

interface AppLayoutProps {
  children?: React.ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
  /** Define qual aba começa ativa nesta tela. Use null para nenhuma. */
  initialActivePage?: Page | null; // 👈 NOVO
}

export default function AppLayout({
  children,
  hideHeader,
  hideFooter,
  initialActivePage = 'Feed', // 👈 padrão antigo preservado
}: AppLayoutProps) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // agora usa o valor vindo da prop (pode ser null)
  const [activePage, setActivePage] = useState<Page | null>(initialActivePage);

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [0, -120],
    extrapolate: 'clamp',
  });

  const footerTranslateY = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: [0, 80],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: true,
  });

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
      {!hideHeader && (
        <Animated.View
          style={[
            styles.header,
            { transform: [{ translateY: headerTranslateY }], paddingTop: insets.top },
          ]}
        >
          <Header />
        </Animated.View>
      )}

      <Animated.ScrollView
        style={styles.content}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={{
          paddingTop: hideHeader ? 0 : 50,
          paddingBottom: hideFooter ? 0 : 100,
        }}
      >
        {children}
      </Animated.ScrollView>

      {!hideFooter && (
        <Animated.View
          style={[
            styles.footer,
            { transform: [{ translateY: footerTranslateY }], paddingBottom: insets.bottom },
          ]}
        >
          <Footer
            translateY={footerTranslateY}
            activePage={activePage} // pode ser null
            onChangePage={setActivePage}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(17, 17, 17);' },
  header: { position: 'absolute', top: 0, width: '100%', zIndex: 10 },
  content: { flex: 1 },
  footer: { position: 'absolute', bottom: 0, width: '100%', zIndex: 10 },
});
