/** Marcas que los estafadores suplantan en Colombia, y sus dominios oficiales. Dominio puro. */

export interface Brand {
  id: string
  /** Nombre para mostrar. */
  label: string
  /** Formas con las que se nombra en un texto (ya normalizadas, sin tildes). */
  mentions: readonly string[]
  /** Dominios oficiales: el host debe ser uno de ellos o un subdominio. */
  official: readonly string[]
  /**
   * `false` si el nombre es también una palabra común ("claro"): no se usa para detectar
   * menciones ni coincidencias parciales en dominios.
   */
  distinctive: boolean
}

export const BRANDS: readonly Brand[] = [
  {
    id: 'nequi',
    label: 'Nequi',
    mentions: ['nequi'],
    official: ['nequi.com', 'nequi.com.co'],
    distinctive: true
  },
  {
    id: 'daviplata',
    label: 'Daviplata',
    mentions: ['daviplata'],
    official: ['daviplata.com'],
    distinctive: true
  },
  {
    id: 'bancolombia',
    label: 'Bancolombia',
    mentions: ['bancolombia'],
    official: ['bancolombia.com', 'grupobancolombia.com', 'bancolombia.com.co'],
    distinctive: true
  },
  {
    id: 'davivienda',
    label: 'Davivienda',
    mentions: ['davivienda'],
    official: ['davivienda.com'],
    distinctive: true
  },
  {
    id: 'bbva',
    label: 'BBVA',
    mentions: ['bbva'],
    official: ['bbva.com.co', 'bbva.com'],
    distinctive: true
  },
  {
    id: 'servientrega',
    label: 'Servientrega',
    mentions: ['servientrega'],
    official: ['servientrega.com'],
    distinctive: true
  },
  {
    id: 'coordinadora',
    label: 'Coordinadora',
    mentions: ['coordinadora'],
    official: ['coordinadora.com'],
    distinctive: true
  },
  {
    id: 'interrapidisimo',
    label: 'Interrapidísimo',
    mentions: ['interrapidisimo'],
    official: ['interrapidisimo.com'],
    distinctive: true
  },
  {
    id: 'dian',
    label: 'DIAN',
    mentions: ['dian'],
    official: ['dian.gov.co'],
    distinctive: false
  },
  {
    id: 'sisben',
    label: 'Sisbén',
    mentions: ['sisben'],
    official: ['sisben.gov.co'],
    distinctive: true
  },
  {
    id: 'colpensiones',
    label: 'Colpensiones',
    mentions: ['colpensiones'],
    official: ['colpensiones.gov.co'],
    distinctive: true
  },
  {
    id: 'mercadolibre',
    label: 'Mercado Libre',
    mentions: ['mercadolibre', 'mercado libre'],
    official: ['mercadolibre.com', 'mercadolibre.com.co', 'mercadopago.com.co'],
    distinctive: true
  },
  {
    id: 'netflix',
    label: 'Netflix',
    mentions: ['netflix'],
    official: ['netflix.com'],
    distinctive: true
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    mentions: ['whatsapp'],
    official: ['whatsapp.com', 'wa.me'],
    distinctive: true
  },
  {
    id: 'microsoft',
    label: 'Microsoft',
    mentions: ['microsoft'],
    official: ['microsoft.com', 'live.com', 'office.com'],
    distinctive: true
  },
  {
    id: 'claro',
    label: 'Claro',
    mentions: ['claro'],
    official: ['claro.com.co'],
    distinctive: false
  },
  {
    id: 'movistar',
    label: 'Movistar',
    mentions: ['movistar'],
    official: ['movistar.com.co'],
    distinctive: true
  },
  {
    id: 'tigo',
    label: 'Tigo',
    mentions: ['tigo'],
    official: ['tigo.com.co'],
    distinctive: true
  }
]

export function isOfficialHost(host: string, brand: Brand): boolean {
  return brand.official.some((d) => host === d || host.endsWith(`.${d}`))
}

/** Sustituciones típicas para imitar una marca: 0→o, 1→i, 3→e, 4→a, 5→s. */
export function unleet(text: string): string {
  return text.replace(
    /[01345@]/g,
    (c) => ({ '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '@': 'a' })[c] ?? c
  )
}

function levenshteinAtMost1(a: string, b: string): boolean {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1)
  const [short, long] = a.length < b.length ? [a, b] : [b, a]
  return short.slice(i) === long.slice(i + 1)
}

/**
 * ¿El host imita a la marca? Compara cada etiqueta del dominio (separada por . o -):
 * igual, con sustituciones tipo "coord1nadora", con una letra de diferencia, o que
 * empiece/termine con el nombre ("nequipremios").
 */
export function hostImitatesBrand(host: string, brand: Brand): boolean {
  if (isOfficialHost(host, brand)) return false
  const labels = host.split(/[.-]/).filter(Boolean)
  // La extensión (.com, .co) no cuenta como etiqueta de marca.
  const body = labels.slice(0, -1)
  return brand.mentions
    .map((m) => m.replaceAll(' ', ''))
    .some((token) =>
      body.some((label) => {
        const plain = unleet(label)
        if (plain === token || label === token) return true
        if (!brand.distinctive) return false
        if (token.length >= 6 && levenshteinAtMost1(plain, token)) return true
        return token.length >= 5 && (plain.startsWith(token) || plain.endsWith(token))
      })
    )
}
