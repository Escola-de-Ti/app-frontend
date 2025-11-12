// src/components/AppLayout.tsx
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
  initialActivePage?: Page | null;
  /** Cor de fundo específica por tela (opcional) */
  backgroundColor?: string; // 👈 opcional
}

export default function AppLayout({
  children,
  hideHeader,
  hideFooter,
  initialActivePage = 'Feed',
  backgroundColor = 'rgb(17, 17, 17)', // 👈 padrão global
}: AppLayoutProps) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
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
    <View
      style={[
        styles.container,
        { backgroundColor, paddingBottom: insets.bottom, paddingTop: insets.top },
      ]}
    >
      {!hideHeader && (
        <Animated.View
          style={[
            styles.header,
            { transform: [{ translateY: headerTranslateY }], paddingTop: insets.top },
          ]}
        >
          {/* wrapper só pra herdar a cor sob o header */}
          <View style={{ backgroundColor }}>
            <Header />
          </View>
        </Animated.View>
      )}

      <Animated.ScrollView
        style={[styles.container, { backgroundColor }]}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={{
          paddingTop: hideHeader ? 0 : 50,
          paddingBottom: hideFooter ? 0 : 100,
          backgroundColor,
          flexGrow: 1, // garante preenchimento total
          minHeight: '100%',
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
          <View style={{ backgroundColor }}>
            <Footer
              translateY={footerTranslateY}
              activePage={activePage}
              onChangePage={setActivePage}
            />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { position: 'absolute', top: 0, width: '100%', zIndex: 10 },
  content: { flex: 1 },
  footer: { position: 'absolute', bottom: 0, width: '100%', zIndex: 10 },
});
