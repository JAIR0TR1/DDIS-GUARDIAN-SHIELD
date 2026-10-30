import { useState } from 'react'
import { Inbox, Sparkles, WifiOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { GlassCard } from '../components/ui/GlassCard'
import { Badge, VerdictBadge } from '../components/ui/Badge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Switch } from '../components/ui/Switch'
import { Kbd } from '../components/ui/Kbd'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { ThreatResultCard } from '../components/ui/ThreatResultCard'
import { CreatureAvatar } from '../components/ui/CreatureAvatar'
import { Sidebar, type Section } from '../components/ui/Sidebar'
import { useToast } from '../components/ui/toastContext'
import { rarityColors, rarityLabels, type Rarity } from '@design/tokens'
import type { ThreatResult } from '@shared/threat'

const sample: ThreatResult = {
  verdict: 'peligroso',
  score: 92,
  signals: [
    { id: 'short', kind: 'link-acortado', label: 'Link acortado', severity: 'media' },
    { id: 'urgent', kind: 'urgencia', label: 'Mensaje con urgencia', severity: 'media' },
    { id: 'key', kind: 'pide-clave', label: 'Te pide la clave', severity: 'alta' }
  ],
  recommendedAction: 'Bórralo y no respondas. Si dudas, llama al número oficial de tu banco.',
  creatureMessage: 'No hagas clic. Te pide tu clave y ese link no es oficial.'
}

/** Galería de componentes (solo desarrollo, #gallery): todos los estados en un solo lugar. */
export function Gallery(): React.JSX.Element {
  const toast = useToast()
  const [on, setOn] = useState(true)
  const [section, setSection] = useState<Section>('inicio')

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
        <GlassCard title="Botones">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Analizar</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="ghost">Fantasma</Button>
            <Button variant="danger">Descartar</Button>
            <Button variant="primary" loading>
              Analizando
            </Button>
            <Button variant="secondary" disabled>
              Deshabilitado
            </Button>
            <Button variant="primary" size="lg" icon={<Sparkles aria-hidden className="size-4" />}>
              Despertar al Guardián
            </Button>
          </div>
          <div className="mt-4 flex gap-2">
            <IconButton
              label="Aviso"
              onClick={() => toast.show('Listo, Nilo está al día.', 'success')}
            >
              <Sparkles aria-hidden className="size-4" />
            </IconButton>
            <IconButton label="Activo" active>
              <Sparkles aria-hidden className="size-4" />
            </IconButton>
            <IconButton label="Deshabilitado" disabled>
              <Sparkles aria-hidden className="size-4" />
            </IconButton>
          </div>
        </GlassCard>

        <GlassCard title="Insignias, atajos y progreso">
          <div className="flex flex-wrap gap-2">
            <VerdictBadge verdict="seguro" />
            <VerdictBadge verdict="sospechoso" />
            <VerdictBadge verdict="peligroso" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(rarityColors) as Rarity[]).map((name) => (
              <Badge key={name} color={rarityColors[name]}>
                {rarityLabels[name]}
              </Badge>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Kbd keys="Ctrl+Shift+G" />
            <Kbd keys="Enter" />
          </div>
          <div className="mt-4 space-y-3">
            <ProgressBar value={240} max={400} label="Experiencia" />
            <ProgressBar value={80} label="Riesgo alto" tone="danger" />
          </div>
          <div className="mt-4">
            <Switch
              checked={on}
              onChange={setOn}
              label="Guardián activo"
              description="Vigila el portapapeles mientras la app está abierta."
            />
          </div>
        </GlassCard>

        <GlassCard title="Estados vacío, error y carga">
          <EmptyState
            icon={<Inbox className="size-5" />}
            title="Aún no hay nada que revisar"
            description="Pega un mensaje y Nilo lo mira por ti."
          />
          <EmptyState
            tone="error"
            icon={<WifiOff className="size-5" />}
            title="Sin conexión"
            description="No pude consultar a la IA. Usé las reglas locales."
            action={<Button variant="secondary">Reintentar</Button>}
          />
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        </GlassCard>

        <ThreatResultCard
          result={sample}
          text="Ganaste un premio. Confirma tu clave en bit.ly/premio-nequi"
        />

        <GlassCard title="Criatura" className="md:col-span-2">
          <div className="flex flex-wrap items-center gap-8">
            {(['reposo', 'escaneando', 'alerta', 'feliz'] as const).map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <CreatureAvatar size={120} state={s} title={`Nilo en estado ${s}`} />
                <span className="hud-label">{s}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2">
              <CreatureAvatar size={44} frame="badge" />
              <span className="hud-label">avatar</span>
            </div>
            <div className="h-[330px] overflow-hidden rounded-[16px] border border-white/10">
              <Sidebar
                current={section}
                onSelect={setSection}
                creatureSlot={<CreatureAvatar size={40} frame="badge" />}
              />
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
