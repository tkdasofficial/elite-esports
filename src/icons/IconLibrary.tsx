import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

interface IconProps {
  size?: number;
  color?: string;
  style?: any;
}

// ─── Generic App Icon (drop-in replacement for Ionicons/Feather) ────────────

export function AppIcon({
  name,
  size = 24,
  color = '#fff',
  style,
  library = 'ionicons',
}: {
  name: string;
  size?: number;
  color?: string;
  style?: any;
  library?: 'ionicons' | 'feather';
}) {
  if (library === 'feather') {
    return <Feather name={name as any} size={size} color={color} style={style} />;
  }
  return <Ionicons name={name as any} size={size} color={color} style={style} />;
}

// ─── TAB BAR ICONS ─────────────────────────────────────────────────────────

export const HomeIcon = ({ size = 24, color = '#fff', focused = false }: IconProps & { focused?: boolean }) => (
  <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
);

export const TrophyIcon = ({ size = 24, color = '#fff', focused = false }: IconProps & { focused?: boolean }) => (
  <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={size} color={color} />
);

export const RadioIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="radio" size={size} color={color} />
);

export const WalletIcon = ({ size = 24, color = '#fff', focused = false }: IconProps & { focused?: boolean }) => (
  <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={size} color={color} />
);

export const PersonIcon = ({ size = 24, color = '#fff', focused = false }: IconProps & { focused?: boolean }) => (
  <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
);

// ─── HEADER ICONS ──────────────────────────────────────────────────────────

export const BellIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="notifications-outline" size={size} color={color} />
);

export const NotificationIcon = BellIcon;

// ─── AUTH ICONS ────────────────────────────────────────────────────────────

export const MailIcon = ({ size = 24, color = '#fff', outline = true }: IconProps & { outline?: boolean }) => (
  <Ionicons name={outline ? 'mail-outline' : 'mail'} size={size} color={color} />
);

export const LockIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="lock-closed" size={size} color={color} />
);

export const EyeIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="eye" size={size} color={color} />
);

export const EyeOffIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="eye-off" size={size} color={color} />
);

// ─── BRAND / SOCIAL ICONS ──────────────────────────────────────────────────

export const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <View style={{
    width: size + 8, height: size + 8, borderRadius: (size + 8) / 2,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e0e0e0',
  }}>
    <Ionicons name="logo-google" size={size} color="#4285F4" />
  </View>
);

export const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <View style={{
    width: size + 8, height: size + 8, borderRadius: (size + 8) / 2,
    backgroundColor: '#1877F2', alignItems: 'center', justifyContent: 'center',
  }}>
    <Ionicons name="logo-facebook" size={size} color="#fff" />
  </View>
);

export const EmailIcon = ({ size = 20, color = '#fff' }: IconProps) => (
  <View style={{
    width: size + 8, height: size + 8, borderRadius: (size + 8) / 2,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  }}>
    <Ionicons name="mail-outline" size={size} color={color} />
  </View>
);

// ─── NAVIGATION ICONS ──────────────────────────────────────────────────────

export const ChevronBackIcon = ({ size = 22, color = '#fff' }: IconProps) => (
  <Ionicons name="chevron-back" size={size} color={color} />
);

export const ChevronForwardIcon = ({ size = 22, color = '#fff' }: IconProps) => (
  <Ionicons name="chevron-forward" size={size} color={color} />
);

export const ChevronUpIcon = ({ size = 22, color = '#fff' }: IconProps) => (
  <Ionicons name="chevron-up" size={size} color={color} />
);

export const ChevronDownIcon = ({ size = 22, color = '#fff' }: IconProps) => (
  <Ionicons name="chevron-down" size={size} color={color} />
);

export const ArrowBackIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="arrow-back" size={size} color={color} />
);

// ─── ACTION ICONS ──────────────────────────────────────────────────────────

