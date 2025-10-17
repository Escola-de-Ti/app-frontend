import React, { useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Header from './Header';
import Footer from './Footer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -70],
    extrapolate: 'clamp',
  });

  const footerTranslateY = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 70],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}>
        <Header />
      </Animated.View>

      <Animated.ScrollView
        style={styles.content}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
      >
        {children}
      </Animated.ScrollView>

      <Animated.View style={[styles.footer, { transform: [{ translateY: footerTranslateY }] }]}>
        <Footer />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 10,
  },
});
