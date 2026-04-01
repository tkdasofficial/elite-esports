import React from 'react';
import Svg, {
  Circle, Ellipse, Path, Rect, Polygon, G,
  Defs, LinearGradient, Stop, Line,
} from 'react-native-svg';

interface AvatarProps { size?: number }

/* ─── 0: WARRIOR ──────────────────────────────────────────────── */
const Warrior = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w0" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#1B3F72" />
        <Stop offset="1" stopColor="#2D6DB5" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w0)" />
    {/* Helmet dome */}
    <Path d="M16 32 Q15 18 30 14 Q45 18 44 32 L44 40 Q44 46 30 46 Q16 46 16 40 Z" fill="#4A86C8" />
    {/* T-visor */}
    <Rect x="22" y="28" width="16" height="7" rx="1.5" fill="#0A1A2A" />
    <Rect x="23" y="29" width="14" height="5" rx="1" fill="#00AAFF" opacity="0.35" />
    <Rect x="28" y="22" width="4" height="7" rx="1" fill="#0A1A2A" />
    {/* Chin */}
    <Path d="M20 40 Q20 46 30 46 Q40 46 40 40" fill="#3A70A8" />
    {/* Side guards */}
    <Rect x="12" y="30" width="5" height="10" rx="2" fill="#3A70A8" />
    <Rect x="43" y="30" width="5" height="10" rx="2" fill="#3A70A8" />
    {/* Crest line */}
    <Rect x="28" y="10" width="4" height="5" rx="1" fill="#6AACF0" />
  </Svg>
);

/* ─── 1: NINJA ─────────────────────────────────────────────────── */
const Ninja = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w1" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#1A0808" />
        <Stop offset="1" stopColor="#4A0E0E" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w1)" />
    {/* Shuriken (4-point throwing star) */}
    <G transform="translate(30,30) rotate(45)">
      <Rect x="-4" y="-16" width="8" height="32" rx="1" fill="#E8E8E8" />
      <Rect x="-16" y="-4" width="32" height="8" rx="1" fill="#E8E8E8" />
    </G>
    {/* Center ring */}
    <Circle cx="30" cy="30" r="5" fill="#1A0808" />
    <Circle cx="30" cy="30" r="3" fill="#FF3A3A" />
    {/* Red accent line */}
    <Rect x="10" y="14" width="40" height="2" rx="1" fill="#CC0000" />
  </Svg>
);

/* ─── 2: ROBOT ──────────────────────────────────────────────────── */
const Robot = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w2" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#0A2030" />
        <Stop offset="1" stopColor="#0A4050" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w2)" />
    {/* Antenna */}
    <Rect x="28" y="8" width="4" height="8" rx="1" fill="#00CCFF" />
    <Circle cx="30" cy="8" r="3" fill="#00FFFF" />
    {/* Head */}
    <Rect x="14" y="16" width="32" height="28" rx="4" fill="#1E5060" />
    {/* Eyes */}
    <Rect x="17" y="22" width="10" height="8" rx="2" fill="#001020" />
    <Rect x="33" y="22" width="10" height="8" rx="2" fill="#001020" />
    <Rect x="18" y="23" width="8" height="6" rx="1" fill="#00EEFF" opacity="0.9" />
    <Rect x="34" y="23" width="8" height="6" rx="1" fill="#00EEFF" opacity="0.9" />
    {/* Mouth grille */}
    <Rect x="18" y="34" width="24" height="6" rx="2" fill="#001020" />
    <Rect x="20" y="35" width="4" height="4" rx="1" fill="#00CCFF" opacity="0.6" />
    <Rect x="26" y="35" width="4" height="4" rx="1" fill="#00CCFF" opacity="0.6" />
    <Rect x="32" y="35" width="4" height="4" rx="1" fill="#00CCFF" opacity="0.6" />
    <Rect x="38" y="35" width="2" height="4" rx="1" fill="#00CCFF" opacity="0.6" />
  </Svg>
);

