import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  TouchableWithoutFeedback, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  icon,
  iconColor,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const { colors, isDark } = useTheme();

  const sheetBg   = isDark ? '#1A1A1A' : '#FFFFFF';
  const overlayBg = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)';
  const divider   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={[styles.overlay, { backgroundColor: overlayBg }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: sheetBg }]}>

              {/* Icon */}
              {icon && (
                <View style={[styles.iconWrap, { backgroundColor: (iconColor ?? colors.primary) + '18' }]}>
                  <Ionicons name={icon} size={28} color={iconColor ?? colors.primary} />
                </View>
              )}

              {/* Title */}
              <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>

              {/* Message */}
              <Text style={[styles.message, { color: colors.text.secondary }]}>{message}</Text>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: divider }]} />

              {/* Buttons */}
              <View style={styles.btnRow}>
                {/* Stay / Cancel */}
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn, { borderColor: divider, backgroundColor: isDark ? '#222' : '#F5F5F5' }]}
                  onPress={onCancel}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.text.primary }]}>{cancelLabel}</Text>
                </TouchableOpacity>

                {/* Leave / Confirm */}
                <TouchableOpacity
                  style={[styles.btn, styles.confirmBtn, { backgroundColor: destructive ? colors.status.error : colors.primary }]}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
                </TouchableOpacity>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  sheet: {
    width: '100%',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    ...Platform.select({
      android: { elevation: 24 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
    }),
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  divider: {
    width: '100%',
    height: 1,
    marginBottom: 20,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {},
  cancelBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  confirmBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
});
