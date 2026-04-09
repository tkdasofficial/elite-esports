/**
 * AdLoadingOverlay — glassmorphism full-screen overlay shown while an ad loads.
 * Shows a countdown. After the countdown expires, a "Skip" button appears so
 * the user is never stuck if an ad fails to load.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import type { AppColors } from '@/utils/colors';

interface Props {
  visible: boolean;
  bypassAfter: number;
  onSkip: () => void;
  label?: string;
}

export function AdLoadingOverlay({ visible, bypassAfter, onSkip, label = 'Loading Ad...' }: Props) {
  const [remaining, setRemaining] = useState(bypassAfter);
  const [canSkip, setCanSkip]     = useState(false);
  const dotScale                  = useRef(new Animated.Value(1)).current;
  const fadeAnim                  = useRef(new Animated.Value(0)).current;
  const { colors }                = useTheme();

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotScale, { toValue: 1.4, duration: 600, useNativeDriver: true }),
        Animated.timing(dotScale, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setRemaining(bypassAfter);
      setCanSkip(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, bypassAfter]);

  useEffect(() => {
    if (!visible) return;
    const tick = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(tick);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [visible]);

  if (!visible) return null;

  const styles = createStyles(colors);

  return (
    <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <View style={styles.card}>
          <Animated.View style={[styles.iconRing, { transform: [{ scale: dotScale }] }]}>
            <Ionicons name="play-circle" size={44} color={colors.primary} />
          </Animated.View>

          <Text style={styles.label}>{label}</Text>

          <View style={styles.countdownBox}>
            <Text style={styles.countdownNum}>{remaining}</Text>
            <Text style={styles.countdownSub}>seconds</Text>
          </View>

          <Text style={styles.hint}>
            {canSkip
              ? 'Ad unavailable. You may continue.'
              : 'Please wait while your ad loads…'}
          </Text>

          {canSkip && (
            <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.8}>
              <Ionicons name="arrow-forward-circle-outline" size={23} color="#fff" />
              <Text style={styles.skipText}>Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      width: '82%',
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      gap: 16,
      backgroundColor: colors.background.card,
      borderWidth: 1,
      borderColor: colors.border.default,
      overflow: 'hidden',
      elevation: 20,
    },
    iconRing: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + '22',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.primary + '55',
    },
    label: {
      fontSize: 18,
      fontFamily: 'Inter_700Bold',
      color: colors.text.primary,
      letterSpacing: 0.4,
    },
    countdownBox: {
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary + '11',
    },
    countdownNum: {
      fontSize: 30,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
      lineHeight: 34,
    },
    countdownSub: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: colors.text.secondary,
    },
    hint: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 19,
    },
    skipBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 50,
      marginTop: 4,
    },
    skipText: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: '#fff',
    },
  });
}