/* ─── 3: MAGE ───────────────────────────────────────────────────── */
const Mage = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w3" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#1A0440" />
        <Stop offset="1" stopColor="#4A0A90" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w3)" />
    {/* Wizard hat */}
    <Path d="M30 6 L18 32 L42 32 Z" fill="#6A20CC" />
    <Rect x="14" y="32" width="32" height="5" rx="2" fill="#8A40EE" />
    {/* Star on hat */}
    <Path d="M30 12 L31.5 17 L37 17 L32.5 20 L34 25 L30 22 L26 25 L27.5 20 L23 17 L28.5 17 Z" fill="#FFA200" />
    {/* Face */}
    <Ellipse cx="30" cy="40" rx="10" ry="8" fill="#5A18B8" />
    {/* Eyes */}
    <Circle cx="26" cy="39" r="3" fill="#FFA200" />
    <Circle cx="34" cy="39" r="3" fill="#FFA200" />
    <Circle cx="26" cy="39" r="1.5" fill="#000" />
    <Circle cx="34" cy="39" r="1.5" fill="#000" />
    {/* Sparkles */}
    <Circle cx="12" cy="20" r="1.5" fill="#FFA200" />
    <Circle cx="48" cy="24" r="1" fill="#CC88FF" />
    <Circle cx="10" cy="38" r="1" fill="#FFA200" />
  </Svg>
);

/* ─── 4: SNIPER ─────────────────────────────────────────────────── */
const Sniper = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w4" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#0A1A08" />
        <Stop offset="1" stopColor="#1A4010" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w4)" />
    {/* Scope outer ring */}
    <Circle cx="30" cy="30" r="18" stroke="#4AEE44" strokeWidth="2" fill="none" />
    {/* Crosshair lines */}
    <Line x1="30" y1="8" x2="30" y2="22" stroke="#4AEE44" strokeWidth="2" />
    <Line x1="30" y1="38" x2="30" y2="52" stroke="#4AEE44" strokeWidth="2" />
    <Line x1="8" y1="30" x2="22" y2="30" stroke="#4AEE44" strokeWidth="2" />
    <Line x1="38" y1="30" x2="52" y2="30" stroke="#4AEE44" strokeWidth="2" />
    {/* Inner ring */}
    <Circle cx="30" cy="30" r="8" stroke="#4AEE44" strokeWidth="1.5" fill="none" />
    {/* Center dot */}
    <Circle cx="30" cy="30" r="2.5" fill="#FF3A3A" />
    {/* Tick marks */}
    <Line x1="30" y1="13" x2="30" y2="16" stroke="#4AEE44" strokeWidth="1.5" />
    <Line x1="30" y1="44" x2="30" y2="47" stroke="#4AEE44" strokeWidth="1.5" />
    <Line x1="13" y1="30" x2="16" y2="30" stroke="#4AEE44" strokeWidth="1.5" />
    <Line x1="44" y1="30" x2="47" y2="30" stroke="#4AEE44" strokeWidth="1.5" />
  </Svg>
);

/* ─── 5: DEMON ──────────────────────────────────────────────────── */
const Demon = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w5" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#2A0000" />
        <Stop offset="1" stopColor="#660000" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w5)" />
    {/* Left horn */}
    <Path d="M19 28 Q12 14 18 8 Q20 18 22 26 Z" fill="#CC2200" />
    {/* Right horn */}
    <Path d="M41 28 Q48 14 42 8 Q40 18 38 26 Z" fill="#CC2200" />
    {/* Face */}
    <Ellipse cx="30" cy="36" rx="14" ry="13" fill="#8A1500" />
    {/* Eyes */}
    <Ellipse cx="24" cy="33" rx="4" ry="3.5" fill="#FF6600" />
    <Ellipse cx="36" cy="33" rx="4" ry="3.5" fill="#FF6600" />
    <Ellipse cx="24" cy="33" rx="2" ry="2.5" fill="#000" />
    <Ellipse cx="36" cy="33" rx="2" ry="2.5" fill="#000" />
    {/* Eyebrows */}
    <Path d="M19 29 Q24 26 28 29" stroke="#CC2200" strokeWidth="2" fill="none" strokeLinecap="round" />
    <Path d="M32 29 Q36 26 41 29" stroke="#CC2200" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Fangs */}
    <Path d="M25 43 L27 49 L29 43 Z" fill="#EEE" />
    <Path d="M31 43 L33 49 L35 43 Z" fill="#EEE" />
  </Svg>
);

