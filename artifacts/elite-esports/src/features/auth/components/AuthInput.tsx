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
          size={18}
          color={focused ? Colors.primary : '#555555'}
          style={styles.leadIcon}
        />
        <TextInput
          style={[styles.input, isPassword && styles.inputPassword]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#444444"
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
            style={styles.eyeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Ionicons
              name={showText ? 'eye-outline' : 'eye-off-outline'}
              size={19}
              color="#555555"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#888888',
    marginBottom: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#2C2C2C',
    paddingHorizontal: 16,
    height: 56,
    overflow: 'hidden',
  },
  wrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#1C0A04',
  },
  leadIcon: {
    marginRight: 12,
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
  inputPassword: {
    paddingRight: 8,
  },
  eyeBtn: {
    width: 36,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -4,
  },
});
