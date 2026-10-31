import type { Severity, SignalKind, Verdict } from '../shared/threat'
import { BRANDS, hostImitatesBrand, isOfficialHost, type Brand } from './brands'
import { findLinks, fold, spansOf, type FoundLink, type Span } from './text'

/** Una señal detectada por las reglas locales. */
export interface RuleHit {
  id: string
  kind: SignalKind
  label: string
  severity: Severity
  /** Peso entre 0 y 1: qué tan probable es una estafa solo por esta señal. */
  weight: number
  /** Posiciones en el texto original, para resaltar en pantalla. */
  spans: Span[]
}

export interface LocalAnalysis {
  /** Puntaje de riesgo 0-100. */
  score: number
  verdict: Verdict
  hits: RuleHit[]
  /** `true` si cae entre los umbrales: hay que consultar a la IA. */
  needsAI: boolean
}

export interface Thresholds {
  safeBelow: number
  dangerAbove: number
}

export const DEFAULT_THRESHOLDS: Thresholds = { safeBelow: 30, dangerAbove: 70 }

interface Ctx {
  /** Texto normalizado (sin tildes, minúsculas). Mismos índices que el original. */
  t: string
  links: FoundLink[]
}

type Rule = (ctx: Ctx) => RuleHit | RuleHit[] | null

const severityOf = (weight: number): Severity =>
  weight >= 0.5 ? 'alta' : weight >= 0.3 ? 'media' : 'baja'

function hit(id: string, kind: SignalKind, label: string, weight: number, spans: Span[]): RuleHit {
  return { id, kind, label, severity: severityOf(weight), weight, spans }
}

// ---------- Vocabulario (todo sin tildes y en minúsculas) ----------

const SECRET =
  /\b(?:clave(?: dinamica| de (?:ingreso|acceso|cajero))?|contrasena|password|pin|cvv|codigo (?:de )?(?:verificacion|seguridad|confirmacion|sms|otp|de \d+ digitos)|otp|token|numero de (?:tarjeta|cuenta)|datos bancarios|cedula y clave)\b/
const SECRET_ACTION =
  /\b(?:envi\w*|confirm\w*|ingres\w*|digit\w*|compart\w*|dame|dime|actualiz\w*|verific\w*|valid\w*|reporta\w*|suministr\w*|proporcion\w*|escrib\w*)\b/
/** Avisos legítimos ("nunca te pediremos tu clave") no deben marcarse. */
const NEGATION =
  /\b(?:nunca|jamas|no (?:lo |la |se |te |le )?(?:compart|solicit|pedim|entregu|reveles|digas|des))/

const URGENCY =
  /\b(?:urgente|inmediat\w+|de inmediato|ahora mismo|ultim[oa]s? (?:aviso|horas|oportunidad|dia)|hoy mismo|(?:en|dentro de|antes de) (?:las )?(?:proximas )?\d+ ?(?:horas|hrs|minutos|min)|antes de que|de lo contrario|expira|vence hoy|apresurate)\b/
const THREAT =
  /\b(?:bloquead\w*|bloquear\w*|suspend\w*|cancelad\w*|desactivad\w*|inhabilitad\w*|embarg\w*|multa|cierre de (?:tu |su )?cuenta)\b/

const PRIZE =
  /\b(?:ganaste|has ganado|ganador(?:a)?|sorteo|rifa|premio|reclama (?:tu|ya|el)|fuiste seleccionad[oa]|bono de|(?:felicitaciones|felicidades)[^.]{0,40}(?:ganaste|ganador|premio|seleccionad\w+|bono))\b/
const SUBSIDY =
  /\b(?:subsidio|ingreso solidario|renta ciudadana|devolucion del iva|ayuda (?:economica )?del gobierno|bono (?:solidario|del gobierno)|jovenes en accion|familias en accion)\b/

const PROOF =
  /\b(?:comprobante|soporte de (?:pago|transferencia)|recibo de pago|captura del? pago)\b/
const PROOF_OPEN = /\b(?:adjunt\w*|descarg\w*|abre|ver |mira|link|apk|pdf|zip)\b/
const MISTAKEN_PAYMENT =
  /\b(?:consign\w*|transfer\w*|envi\w*|mand\w*) (?:de )?(?:mas|por error|equivocad\w*)|\bme equivoque\b/