/* ─── 6: KNIGHT ─────────────────────────────────────────────────── */
const Knight = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w6" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#1E1E1E" />
        <Stop offset="1" stopColor="#404040" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w6)" />
    {/* Shield */}
    <Path d="M30 10 L46 16 L46 34 Q46 46 30 52 Q14 46 14 34 L14 16 Z" fill="#3A3A3A" />
    <Path d="M30 13 L43 18 L43 34 Q43 44 30 49 Q17 44 17 34 L17 18 Z" fill="#C0C0C0" />
    {/* Cross on shield */}
    <Rect x="27.5" y="18" width="5" height="24" rx="1" fill="#FFA200" />
    <Rect x="20" y="28" width="20" height="5" rx="1" fill="#FFA200" />
    {/* Shield border */}
    <Path d="M30 13 L43 18 L43 34 Q43 44 30 49 Q17 44 17 34 L17 18 Z"
      stroke="#FFA200" strokeWidth="1" fill="none" />
  </Svg>
);

/* ─── 7: HACKER ─────────────────────────────────────────────────── */
const Hacker = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w7" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#001500" />
        <Stop offset="1" stopColor="#003800" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w7)" />
    {/* Terminal window */}
    <Rect x="10" y="14" width="40" height="32" rx="4" fill="#001A00" />
    <Rect x="10" y="14" width="40" height="8" rx="4" fill="#002800" />
    {/* Window dots */}
    <Circle cx="16" cy="18" r="2" fill="#FF5F56" />
    <Circle cx="22" cy="18" r="2" fill="#FFBD2E" />
    <Circle cx="28" cy="18" r="2" fill="#27C93F" />
    {/* Code lines */}
    <Path d="M14 28 L18 32 L14 36" stroke="#00FF41" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="22" y="30.5" width="12" height="2" rx="1" fill="#00FF41" />
    <Rect x="22" y="35" width="8" height="2" rx="1" fill="#00CC33" opacity="0.7" />
    {/* Cursor */}
    <Rect x="36" y="30" width="3" height="3" rx="0.5" fill="#00FF41" />
    {/* Bottom lines */}
    <Rect x="14" y="40" width="20" height="1.5" rx="0.5" fill="#00AA22" opacity="0.5" />
    <Rect x="14" y="43" width="14" height="1.5" rx="0.5" fill="#00AA22" opacity="0.5" />
  </Svg>
);

/* ─── 8: GHOST ──────────────────────────────────────────────────── */
const Ghost = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w8" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#0A0420" />
        <Stop offset="1" stopColor="#1A0A50" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w8)" />
    {/* Ghost body */}
    <Path d="M18 35 Q18 14 30 12 Q42 14 42 35 L42 50 Q39 46 36 50 Q33 46 30 50 Q27 46 24 50 Q21 46 18 50 Z"
      fill="#C8CCFF" opacity="0.9" />
    {/* Eyes */}
    <Ellipse cx="24" cy="30" rx="4" ry="5" fill="#2A1A60" />
    <Ellipse cx="36" cy="30" rx="4" ry="5" fill="#2A1A60" />
    {/* Eye glow */}
    <Ellipse cx="24" cy="30" rx="2.5" ry="3.5" fill="#6A5AFF" />
    <Ellipse cx="36" cy="30" rx="2.5" ry="3.5" fill="#6A5AFF" />
    {/* Sparkles */}
    <Circle cx="12" cy="16" r="1.5" fill="#8880FF" opacity="0.8" />
    <Circle cx="48" cy="20" r="1" fill="#8880FF" opacity="0.6" />
    <Circle cx="10" cy="28" r="1" fill="#8880FF" opacity="0.5" />
    <Circle cx="50" cy="38" r="1.5" fill="#8880FF" opacity="0.7" />
  </Svg>
);

