import {
  Shirt,
  Clapperboard,
  UtensilsCrossed,
  Gift,
  ShoppingBasket,
  House,
  HeartPulse,
  User,
  Car,
  Zap,
  Plane,
  Users,
  ChartLine,
  CircleHelp,
  type LucideIcon,
} from 'lucide-react';

/** Monochrome Lucide icons for expense categories — one clear metaphor each. */
export const categoryIcons: Record<string, LucideIcon> = {
  '1': Shirt, // Clothing
  '2': Clapperboard, // Entertainment
  '3': UtensilsCrossed, // Food
  '4': Gift, // Gifts
  '5': ShoppingBasket, // Household Items/Supplies
  '6': House, // Housing
  '7': HeartPulse, // Medical / Healthcare
  '8': User, // Personal
  '9': Car, // Transportation
  '10': Zap, // Utilities
  '11': Plane, // Travel
  '12': Users, // Family
  '13': ChartLine, // Investment
};

/** Soft chip background tints — icon stroke stays monochrome. */
export const categoryTints: Record<string, string> = {
  '1': 'rgba(232, 180, 184, 0.22)', // Clothing — dusty rose
  '2': 'rgba(167, 139, 250, 0.24)', // Entertainment — soft violet
  '3': 'rgba(134, 239, 172, 0.2)', // Food — mint green
  '4': 'rgba(249, 168, 212, 0.22)', // Gifts — pink
  '5': 'rgba(214, 176, 140, 0.26)', // Household — warm linen
  '6': 'rgba(147, 197, 253, 0.22)', // Housing — sky blue
  '7': 'rgba(252, 165, 165, 0.22)', // Medical — soft red
  '8': 'rgba(216, 180, 254, 0.24)', // Personal — orchid (distinct from housing)
  '9': 'rgba(103, 232, 249, 0.2)', // Transportation — cyan
  '10': 'rgba(129, 140, 248, 0.28)', // Utilities — soft indigo
  '11': 'rgba(45, 212, 191, 0.22)', // Travel — turquoise
  '12': 'rgba(251, 146, 120, 0.24)', // Family — warm coral
  '13': 'rgba(52, 211, 153, 0.26)', // Investment — emerald
};

export function getCategoryIcon(catValue: string | undefined): LucideIcon {
  if (!catValue) return CircleHelp;
  return categoryIcons[catValue] ?? CircleHelp;
}

export function getCategoryTint(catValue: string | undefined): string {
  if (!catValue) return 'rgba(255, 255, 255, 0.1)';
  return categoryTints[catValue] ?? 'rgba(255, 255, 255, 0.1)';
}
