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
        <Ionicons
          name={iconName}
          size={17}
          color={focused ? Colors.primary : Colors.text.muted}
          style={styles.icon}
        />
        <TextInput
          style={[styles.input, isPassword && styles.inputPassword]}
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
        {isPassword && (
          <TouchableOpacity onPress={() => setShowText(v => !v)} style={styles.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons
              name={showText ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={Colors.text.muted}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: 14,
    height: 52,
  },
  wrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#1A0800',
  },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  inputPassword: {
    paddingRight: 36,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
  },
});