/* ─── 9: CYBORG ─────────────────────────────────────────────────── */
const Cyborg = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w9" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#2A1000" />
        <Stop offset="1" stopColor="#5A3000" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w9)" />
    {/* Face base */}
    <Ellipse cx="30" cy="32" rx="16" ry="18" fill="#7A4A20" />
    {/* Left half - human */}
    <Path d="M14 32 Q14 14 30 14 L30 50 Q14 50 14 32 Z" fill="#A06030" />
    {/* Right half - circuit */}
    <Path d="M30 14 Q46 14 46 32 Q46 50 30 50 Z" fill="#2A2A3A" />
    {/* Circuit lines on right */}
    <Line x1="30" y1="22" x2="42" y2="22" stroke="#FF8800" strokeWidth="1.5" />
    <Line x1="42" y1="22" x2="42" y2="32" stroke="#FF8800" strokeWidth="1.5" />
    <Line x1="36" y1="32" x2="42" y2="32" stroke="#FF8800" strokeWidth="1.5" />
    <Line x1="30" y1="40" x2="38" y2="40" stroke="#FF8800" strokeWidth="1.5" />
    {/* Human eye (left) */}
    <Ellipse cx="23" cy="30" rx="4" ry="3.5" fill="#3A1A00" />
    <Ellipse cx="23" cy="30" rx="2.5" ry="2.5" fill="#6B3A10" />
    <Circle cx="22" cy="29" r="0.8" fill="#FFF" opacity="0.6" />
    {/* Cyber eye (right) */}
    <Circle cx="38" cy="30" r="5" fill="#001020" />
    <Circle cx="38" cy="30" r="3.5" fill="#FF6600" />
    <Circle cx="38" cy="30" r="2" fill="#FF2200" />
    <Circle cx="37" cy="29" r="0.8" fill="#FFF" opacity="0.8" />
    {/* Seam line */}
    <Line x1="30" y1="14" x2="30" y2="50" stroke="#FF8800" strokeWidth="1" opacity="0.8" />
  </Svg>
);

/* ─── 10: ASSASSIN ──────────────────────────────────────────────── */
const Assassin = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w10" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#080808" />
        <Stop offset="1" stopColor="#181018" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w10)" />
    {/* Dagger blade */}
    <Path d="M30 8 L34 36 L30 40 L26 36 Z" fill="#C8C8C8" />
    {/* Blade edge */}
    <Path d="M30 8 L34 36 L30 34 Z" fill="#E8E8E8" />
    {/* Cross guard */}
    <Rect x="22" y="36" width="16" height="4" rx="2" fill="#FFA200" />
    {/* Handle */}
    <Rect x="27" y="40" width="6" height="12" rx="2" fill="#4A2A00" />
    {/* Handle wrap */}
    <Line x1="27" y1="43" x2="33" y2="43" stroke="#8A5A00" strokeWidth="1.5" />
    <Line x1="27" y1="46" x2="33" y2="46" stroke="#8A5A00" strokeWidth="1.5" />
    <Line x1="27" y1="49" x2="33" y2="49" stroke="#8A5A00" strokeWidth="1.5" />
    {/* Pommel */}
    <Ellipse cx="30" cy="52" rx="4" ry="2" fill="#FFA200" />
    {/* Red accent */}
    <Circle cx="30" cy="36" r="2" fill="#CC0000" />
  </Svg>
);

