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
  '1': 'rgba(232, 180, 184, 0.22)', // Clothing
  '2': 'rgba(252, 211, 77, 0.2)', // Entertainment
  '3': 'rgba(134, 239, 172, 0.2)', // Food
  '4': 'rgba(249, 168, 212, 0.22)', // Gifts
  '5': 'rgba(253, 186, 116, 0.22)', // Household
  '6': 'rgba(147, 197, 253, 0.22)', // Housing
  '7': 'rgba(252, 165, 165, 0.22)', // Medical
  '8': 'rgba(165, 180, 252, 0.22)', // Personal
  '9': 'rgba(103, 232, 249, 0.2)', // Transportation
  '10': 'rgba(253, 224, 71, 0.2)', // Utilities
  '11': 'rgba(125, 211, 252, 0.22)', // Travel
  '12': 'rgba(253, 164, 175, 0.22)', // Family
  '13': 'rgba(110, 231, 183, 0.2)', // Investment
};

export function getCategoryIcon(catValue: string | undefined): LucideIcon {
  if (!catValue) return CircleHelp;
  return categoryIcons[catValue] ?? CircleHelp;
}

export function getCategoryTint(catValue: string | undefined): string {
  if (!catValue) return 'rgba(255, 255, 255, 0.1)';
  return categoryTints[catValue] ?? 'rgba(255, 255, 255, 0.1)';
}