const RETURN_MONEY = /\b(?:devuelv\w*|regres\w*|reembols\w*|reintegr\w*)\b/
const RISKY_FILE = /\.(?:apk|exe|scr|bat)\b/

const PARCEL = /\b(?:paquete|envio|encomienda|pedido|giro|guia)\b/
const PARCEL_PROBLEM =
  /\b(?:retenid\w*|no (?:pudo|fue posible) (?:ser )?entregad\w*|intento de entrega|devuelt\w*|direccion (?:incorrecta|incompleta|erronea)|pendiente de (?:pago|entrega)|costo de (?:envio|reenvio)|arancel\w*|aduana|liberar\w*|reprogram\w*)\b/

const JOB =
  /\b(?:oferta (?:de )?(?:empleo|trabajo|laboral)|trabaja desde casa|trabajo (?:desde casa|remoto)|ingresos? extras?|sin experiencia|gana (?:hasta )?\$? ?\d|ganar \$? ?\d|contratacion inmediata)\b/
const JOB_FEE =
  /\b(?:deposit\w*|inscripcion|pago (?:inicial|de (?:afiliacion|uniforme|capacitacion))|kit de|capacitacion paga|consignar \$? ?\d)\b/

const SUPPORT =
  /\b(?:soporte tecnico|servicio tecnico|equipo (?:infectado|comprometido)|virus|actividad sospechosa|acceso no autorizado|cuenta (?:comprometida|hackeada|vulnerada)|seguridad de tu cuenta)\b/
const REMOTE =
  /\b(?:anydesk|teamviewer|quicksupport|ultraviewer|acceso remoto|instal\w+ (?:la |el )?(?:aplicacion|programa|app))\b/

const NUMBER_CHANGE =
  /\b(?:cambie de (?:numero|celular|cel)|(?:este es|es) mi nuevo (?:numero|cel|celular|whatsapp)|guarda(?:me)? (?:este|mi) (?:nuevo )?numero|mi (?:celular|telefono) (?:se )?(?:dano|perdio|robaron|cayo)|nuevo whatsapp)\b/
const MONEY_ASK =
  /\b(?:prestame|presteme|transfer\w*|consign\w*|envia\w* (?:plata|dinero|\$)|nequi|daviplata|plata|urge|urgente)\b/

const LOAN =
  /\b(?:(?:prestamo|credito|desembolso|dinero) (?:inmediato|aprobado|rapido|facil)|sin (?:papeles|reporte|codeudor|tramites|estudio)|gota a gota|aprobado al instante)\b/
const ADVANCE_FEE =
  /\b(?:pago (?:adelantado|anticipado|previo)|por adelantado|anticipo|para (?:liberar|desembolsar|habilitar)[^.]{0,30}(?:deposit|consign|pag)\w*)\b/
const INVEST =
  /\b(?:duplica\w* (?:tu )?(?:dinero|inversion)|multiplic\w+ (?:tu )?(?:dinero|inversion)|rentabilidad (?:garantizada|del? \d+ ?%)|inversion segura|sin riesgo)\b/

const SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  'cutt.ly',
  'goo.gl',
  'is.gd',
  'shorturl.at',
  'rb.gy',
  'ow.ly',
  'tiny.cc',
  't.ly',
  'buff.ly',
  'rebrand.ly'
])
const RISKY_TLDS = new Set([
  'xyz',
  'top',
  'click',
  'site',
  'online',
  'icu',
  'live',
  'vip',
  'buzz',
  'work',
  'rest',
  'monster'
])

// ---------- Reglas ----------

const linkRules: Rule = ({ links }) => {
  const hits: RuleHit[] = []
  const shortened = links.filter((l) => SHORTENERS.has(l.host))
  if (shortened.length > 0)
    hits.push(
      hit(
        'short-link',
        'link-acortado',
        'Link acortado',
        0.3,
        shortened.map((l) => l.span)
      )
    )

  const riskyTld = links.filter((l) => RISKY_TLDS.has(l.host.split('.').pop() ?? ''))
  if (riskyTld.length > 0)
    hits.push(
      hit(
        'risky-tld',
        'dominio-sospechoso',
        'Dominio poco confiable',
        0.28,
        riskyTld.map((l) => l.span)
      )
    )

  const odd = links.filter((l) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(l.host) || l.hasUserInfo)
  if (odd.length > 0)
    hits.push(
      hit(
        'odd-host',
        'dominio-sospechoso',
        'Link con dirección rara',
        0.5,
        odd.map((l) => l.span)
      )
    )
  return hits
}