/* ─── 11: DRAGON ────────────────────────────────────────────────── */
const Dragon = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w11" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#300000" />
        <Stop offset="1" stopColor="#7A0000" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w11)" />
    {/* Left wing */}
    <Path d="M30 28 Q16 18 10 10 Q18 16 22 26 Z" fill="#AA1A00" />
    {/* Right wing */}
    <Path d="M30 28 Q44 18 50 10 Q42 16 38 26 Z" fill="#AA1A00" />
    {/* Dragon head */}
    <Ellipse cx="30" cy="36" rx="14" ry="13" fill="#CC2200" />
    {/* Snout */}
    <Path d="M22 40 Q30 48 38 40 L36 44 Q30 52 24 44 Z" fill="#AA1A00" />
    {/* Eyes */}
    <Ellipse cx="24" cy="32" rx="4" ry="3.5" fill="#FFA200" />
    <Ellipse cx="36" cy="32" rx="4" ry="3.5" fill="#FFA200" />
    <Ellipse cx="24" cy="32" rx="1.5" ry="2.5" fill="#000" />
    <Ellipse cx="36" cy="32" rx="1.5" ry="2.5" fill="#000" />
    {/* Horns */}
    <Path d="M22 24 Q16 12 20 8 Q22 16 24 22 Z" fill="#CC2200" />
    <Path d="M38 24 Q44 12 40 8 Q38 16 36 22 Z" fill="#CC2200" />
    {/* Fire breath */}
    <Path d="M26 44 Q30 52 34 44 Q32 50 30 54 Q28 50 26 44 Z" fill="#FF6600" opacity="0.8" />
    <Path d="M28 46 Q30 52 32 46" stroke="#FFA200" strokeWidth="1.5" fill="none" opacity="0.6" />
  </Svg>
);

/* ─── 12: ALIEN ─────────────────────────────────────────────────── */
const Alien = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w12" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#002828" />
        <Stop offset="1" stopColor="#005050" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w12)" />
    {/* Head (large oval) */}
    <Ellipse cx="30" cy="28" rx="18" ry="22" fill="#00AA88" />
    {/* Large eyes */}
    <Ellipse cx="22" cy="26" rx="7" ry="9" fill="#002020" />
    <Ellipse cx="38" cy="26" rx="7" ry="9" fill="#002020" />
    {/* Eye iris */}
    <Ellipse cx="22" cy="26" rx="5" ry="7" fill="#00FFCC" opacity="0.9" />
    <Ellipse cx="38" cy="26" rx="5" ry="7" fill="#00FFCC" opacity="0.9" />
    {/* Pupils */}
    <Ellipse cx="22" cy="26" rx="2" ry="4" fill="#001A1A" />
    <Ellipse cx="38" cy="26" rx="2" ry="4" fill="#001A1A" />
    {/* Small mouth */}
    <Path d="M25 42 Q30 46 35 42" stroke="#008866" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Nose slits */}
    <Line x1="28" y1="38" x2="28" y2="40" stroke="#008866" strokeWidth="2" strokeLinecap="round" />
    <Line x1="32" y1="38" x2="32" y2="40" stroke="#008866" strokeWidth="2" strokeLinecap="round" />
    {/* Antennae */}
    <Line x1="22" y1="7" x2="26" y2="18" stroke="#00CC99" strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="38" y1="7" x2="34" y2="18" stroke="#00CC99" strokeWidth="1.5" strokeLinecap="round" />
    <Circle cx="22" cy="7" r="2.5" fill="#00FFCC" />
    <Circle cx="38" cy="7" r="2.5" fill="#00FFCC" />
  </Svg>
);

/* ─── 13: SAMURAI ───────────────────────────────────────────────── */
const Samurai = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w13" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#1A0800" />
        <Stop offset="1" stopColor="#3A1800" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w13)" />
    {/* Katana blade */}
    <Path d="M20 10 L32 46 L34 46 L22 10 Z" fill="#D0D0D8" />
    <Path d="M20 10 L22 10 L34 46 L32 46 Z" fill="#E8E8F0" />
    {/* Guard (tsuba) */}
    <Ellipse cx="27" cy="46" rx="8" ry="4" fill="#FFA200" />
    <Ellipse cx="27" cy="46" rx="6" ry="2.5" fill="#1A1200" />
    {/* Handle (tsuka) */}
    <Path d="M24 46 L22 56 L32 56 L30 46 Z" fill="#4A2A00" />
    {/* Handle wrap */}
    <Line x1="23" y1="48" x2="31" y2="48" stroke="#8A5A00" strokeWidth="1.5" />
    <Line x1="22.5" y1="51" x2="30.5" y2="51" stroke="#8A5A00" strokeWidth="1.5" />
    <Line x1="22" y1="54" x2="30" y2="54" stroke="#8A5A00" strokeWidth="1.5" />
    {/* Second katana (crossed) */}
    <Path d="M40 10 L28 46 L30 46 L42 10 Z" fill="#C0C0C8" opacity="0.6" />
    {/* Cherry blossom */}
    <Circle cx="46" cy="14" r="4" fill="#FF9999" opacity="0.7" />
    <Circle cx="50" cy="18" r="3" fill="#FFB3B3" opacity="0.5" />
    <Circle cx="10" cy="16" r="3" fill="#FF9999" opacity="0.5" />
  </Svg>
);

