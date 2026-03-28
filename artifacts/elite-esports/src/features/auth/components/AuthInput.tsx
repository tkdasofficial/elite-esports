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

const INPUT_HEIGHT = 56;

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

        {/* Left icon — fixed-width container so it never shifts */}
        <View style={styles.iconSlot}>
          <Ionicons
            name={iconName}
            size={18}
            color={focused ? Colors.primary : '#606060'}
          />
        </View>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#484848"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={isPassword && !showText}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {/* Right side — eye button for password, fixed spacer for others */}
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowText(v => !v)}
            style={styles.eyeSlot}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Ionicons
              name={showText ? 'eye-outline' : 'eye-off-outline'}
              size={19}
              color="#606060"
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
  group: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#888888',
    marginBottom: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: INPUT_HEIGHT / 2,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    height: INPUT_HEIGHT,
    overflow: 'hidden',
  },
  wrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#1C0A04',
  },
  /* Fixed-width slot keeps the icon locked regardless of focus state */
  iconSlot: {
    width: 52,
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
  /* Eye button — same fixed width as icon slot, right side */
  eyeSlot: {
    width: 52,
    height: INPUT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Spacer gives the same right breathing room for non-password fields */
  rightSpacer: {
    width: 20,
  },
});
