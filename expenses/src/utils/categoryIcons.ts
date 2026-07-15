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

export function getCategoryIcon(catValue: string | undefined): LucideIcon {
  if (!catValue) return CircleHelp;
  return categoryIcons[catValue] ?? CircleHelp;
}