/* ─── 14: PHOENIX ───────────────────────────────────────────────── */
const Phoenix = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w14" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#2A0800" />
        <Stop offset="1" stopColor="#7A2A00" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w14)" />
    {/* Left wing */}
    <Path d="M30 30 Q16 22 8 12 Q14 24 18 32 Q22 36 30 34 Z" fill="#FF6600" />
    <Path d="M30 30 Q12 20 6 8 Q10 20 16 28 Z" fill="#FF4400" opacity="0.6" />
    {/* Right wing */}
    <Path d="M30 30 Q44 22 52 12 Q46 24 42 32 Q38 36 30 34 Z" fill="#FF6600" />
    <Path d="M30 30 Q48 20 54 8 Q50 20 44 28 Z" fill="#FF4400" opacity="0.6" />
    {/* Body */}
    <Ellipse cx="30" cy="32" rx="8" ry="12" fill="#FF8800" />
    {/* Head */}
    <Circle cx="30" cy="20" r="7" fill="#FFAA00" />
    {/* Crest */}
    <Path d="M28 14 Q30 8 32 14 Q30 12 28 14 Z" fill="#FF4400" />
    <Path d="M25 16 Q27 10 30 14 Q27 14 25 16 Z" fill="#FF6600" />
    <Path d="M35 16 Q33 10 30 14 Q33 14 35 16 Z" fill="#FF6600" />
    {/* Eye */}
    <Circle cx="30" cy="20" r="2.5" fill="#1A0800" />
    <Circle cx="30" cy="20" r="1" fill="#FFA200" />
    {/* Tail flame */}
    <Path d="M26 44 Q28 54 30 58 Q32 54 34 44 Q30 50 26 44 Z" fill="#FF4400" />
    <Path d="M28 46 Q30 54 32 46 Q30 52 28 46 Z" fill="#FFA200" opacity="0.8" />
  </Svg>
);

/* ─── 15: GAMER ─────────────────────────────────────────────────── */
const Gamer = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w15" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#050A20" />
        <Stop offset="1" stopColor="#0A1A50" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w15)" />
    {/* Controller body */}
    <Path d="M14 26 Q12 22 16 20 L44 20 Q48 22 46 26 L42 42 Q40 46 36 46 L24 46 Q20 46 18 42 Z"
      fill="#1A2A5A" />
    {/* Left grip */}
    <Path d="M14 26 Q10 28 12 38 Q14 44 20 42 L18 42 Q16 40 14 26 Z" fill="#1A2A5A" />
    {/* Right grip */}
    <Path d="M46 26 Q50 28 48 38 Q46 44 40 42 L42 42 Q44 40 46 26 Z" fill="#1A2A5A" />
    {/* D-pad */}
    <Rect x="16" y="27" width="5" height="12" rx="1" fill="#2A3A6A" />
    <Rect x="13" y="30" width="11" height="6" rx="1" fill="#2A3A6A" />
    <Circle cx="18.5" cy="33" r="2" fill="#3A4A7A" />
    {/* Action buttons */}
    <Circle cx="40" cy="28" r="3" fill="#FF4466" />
    <Circle cx="46" cy="32" r="3" fill="#44AAFF" />
    <Circle cx="40" cy="36" r="3" fill="#44FF88" />
    <Circle cx="34" cy="32" r="3" fill="#FFAA00" />
    {/* Center */}
    <Circle cx="29" cy="32" r="4" fill="#0A1440" />
    <Circle cx="29" cy="32" r="2.5" fill="#2A3A6A" />
    {/* Shoulder button hint */}
    <Rect x="18" y="19" width="8" height="3" rx="1.5" fill="#2A3A7A" />
    <Rect x="34" y="19" width="8" height="3" rx="1.5" fill="#2A3A7A" />
  </Svg>
);