const brandLookalike: Rule = ({ links }) => {
  const spans: Span[] = []
  const names = new Set<string>()
  for (const link of links) {
    for (const brand of BRANDS) {
      if (hostImitatesBrand(link.host, brand)) {
        spans.push(link.span)
        names.add(brand.label)
      }
    }
  }
  if (names.size === 0) return null
  return hit('brand-lookalike', 'suplanta-marca', `Link que imita a ${[...names][0]}`, 0.8, spans)
}

/** El mensaje nombra una marca pero el link va a otro lado. */
function mentionedBrands(t: string): Brand[] {
  return BRANDS.filter((b) => b.mentions.some((m) => new RegExp(`\\b${m}\\b`).test(t)))
}

const brandMismatch: Rule = ({ t, links }) => {
  if (links.length === 0) return null
  const brands = mentionedBrands(t).filter((b) => b.distinctive || b.id === 'dian')
  const offending = brands.filter((b) => !links.some((l) => isOfficialHost(l.host, b)))
  if (offending.length === 0) return null
  return hit(
    'brand-mismatch',
    'suplanta-marca',
    `Dice ser ${offending[0].label}, pero el link no es oficial`,
    0.55,
    links.map((l) => l.span)
  )
}

const asksSecret: Rule = ({ t }) => {
  const secret = spansOf(SECRET, t)
  if (secret.length === 0 || !SECRET_ACTION.test(t) || NEGATION.test(t)) return null
  const out: RuleHit[] = [
    hit('ask-secret', 'pide-clave', 'Te pide la clave o un código', 0.55, secret)
  ]
  const brands = mentionedBrands(t).filter((b) => b.distinctive)
  if (brands.length > 0)
    out.push(
      hit(
        'brand-asks-secret',
        'suplanta-marca',
        `Dice ser ${brands[0].label} y te pide datos`,
        0.45,
        []
      )
    )
  return out
}

const urgency: Rule = ({ t }) => {
  const urgent = spansOf(URGENCY, t)
  const threat = spansOf(THREAT, t)
  if (urgent.length === 0 && threat.length === 0) return null
  if (urgent.length > 0 && threat.length > 0)
    return hit('urgency-threat', 'urgencia', 'Urgencia con amenaza', 0.35, [...urgent, ...threat])
  return hit('urgency', 'urgencia', 'Mensaje con urgencia', 0.22, [...urgent, ...threat])
}

const prizes: Rule = ({ t }) => {
  const prize = spansOf(PRIZE, t)
  return prize.length > 0 ? hit('prize', 'premio', 'Te dicen que ganaste algo', 0.35, prize) : null
}

const subsidy: Rule = ({ t, links }) => {
  const s = spansOf(SUBSIDY, t)
  if (s.length === 0) return null
  return links.length > 0
    ? hit('subsidy-link', 'premio', 'Subsidio con link sospechoso', 0.5, s)
    : hit('subsidy', 'premio', 'Habla de un subsidio', 0.25, s)
}

const proofs: Rule = ({ t, links }) => {
  const out: RuleHit[] = []
  const proof = spansOf(PROOF, t)
  if (proof.length > 0 && (links.length > 0 || PROOF_OPEN.test(t)))
    out.push(hit('proof-open', 'comprobante', 'Comprobante con link o archivo', 0.45, proof))
  const mistaken = spansOf(MISTAKEN_PAYMENT, t)
  if (mistaken.length > 0 && RETURN_MONEY.test(t))
    out.push(
      hit(
        'mistaken-payment',
        'comprobante',
        'Dice que se equivocó y te pide devolver plata',
        0.55,
        mistaken
      )
    )
  const file = spansOf(RISKY_FILE, t)
  if (file.length > 0)
    out.push(hit('risky-file', 'otro', 'Archivo que puede traer un virus', 0.5, file))
  return out
}

