import type { HistoryEntry } from '@shared/history'

/** Datos de ejemplo SOLO para desarrollo (hash #sample): verificar el diseño con contenido. */
const minutesAgo = (m: number): string => new Date(Date.now() - m * 60000).toISOString()

export const sampleHistory: HistoryEntry[] = [
  {
    id: 's1',
    at: minutesAgo(3),
    source: 'text',
    excerpt: 'Ganaste un premio. Confirma tu clave en bit.ly/premio-nequi',
    usedAI: false,
    result: {
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
  },
  {
    id: 's2',
    at: minutesAgo(60 * 20),
    source: 'text',
    excerpt: 'Oferta de préstamo inmediato sin papeles',
    usedAI: true,
    result: {
      verdict: 'sospechoso',
      score: 55,
      signals: [{ id: 'money', kind: 'dinero', label: 'Promete dinero fácil', severity: 'media' }],
      recommendedAction: 'Verifica la empresa antes de dar datos.',
      creatureMessage: 'Hmm, algo no me cuadra.'
    }
  },
  {
    id: 's3',
    at: minutesAgo(60 * 44),
    source: 'text',
    excerpt: 'Recordatorio de clase: mañana 8 a. m. salón 204',
    usedAI: false,
    result: {
      verdict: 'seguro',
      score: 4,
      signals: [],
      recommendedAction: 'No hace falta hacer nada.',
      creatureMessage: 'Todo en orden.'
    }
  }
]
