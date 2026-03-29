import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/utils/colors';

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

export function AuthInput({
  label, value, onChangeText, placeholder, iconName,
  keyboardType = 'default', autoCapitalize = 'none',
  secureTextEntry = false, autoComplete,
}: Props) {
  const [showText, setShowText] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.wrapper, focused && styles.wrapperFocused]}>
        <View style={styles.iconSlot}>
          <Ionicons
            name={iconName}
            size={17}
            color={focused ? Colors.primary : Colors.text.muted}
          />
        </View>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={isPassword && !showText}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowText(v => !v)}
            style={styles.eyeSlot}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.6}
          >
            <Ionicons
              name={showText ? 'eye-outline' : 'eye-off-outline'}
              size={17}
              color={Colors.text.muted}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.rightSpacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flex: 1 },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted,
    marginBottom: 8,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
    height: INPUT_HEIGHT,
  },
  wrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#1A0800',
  },
  iconSlot: {
    width: 48,
    height: INPUT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    color: Colors.text.primary,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  eyeSlot: {
    width: 48,
    height: INPUT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSpacer: { width: 48 },
});
