import {
  Volume2,
  Mic,
  Megaphone,
  Music,
  Music2,
  Music3,
  Music4,
  Drama,
  PartyPopper,
  Laugh,
  Angry,
  Frown,
  Smile,
  Skull,
  Ghost,
  Zap,
  Flame,
  Siren,
  Bell,
  BellRing,
  AlarmClock,
  Rocket,
  Bomb,
  Car,
  Bike,
  Plane,
  TrainFront,
  Dog,
  Cat,
  Bird,
  Fish,
  Rabbit,
  Trophy,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Clapperboard,
  Guitar,
  Piano,
  Radio,
  Speaker,
  Headphones,
  Gamepad2,
  Crown,
  Sparkles,
  FlameKindling,
} from '@lucide/svelte';

const PREFIX = 'lucide:';

/** Set curato di icone Lucide selezionabili in alternativa alle emoji. */
export const LUCIDE_ICONS = {
  Volume2,
  Mic,
  Megaphone,
  Music,
  Music2,
  Music3,
  Music4,
  Drama,
  PartyPopper,
  Laugh,
  Angry,
  Frown,
  Smile,
  Skull,
  Ghost,
  Zap,
  Flame,
  Siren,
  Bell,
  BellRing,
  AlarmClock,
  Rocket,
  Bomb,
  Car,
  Bike,
  Plane,
  TrainFront,
  Dog,
  Cat,
  Bird,
  Fish,
  Rabbit,
  Trophy,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Clapperboard,
  Guitar,
  Piano,
  Radio,
  Speaker,
  Headphones,
  Gamepad2,
  Crown,
  Sparkles,
  FlameKindling,
};

/** Un'icona Lucide viene salvata come stringa "lucide:NomeIcona"; le emoji restano il carattere Unicode diretto. */
export function isLucideIcon(icon) {
  return typeof icon === 'string' && icon.startsWith(PREFIX);
}

export function lucideIconName(icon) {
  return icon.slice(PREFIX.length);
}

export function toLucideIcon(name) {
  return `${PREFIX}${name}`;
}

export function getLucideComponent(icon) {
  return LUCIDE_ICONS[lucideIconName(icon)] ?? null;
}
