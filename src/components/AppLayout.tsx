// src/components/AppLayout.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from './Header';
import Footer from './Footer';

export type Page = 'Feed' | 'Workshops' | 'Ranking' | 'Perfil';

export const HEADER_OFFSET = 56; // altura visual do header para padding do conteúdo
export const FOOTER_OFFSET = 72; // altura visual do footer para padding do conteúdo

interface AppLayoutProps {
  children?: React.ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
  initialActivePage?: Page | null;
  backgroundColor?: string;
  wrapWithScroll?: boolean;
  externalScrollY?: Animated.Value; // <- FlatList/ScrollView externo
  collapsible?: boolean; // <- pode desligar animação
  headerHeight?: number; // altura real do header
  footerHeight?: number; // altura real do footer
}

const DEFAULT_HEADER = 56;
const DEFAULT_FOOTER = 72;

// tunáveis
const DIR_THRESHOLD = 6; // pixels de histerese pra trocar direção
const ANIM_DURATION = 160; // ms

export default function AppLayout({
  children,
  hideHeader,
  hideFooter,
  initialActivePage = 'Feed',
  backgroundColor = 'rgb(17, 17, 17)',
  wrapWithScroll = true,
  externalScrollY,
  collapsible = true,
  headerHeight = DEFAULT_HEADER,
  footerHeight = DEFAULT_FOOTER,
}: AppLayoutProps) {
  const insets = useSafeAreaInsets();
  const [activePage, setActivePage] = useState<Page | null>(initialActivePage);

  // Se não vier de fora, criamos um scroll interno
  const internalScrollY = useRef(new Animated.Value(0)).current;
  const scrollY = externalScrollY ?? internalScrollY;

  // Em vez de interpolate com range fixo, usamos valores animados controlados por direção:
  const headerTY = useRef(new Animated.Value(0)).current; // 0 = visível, -H = escondido
  const footerTY = useRef(new Animated.Value(0)).current; // 0 = visível, +H = escondido

  // Guarda último Y e estado visível/escondido para evitar animações redundantes
  const lastYRef = useRef(0);
  const headerHiddenRef = useRef(false);
  const footerHiddenRef = useRef(false);

  // Assina mudanças do scrollY (de fora ou interno) para detectar direção
  useEffect(() => {
    if (!collapsible) return;

    const sub = scrollY.addListener(({ value }) => {
      const dy = value - lastYRef.current;

      if (Math.abs(dy) < DIR_THRESHOLD) return; // histerese

      if (dy > 0) {
        // rolando pra BAIXO -> esconder header e footer (se já não estiverem escondidos)
        if (!headerHiddenRef.current && !hideHeader) {
          headerHiddenRef.current = true;
          Animated.timing(headerTY, {
            toValue: -(headerHeight + insets.top),
            duration: ANIM_DURATION,
            useNativeDriver: true,
          }).start();
        }
        if (!footerHiddenRef.current && !hideFooter) {
          footerHiddenRef.current = true;
          Animated.timing(footerTY, {
            toValue: footerHeight + insets.bottom,
            duration: ANIM_DURATION,
            useNativeDriver: true,
          }).start();
        }
      } else {
        // rolando pra CIMA -> mostrar header e footer (se estavam escondidos)
        if (headerHiddenRef.current && !hideHeader) {
          headerHiddenRef.current = false;
          Animated.timing(headerTY, {
            toValue: 0,
            duration: ANIM_DURATION,
            useNativeDriver: true,
          }).start();
        }
        if (footerHiddenRef.current && !hideFooter) {
          footerHiddenRef.current = false;
          Animated.timing(footerTY, {
            toValue: 0,
            duration: ANIM_DURATION,
            useNativeDriver: true,
          }).start();
        }
      }

      lastYRef.current = value;
    });

    return () => {
      scrollY.removeListener(sub);
    };
  }, [
    collapsible,
    hideHeader,
    hideFooter,
    headerHeight,
    footerHeight,
    insets.top,
    insets.bottom,
    scrollY,
    headerTY,
    footerTY,
  ]);

  // Se o layout estiver envolvendo o conteúdo com ScrollView, alimenta o internalScrollY
  const handleInternalScroll =
    wrapWithScroll && collapsible
      ? Animated.event([{ nativeEvent: { contentOffset: { y: internalScrollY } } }], {
          useNativeDriver: true,
        })
      : undefined;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {!hideHeader && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.header,
            {
              transform: [{ translateY: collapsible ? headerTY : new Animated.Value(0) }],
              height: headerHeight + insets.top,
              paddingTop: insets.top,
              backgroundColor,
              ...(Platform.OS === 'android' ? { elevation: 6 } : { zIndex: 10 }),
            },
          ]}
        >
          <Header />
        </Animated.View>
      )}

      {wrapWithScroll ? (
        <Animated.ScrollView
          style={[styles.container, { backgroundColor }]}
          scrollEventThrottle={16}
          onScroll={handleInternalScroll}
          contentContainerStyle={{
            paddingTop: hideHeader ? 0 : HEADER_OFFSET,
            paddingBottom: hideFooter ? 0 : FOOTER_OFFSET,
            backgroundColor,
            flexGrow: 1,
            minHeight: '100%',
          }}
        >
          {children}
        </Animated.ScrollView>
      ) : (
        // quando a tela já usa FlatList/SectionList, não crie outro scroll
        <View style={[styles.container, { backgroundColor }]}>{children}</View>
      )}

      {!hideFooter && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.footer,
            {
              transform: [{ translateY: collapsible ? footerTY : new Animated.Value(0) }],
              height: footerHeight + insets.bottom,
              paddingBottom: insets.bottom,
              backgroundColor,
              ...(Platform.OS === 'android' ? { elevation: 6 } : { zIndex: 10 }),
            },
          ]}
        >
          <Footer
            translateY={footerTY} // segue funcionando (usa só pra compor estilo)
            activePage={activePage}
            onChangePage={setActivePage}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { position: 'absolute', top: 0, left: 0, right: 0 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