const parcels: Rule = ({ t, links }) => {
  const parcel = spansOf(PARCEL, t)
  const problem = spansOf(PARCEL_PROBLEM, t)
  if (parcel.length === 0 || problem.length === 0) return null
  return hit('parcel', 'paquete', 'Paquete retenido o con cobro', links.length > 0 ? 0.55 : 0.35, [
    ...parcel,
    ...problem
  ])
}

const jobs: Rule = ({ t }) => {
  const job = spansOf(JOB, t)
  if (job.length === 0) return null
  const fee = spansOf(JOB_FEE, t)
  return fee.length > 0
    ? hit('job-fee', 'empleo', 'Empleo que te cobra para empezar', 0.75, [...job, ...fee])
    : hit('job', 'empleo', 'Oferta de empleo sospechosa', 0.25, job)
}

const support: Rule = ({ t }) => {
  const s = spansOf(SUPPORT, t)
  const r = spansOf(REMOTE, t)
  if (s.length > 0 && r.length > 0)
    return hit('fake-support', 'soporte', 'Soporte falso que pide acceso a tu equipo', 0.8, [
      ...s,
      ...r
    ])
  if (r.length > 0)
    return hit('remote-access', 'soporte', 'Te piden instalar acceso remoto', 0.5, r)
  if (s.length > 0) return hit('support', 'soporte', 'Habla de un problema de seguridad', 0.2, s)
  return null
}

const numberChange: Rule = ({ t }) => {
  const change = spansOf(NUMBER_CHANGE, t)
  if (change.length === 0) return null
  const ask = spansOf(MONEY_ASK, t)
  return ask.length > 0
    ? hit('number-change-money', 'cambio-numero', 'Dice que cambió de número y pide plata', 0.65, [
        ...change,
        ...ask
      ])
    : hit('number-change', 'cambio-numero', 'Dice que cambió de número', 0.3, change)
}

const money: Rule = ({ t }) => {
  const out: RuleHit[] = []
  const loan = spansOf(LOAN, t)
  const advance = spansOf(ADVANCE_FEE, t)
  if (loan.length > 0) out.push(hit('loan', 'dinero', 'Préstamo demasiado fácil', 0.35, loan))
  if (advance.length > 0)
    out.push(hit('advance-fee', 'dinero', 'Te piden pagar antes de recibir', 0.5, advance))
  const invest = spansOf(INVEST, t)
  if (invest.length > 0)
    out.push(hit('invest', 'dinero', 'Promete multiplicar tu dinero', 0.5, invest))
  return out
}

const RULES: readonly Rule[] = [
  linkRules,
  brandLookalike,
  brandMismatch,
  asksSecret,
  urgency,
  prizes,
  subsidy,
  proofs,
  parcels,
  jobs,
  support,
  numberChange,
  money
]

/** Combina pesos como probabilidades independientes: 1 − Π(1 − wᵢ). */
export function combineWeights(weights: readonly number[]): number {
  const safe = weights.reduce((acc, w) => acc * (1 - Math.min(0.99, Math.max(0, w))), 1)
  return Math.round((1 - safe) * 100)
}

export function verdictFor(score: number, thresholds: Thresholds): Verdict {
  if (score > thresholds.dangerAbove) return 'peligroso'
  if (score < thresholds.safeBelow) return 'seguro'
  return 'sospechoso'
}

/** Análisis con reglas locales: rápido, sin red, determinista. */
export function analyzeLocal(
  text: string,
  thresholds: Thresholds = DEFAULT_THRESHOLDS
): LocalAnalysis {
  const ctx: Ctx = { t: fold(text), links: findLinks(text) }
  const hits = RULES.flatMap((rule) => {
    const result = rule(ctx)
    return result === null ? [] : Array.isArray(result) ? result : [result]
  }).sort((a, b) => b.weight - a.weight)

  const score = combineWeights(hits.map((h) => h.weight))
  const verdict = verdictFor(score, thresholds)
  return { score, verdict, hits, needsAI: verdict === 'sospechoso' }
}