export const SearchIcon = ({ size = 24, color = '#fff', feather = false }: IconProps & { feather?: boolean }) =>
  feather
    ? <Feather name="search" size={size} color={color} />
    : <Ionicons name="search" size={size} color={color} />;

export const CloseIcon = ({ size = 24, color = '#fff', circle = false }: IconProps & { circle?: boolean }) => (
  <Ionicons name={circle ? 'close-circle' : 'close'} size={size} color={color} />
);

export const AddIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="add" size={size} color={color} />
);

export const PlusIcon = AddIcon;

export const EditIcon = ({ size = 24, color = '#fff', feather = false }: IconProps & { feather?: boolean }) =>
  feather
    ? <Feather name="edit-2" size={size} color={color} />
    : <Ionicons name="pencil" size={size} color={color} />;

export const PencilIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="pencil" size={size} color={color} />
);

export const TrashIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="trash" size={size} color={color} />
);

export const RefreshIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="refresh" size={size} color={color} />
);

export const CopyIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="copy" size={size} color={color} />
);

export const ShareIcon = ({ size = 24, color = '#fff', feather = false }: IconProps & { feather?: boolean }) =>
  feather
    ? <Feather name="share-2" size={size} color={color} />
    : <Ionicons name="share-social" size={size} color={color} />;

// ─── STATUS / FEEDBACK ICONS ───────────────────────────────────────────────

export const CheckmarkIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="checkmark" size={size} color={color} />
);

export const CheckmarkCircleIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="checkmark-circle" size={size} color={color} />
);

export const WarningIcon = ({ size = 24, color = '#fff', outline = true }: IconProps & { outline?: boolean }) => (
  <Ionicons name={outline ? 'warning-outline' : 'warning'} size={size} color={color} />
);

export const FlashIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="flash" size={size} color={color} />
);

export const StarIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="star" size={size} color={color} />
);

export const PlayIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="play" size={size} color={color} />
);

// ─── CONTENT ICONS ─────────────────────────────────────────────────────────

export const GameControllerIcon = ({ size = 24, color = '#fff', outline = false }: IconProps & { outline?: boolean }) => (
  <Ionicons name={outline ? 'game-controller-outline' : 'game-controller'} size={size} color={color} />
);

export const PeopleIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="people" size={size} color={color} />
);

export const UsersIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Feather name="users" size={size} color={color} />
);

export const ClockIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Feather name="clock" size={size} color={color} />
);

export const ArrowUpIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="arrow-up" size={size} color={color} />
);

export const ArrowDownCircleIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="arrow-down-circle" size={size} color={color} />
);

export const TrendingUpIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="trending-up" size={size} color={color} />
);

export const CashIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="cash" size={size} color={color} />
);

export const ShieldIcon = ({ size = 24, color = '#fff', checkmark = false }: IconProps & { checkmark?: boolean }) => (
  <Ionicons name={checkmark ? 'shield-checkmark' : 'shield'} size={size} color={color} />
);

export const ReceiptIcon = ({ size = 24, color = '#fff', outline = true }: IconProps & { outline?: boolean }) => (
  <Ionicons name={outline ? 'receipt-outline' : 'receipt'} size={size} color={color} />
);

export const SettingsIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="settings" size={size} color={color} />
);

export const LogOutIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="log-out" size={size} color={color} />
);

export const GridIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="grid" size={size} color={color} />
);

export const HeadsetIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="headset" size={size} color={color} />
);

export const BookIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="book" size={size} color={color} />
);

export const MegaphoneIcon = ({ size = 24, color = '#fff', outline = false }: IconProps & { outline?: boolean }) => (
  <Ionicons name={outline ? 'megaphone-outline' : 'megaphone'} size={size} color={color} />
);

export const PriceTagIcon = ({ size = 24, color = '#fff', outline = false }: IconProps & { outline?: boolean }) => (
  <Ionicons name={outline ? 'pricetag-outline' : 'pricetag'} size={size} color={color} />
);
