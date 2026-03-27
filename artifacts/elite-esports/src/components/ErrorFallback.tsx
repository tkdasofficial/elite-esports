import { Feather } from '@expo/vector-icons';
import { reloadAppAsync } from 'expo';
import React, { useState } from 'react';
import {
  Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, View, useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const theme = {
    background: isDark ? '#000000' : '#FFFFFF',
    backgroundSecondary: isDark ? '#1C1C1E' : '#F2F2F7',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
    link: '#007AFF',
    buttonText: '#FFFFFF',
  };

  const handleRestart = async () => {
    try { await reloadAppAsync(); } catch { resetError(); }
  };

  const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {__DEV__ && (
        <Pressable
          onPress={() => setIsModalVisible(true)}
          style={({ pressed }) => [styles.topButton, { top: insets.top + 16, backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.8 : 1 }]}
        >
          <Feather name="alert-circle" size={20} color={theme.text} />
        </Pressable>
      )}
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Something went wrong</Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>Please reload the app to continue.</Text>
        <Pressable onPress={handleRestart} style={({ pressed }) => [styles.button, { backgroundColor: theme.link, opacity: pressed ? 0.9 : 1 }]}>
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>Try Again</Text>
        </Pressable>
      </View>
      {__DEV__ && (
        <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={() => setIsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Error Details</Text>
                <Pressable onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>
              <ScrollView style={styles.modalScrollView} contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + 16 }]}>
                <View style={[styles.errorContainer, { backgroundColor: theme.backgroundSecondary }]}>
                  <Text style={[styles.errorText, { color: theme.text, fontFamily: monoFont }]} selectable>
                    {`Error: ${error.message}\n\n${error.stack ?? ''}`}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { alignItems: 'center', justifyContent: 'center', gap: 16, width: '100%', maxWidth: 600 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', lineHeight: 40 },
  message: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  topButton: { position: 'absolute', right: 16, width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  button: { paddingVertical: 16, borderRadius: 8, paddingHorizontal: 24, minWidth: 200 },
  buttonText: { fontWeight: '600', textAlign: 'center', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { width: '100%', height: '90%', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '600' },
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  modalScrollView: { flex: 1 },
  modalScrollContent: { padding: 16 },
  errorContainer: { borderRadius: 8, overflow: 'hidden', padding: 16 },
  errorText: { fontSize: 12, lineHeight: 18 },
});
