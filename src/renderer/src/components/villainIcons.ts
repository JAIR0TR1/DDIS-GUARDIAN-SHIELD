import {
  BadgeDollarSign,
  Briefcase,
  Gift,
  Headset,
  Landmark,
  Package,
  Receipt,
  Smartphone,
  VenetianMask,
  type LucideIcon
} from 'lucide-react'
import type { VillainId } from '@domain/villains'

/** Icono de cada villano (la identidad visual; nombres y textos están en los diccionarios). */
export const villainIcons: Record<VillainId, LucideIcon> = {
  familiar: Smartphone,
  comprobante: Receipt,
  paquete: Package,
  empleo: Briefcase,
  dinero: BadgeDollarSign,
  premio: Gift,
  soporte: Headset,
  banco: Landmark,
  impostor: VenetianMask
}
