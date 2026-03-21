import {
  Trophy, Crosshair, Swords, Gamepad2, Activity, Shield,
  Zap, Target, Globe, Star, Flame, Crown, Rocket, Car,
  Music, Brain, Users, Grid3x3, Cpu, Sword,
  Layers, Compass, Map, Wind, Dumbbell, Eye,
  type LucideProps
} from 'lucide-react';
import React from 'react';

export type IconName =
  | 'Trophy' | 'Crosshair' | 'Swords' | 'Gamepad2' | 'Activity' | 'Shield'
  | 'Zap' | 'Target' | 'Globe' | 'Star' | 'Flame' | 'Crown' | 'Rocket' | 'Car'
  | 'Music' | 'Brain' | 'Users' | 'Grid3x3' | 'Cpu' | 'Sword'
  | 'Layers' | 'Compass' | 'Map' | 'Wind' | 'Dumbbell' | 'Eye';

export const ICON_REGISTRY: Record<IconName, React.ComponentType<LucideProps>> = {
  Trophy, Crosshair, Swords, Gamepad2, Activity, Shield,
  Zap, Target, Globe, Star, Flame, Crown, Rocket, Car,
  Music, Brain, Users, Grid3x3, Cpu, Sword,
  Layers, Compass, Map, Wind, Dumbbell, Eye,
};

export const ICON_OPTIONS: { name: IconName; label: string }[] = [
  { name: 'Trophy',     label: 'Trophy'      },
  { name: 'Crosshair',  label: 'Crosshair'   },
  { name: 'Swords',     label: 'Swords'      },
  { name: 'Gamepad2',   label: 'Gamepad'     },
  { name: 'Activity',   label: 'Activity'    },
  { name: 'Shield',     label: 'Shield'      },
  { name: 'Zap',        label: 'Zap'         },
  { name: 'Target',     label: 'Target'      },
  { name: 'Globe',      label: 'Globe'       },
  { name: 'Star',       label: 'Star'        },
  { name: 'Flame',      label: 'Flame'       },
  { name: 'Crown',      label: 'Crown'       },
  { name: 'Rocket',     label: 'Rocket'      },
  { name: 'Car',        label: 'Car'         },
  { name: 'Music',      label: 'Music'       },
  { name: 'Brain',      label: 'Brain'       },
  { name: 'Users',      label: 'Team'        },
  { name: 'Grid3x3',    label: 'Grid'        },
  { name: 'Cpu',        label: 'CPU'         },
  { name: 'Sword',      label: 'Sword'       },
  { name: 'Layers',     label: 'Layers'      },
  { name: 'Compass',    label: 'Compass'     },
  { name: 'Map',        label: 'Map'         },
  { name: 'Wind',       label: 'Wind'        },
  { name: 'Dumbbell',   label: 'Dumbbell'    },
  { name: 'Eye',        label: 'Eye'         },
];

export function getIcon(name: string): React.ComponentType<LucideProps> {
  return ICON_REGISTRY[name as IconName] ?? Gamepad2;
}
