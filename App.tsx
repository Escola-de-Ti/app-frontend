import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';

import { PostCard } from './src/components/PostCard';
import { PostDetails } from './src/components/PostDetails';

export default function App() {
  const [isModalVisible, setModalVisible] = useState(false);
  const [focusComment, setFocusComment] = useState(false);

  const handleOpenPost = () => {
    setFocusComment(false);
    setModalVisible(true);
  };

  const handleOpenComments = () => {
    setFocusComment(true);
    setModalVisible(true);
  };

  const handleClosePost = () => {
    setModalVisible(false);
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <PostCard onPress={handleOpenPost} onCommentPress={handleOpenComments} />
        </ScrollView>

        <Modal
          isVisible={isModalVisible}
          onSwipeComplete={handleClosePost}
          swipeDirection="down"
          onBackdropPress={handleClosePost}
          propagateSwipe={true}
          style={styles.modal}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          backdropOpacity={0.6}
          useNativeDriverForBackdrop
        >
          <View style={styles.modalContent}>
            <View style={styles.swipeIndicatorContainer}>
              <View style={styles.swipeIndicator} />
              <Text style={styles.modalTitle}>Comentários</Text>
            </View>
            <PostDetails focusComment={focusComment} />
          </View>
        </Modal>
      </View>
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
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    height: '95%',
    backgroundColor: '#0b0b0f',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  swipeIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
    marginBottom: 8,
  },
  swipeIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#555',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
