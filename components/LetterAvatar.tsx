import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/src/theme/colors';

const COLORS = [
  '#FF6B2B', '#FF3B30', '#FF9F0A', '#30D158',
  '#0A84FF', '#BF5AF2', '#FF375F', '#00B5E2',
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

const SIZES = {
  sm: { container: 32, font: 13, radius: 10 },
  md: { container: 40, font: 16, radius: 12 },
  lg: { container: 52, font: 20, radius: 16 },
  xl: { container: 72, font: 28, radius: 22 },
};

interface Props {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: object;
}

export function LetterAvatar({ name = '?', size = 'md', style }: Props) {
  const cfg = SIZES[size];
  const color = getColor(name);
  const letter = (name[0] ?? '?').toUpperCase();

  return (
    <View
      style={[
        styles.container,
        {
          width: cfg.container,
          height: cfg.container,
          borderRadius: cfg.radius,
          backgroundColor: `${color}25`,
          borderColor: `${color}40`,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: cfg.font, color }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: { fontWeight: '700' },
});