/* ─── 16: CHAMPION ──────────────────────────────────────────────── */
const Champion = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w16" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#1A1000" />
        <Stop offset="1" stopColor="#3A2800" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w16)" />
    {/* Trophy cup */}
    <Path d="M20 42 L22 26 L38 26 L40 42 Z" fill="#D4A800" />
    {/* Cup bowl */}
    <Path d="M20 26 Q18 14 30 12 Q42 14 40 26 Z" fill="#FFA200" />
    {/* Handles */}
    <Path d="M20 20 Q12 20 12 26 Q12 32 20 30" stroke="#D4A800" strokeWidth="3" fill="none" strokeLinecap="round" />
    <Path d="M40 20 Q48 20 48 26 Q48 32 40 30" stroke="#D4A800" strokeWidth="3" fill="none" strokeLinecap="round" />
    {/* Base stem */}
    <Rect x="26" y="42" width="8" height="6" rx="1" fill="#FFA200" />
    {/* Base plate */}
    <Rect x="20" y="48" width="20" height="4" rx="2" fill="#D4A800" />
    {/* Star in cup */}
    <Path d="M30 16 L31.5 20 L36 20 L32.5 22.5 L34 27 L30 24 L26 27 L27.5 22.5 L24 20 L28.5 20 Z"
      fill="#FFF5A0" />
    {/* Shine on cup */}
    <Path d="M24 16 Q22 18 22 22" stroke="#FFF5A0" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
  </Svg>
);

/* ─── 17: SKULL ─────────────────────────────────────────────────── */
const Skull = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w17" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#111111" />
        <Stop offset="1" stopColor="#2A2A2A" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w17)" />
    {/* Skull head */}
    <Path d="M14 32 Q13 14 30 12 Q47 14 46 32 Q46 42 40 44 L20 44 Q14 42 14 32 Z" fill="#DCDCDC" />
    {/* Jaw */}
    <Rect x="20" y="43" width="20" height="8" rx="3" fill="#C8C8C8" />
    {/* Jaw gaps (teeth) */}
    <Rect x="23" y="44" width="3" height="6" rx="0.5" fill="#222" />
    <Rect x="28" y="44" width="3" height="6" rx="0.5" fill="#222" />
    <Rect x="33" y="44" width="3" height="6" rx="0.5" fill="#222" />
    {/* Eye sockets */}
    <Ellipse cx="22" cy="30" rx="7" ry="8" fill="#1A1A1A" />
    <Ellipse cx="38" cy="30" rx="7" ry="8" fill="#1A1A1A" />
    {/* Nose hole */}
    <Path d="M27 40 Q30 38 33 40 L32 42 Q30 40 28 42 Z" fill="#1A1A1A" />
    {/* Crack */}
    <Path d="M30 12 Q32 18 30 22 Q28 26 30 30" stroke="#AAAAAA" strokeWidth="1" fill="none" />
    {/* Eye glow */}
    <Ellipse cx="22" cy="30" rx="3.5" ry="4" fill="#FF0000" opacity="0.5" />
    <Ellipse cx="38" cy="30" rx="3.5" ry="4" fill="#FF0000" opacity="0.5" />
  </Svg>
);

