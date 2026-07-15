export type Tournament = {
  id: string;
  title: string;
  mode: string;
  map: string;
  slotsTotal: number;
  slotsFilled: number;
  prize: number;
  entry: number;
  perKill?: number;
  matchId: string;
  dateTime: string;
  category: string;
  status?: "upcoming" | "live" | "played";
  wonAmount?: number;
  position?: number;
};

export const CATEGORIES = [
  "All",
  "Solo BR",
  "Duo BR",
  "Squad BR",
  "Elite Solo",
  "Solo Per Kill",
  "CS Mode",
];

export const TOURNAMENTS: Tournament[] = [
  {
    id: "t1",
    title: "Free Fire — Solo Hunter",
    mode: "SOLO",
    map: "BERMUDA",
    slotsTotal: 32,
    slotsFilled: 32,
    prize: 230,
    entry: 8,
    matchId: "#FF23481",
    dateTime: "15 Jul • 05:30 PM",
    category: "Solo BR",
  },
  {
    id: "t2",
    title: "Elite Duo Showdown",
    mode: "DUO",
    map: "PURGATORY",
    slotsTotal: 24,
    slotsFilled: 13,
    prize: 480,
    entry: 20,
    matchId: "#FF23492",
    dateTime: "15 Jul • 07:00 PM",
    category: "Duo BR",
  },
  {
    id: "t3",
    title: "Per Kill Mayhem",
    mode: "SOLO",
    map: "KALAHARI",
    slotsTotal: 48,
    slotsFilled: 21,
    prize: 0,
    perKill: 8,
    entry: 15,
    matchId: "#FF23503",
    dateTime: "15 Jul • 09:15 PM",
    category: "Solo Per Kill",
  },
  {
    id: "t4",
    title: "Squad Rush League",
    mode: "SQUAD",
    map: "BERMUDA",
    slotsTotal: 12,
    slotsFilled: 12,
    prize: 900,
    entry: 40,
    matchId: "#FF23511",
    dateTime: "16 Jul • 06:00 PM",
    category: "Squad BR",
  },
  {
    id: "t5",
    title: "Elite Solo Championship",
    mode: "ELITE",
    map: "BERMUDA",
    slotsTotal: 40,
    slotsFilled: 8,
    prize: 1200,
    entry: 50,
    matchId: "#FF23522",
    dateTime: "16 Jul • 10:00 PM",
    category: "Elite Solo",
  },
];

export const MY_MATCHES: Tournament[] = [
  { ...TOURNAMENTS[1], status: "upcoming" },
  { ...TOURNAMENTS[2], status: "live" },
  {
    ...TOURNAMENTS[0],
    id: "p1",
    status: "played",
    wonAmount: 7,
    position: 14,
  },
  {
    ...TOURNAMENTS[3],
    id: "p2",
    status: "played",
    wonAmount: 0,
  },
];

export const PRIZE_DISTRIBUTION = [
  { rank: 1, prize: 50 },
  { rank: 2, prize: 40 },
  { rank: 3, prize: 30 },
  { rank: 4, prize: 20 },
  { rank: 5, prize: 15 },
  { rank: 6, prize: 12 },
  { rank: 7, prize: 10 },
  { rank: 8, prize: 8 },
];

export const RULES = [
  "Screen recording is mandatory for all participants.",
  "No use of emotes or emulators during matches.",
  "Only mobile devices are allowed — tablets & iPads restricted.",
  "Teaming with other solo players will result in a permanent ban.",
  "Room ID & password will be shared 10 minutes before match start.",
  "Any hacks, mods, or third-party tools = instant disqualification.",
  "Screenshots of the final position must be uploaded within 15 minutes.",
];

export const PLAYERS = [
  "ShadowStrikeX", "GhostReaperOP", "NoobSlayer99", "PhantomAce",
  "RedViperKING", "SavageQueen", "BloodMoonYT", "IronFistPro",
  "NinjaBoltZ", "ThunderGodX", "VenomFang", "AlphaWolfHD",
  "SilentKillerOP", "DesertFoxIN", "BlazeRunner", "CyberMonkX",
  "ChaosGamerYT", "MysticNovaX", "TitanForge", "NightHawkPro",
  "InfernoKingz", "FrostByteHD", "SolarFlareOP", "EchoBladeX",
];

export const LEADERBOARD = [
  { ign: "ShadowStrikeX", earnings: 73800 },
  { ign: "GhostReaperOP", earnings: 58400 },
  { ign: "PhantomAceHD", earnings: 41250 },
  { ign: "RedViperKING", earnings: 22100 },
  { ign: "NinjaBoltZ", earnings: 14800 },
  { ign: "SavageQueen", earnings: 9420 },
  { ign: "IronFistPro", earnings: 6180 },
  { ign: "ThunderGodX", earnings: 3720 },
  { ign: "VenomFang", earnings: 2140 },
  { ign: "BlazeRunner", earnings: 1180 },
  { ign: "AlphaWolfHD", earnings: 820 },
  { ign: "SilentKillerOP", earnings: 410 },
];
