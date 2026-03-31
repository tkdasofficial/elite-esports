import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import type { AppColors } from '@/utils/colors';

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  iconName: keyof typeof Ionicons.glyphMap;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  autoComplete?: any;
}

const INPUT_HEIGHT = 54;
const ICON_SLOT = 48;

export function AuthInput({
  label, value, onChangeText, placeholder, iconName,
  keyboardType = 'default', autoCapitalize = 'none',
  secureTextEntry = false, autoComplete,
}: Props) {
  const [showText, setShowText] = useState(false);
  const [focused, setFocused] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isPassword = secureTextEntry;

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.wrapper, focused && styles.wrapperFocused]}>

        <View style={styles.iconSlot}>
          <Ionicons
            name={iconName}
            size={18}
            color={focused ? colors.primary : colors.text.muted}
          />
        </View>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={isPassword && !showText}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowText(v => !v)}
            style={styles.eyeSlot}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Ionicons
              name={showText ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={colors.text.muted}
            />
          </TouchableOpacity>
        )}

      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    group: {
      flex: 1,
    },
    label: {
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
      color: colors.text.muted,
      marginBottom: 8,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.elevated,
      borderRadius: INPUT_HEIGHT / 2,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      height: INPUT_HEIGHT,
      overflow: 'hidden',
    },
    wrapperFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.background.card,
    },
    iconSlot: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: ICON_SLOT,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    input: {
      flex: 1,
      alignSelf: 'stretch',
      color: colors.text.primary,
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      paddingVertical: 0,
      paddingLeft: ICON_SLOT,
      paddingRight: ICON_SLOT,
      backgroundColor: 'transparent',
    },
    eyeSlot: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: ICON_SLOT,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
  });
}