/* ─── 18: THUNDER ───────────────────────────────────────────────── */
const Thunder = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w18" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#1A1A00" />
        <Stop offset="1" stopColor="#3A3A00" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w18)" />
    {/* Outer glow circle */}
    <Circle cx="30" cy="30" r="20" fill="none" stroke="#FFA200" strokeWidth="1" opacity="0.3" />
    {/* Main lightning bolt */}
    <Path d="M36 8 L22 30 L28 30 L24 52 L38 28 L32 28 Z" fill="#FFA200" />
    {/* Inner bolt (lighter) */}
    <Path d="M35 12 L24 30 L29 30 L26 48 L37 30 L32 30 Z" fill="#FFEE44" opacity="0.6" />
    {/* Electric sparks */}
    <Line x1="12" y1="20" x2="18" y2="24" stroke="#FFA200" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <Line x1="10" y1="30" x2="16" y2="30" stroke="#FFA200" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <Line x1="42" y1="16" x2="48" y2="12" stroke="#FFA200" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <Line x1="44" y1="30" x2="50" y2="28" stroke="#FFA200" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <Line x1="14" y1="42" x2="20" y2="38" stroke="#FFA200" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    {/* Small sparks */}
    <Circle cx="14" cy="18" r="1.5" fill="#FFA200" opacity="0.8" />
    <Circle cx="46" cy="40" r="1.5" fill="#FFA200" opacity="0.8" />
    <Circle cx="48" cy="20" r="1" fill="#FFEE44" opacity="0.6" />
  </Svg>
);

/* ─── 19: VIPER ─────────────────────────────────────────────────── */
const Viper = ({ size = 60 }: AvatarProps) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    <Defs>
      <LinearGradient id="w19" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#001500" />
        <Stop offset="1" stopColor="#003800" />
      </LinearGradient>
    </Defs>
    <Circle cx="30" cy="30" r="30" fill="url(#w19)" />
    {/* Snake coil body */}
    <Path d="M30 50 Q48 46 48 30 Q48 14 30 14 Q12 14 12 30 Q12 42 22 46"
      stroke="#2A8A00" strokeWidth="8" fill="none" strokeLinecap="round" />
    <Path d="M30 50 Q48 46 48 30 Q48 14 30 14 Q12 14 12 30 Q12 42 22 46"
      stroke="#3AAA00" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.6" />
    {/* Snake head */}
    <Ellipse cx="30" cy="30" rx="12" ry="9" fill="#2A8A00" />
    <Ellipse cx="30" cy="30" rx="10" ry="7" fill="#3AAA00" />
    {/* Scale pattern */}
    <Path d="M22 28 Q26 24 30 28 Q34 24 38 28" stroke="#2A7800" strokeWidth="1" fill="none" />
    <Path d="M21 32 Q25 28 30 32 Q35 28 39 32" stroke="#2A7800" strokeWidth="1" fill="none" />
    {/* Slit eyes */}
    <Ellipse cx="24" cy="28" rx="4" ry="3.5" fill="#AADD00" />
    <Ellipse cx="36" cy="28" rx="4" ry="3.5" fill="#AADD00" />
    <Ellipse cx="24" cy="28" rx="1" ry="3" fill="#001A00" />
    <Ellipse cx="36" cy="28" rx="1" ry="3" fill="#001A00" />
    {/* Forked tongue */}
    <Path d="M28 35 Q30 38 32 35" stroke="#FF3A3A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <Path d="M30 35 L28 40" stroke="#FF3A3A" strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M30 35 L32 40" stroke="#FF3A3A" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

/* ─── Master lookup ─────────────────────────────────────────────── */
const AVATAR_COMPONENTS = [
  Warrior, Ninja, Robot, Mage, Sniper,
  Demon, Knight, Hacker, Ghost, Cyborg,
  Assassin, Dragon, Alien, Samurai, Phoenix,
  Gamer, Champion, Skull, Thunder, Viper,
];

export const AVATAR_NAMES = [
  'Warrior', 'Ninja', 'Robot', 'Mage', 'Sniper',
  'Demon', 'Knight', 'Hacker', 'Ghost', 'Cyborg',
  'Assassin', 'Dragon', 'Alien', 'Samurai', 'Phoenix',
  'Gamer', 'Champion', 'Skull', 'Thunder', 'Viper',
];

export const AVATAR_COUNT = AVATAR_COMPONENTS.length;

interface AvatarSVGProps {
  index: number;
  size?: number;
}

export function AvatarSVG({ index, size = 60 }: AvatarSVGProps) {
  const Component = AVATAR_COMPONENTS[index % AVATAR_COMPONENTS.length];
  return <Component size={size} />;
}
