import { withIds } from '../src/main/analysis/geminiProvider'
import { describe, expect, it } from 'vitest'
import {
  analyzeImageInputSchema,
  checkImageFile,
  MAX_IMAGE_BYTES,
  visionResultSchema
} from '../src/shared/image'

describe('checkImageFile', () => {
  it('acepta PNG, JPG y WEBP de tamaño razonable', () => {
    expect(checkImageFile({ type: 'image/png', size: 200_000 })).toBeNull()
    expect(checkImageFile({ type: 'image/jpeg', size: 1_000_000 })).toBeNull()
    expect(checkImageFile({ type: 'image/webp', size: MAX_IMAGE_BYTES })).toBeNull()
  })

  it('rechaza otros tipos de archivo con un mensaje claro', () => {
    expect(checkImageFile({ type: 'application/pdf', size: 1000 })).toMatch(/PNG, JPG o WEBP/)
    expect(checkImageFile({ type: 'image/gif', size: 1000 })).not.toBeNull()
    expect(checkImageFile({ type: '', size: 1000 })).not.toBeNull()
  })

  it('rechaza imágenes vacías o demasiado pesadas', () => {
    expect(checkImageFile({ type: 'image/png', size: 0 })).toMatch(/vacía/)
    expect(checkImageFile({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 })).toMatch(/pesa más/)
  })
})

describe('analyzeImageInputSchema (se vuelve a validar en main)', () => {
  const tinyPng =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

  it('acepta un PNG en base64', () => {
    expect(
      analyzeImageInputSchema.safeParse({ mimeType: 'image/png', data: tinyPng }).success
    ).toBe(true)
  })

  it('rechaza tipos no permitidos y datos que no son base64', () => {
    expect(
      analyzeImageInputSchema.safeParse({ mimeType: 'image/svg+xml', data: tinyPng }).success
    ).toBe(false)
    expect(
      analyzeImageInputSchema.safeParse({ mimeType: 'image/png', data: '¡no es base64!' }).success
    ).toBe(false)
  })

  it('rechaza datos que superan el límite de tamaño', () => {
    const huge = 'A'.repeat(Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 100)
    expect(analyzeImageInputSchema.safeParse({ mimeType: 'image/png', data: huge }).success).toBe(
      false
    )
  })
})

describe('visionResultSchema', () => {
  it('exige la transcripción además del resultado', () => {
    const base = {
      verdict: 'peligroso',
      score: 90,
      signals: [],
      recommendedAction: 'Bórralo.',
      creatureMessage: 'No hagas clic.'
    }
    expect(visionResultSchema.safeParse({ messages: [base] }).success).toBe(false)
    expect(
      visionResultSchema.safeParse({ messages: [{ ...base, extractedText: 'Ganaste un premio' }] })
        .success
    ).toBe(true)
  })

  it('acepta varios mensajes por captura, pero al menos uno y como mucho cinco', () => {
    const message = {
      verdict: 'seguro',
      score: 5,
      signals: [],
      recommendedAction: 'Nada.',
      creatureMessage: 'Todo bien.',
      extractedText: 'Hola'
    }
    expect(visionResultSchema.safeParse({ messages: [message, message] }).success).toBe(true)
    expect(visionResultSchema.safeParse({ messages: [] }).success).toBe(false)
    expect(visionResultSchema.safeParse({ messages: Array(6).fill(message) }).success).toBe(false)
  })
})

describe('withIds en capturas', () => {
  it('añade ids a las señales de cada mensaje de la lista', () => {
    const raw = {
      messages: [
        { signals: [{ kind: 'premio', label: 'Premio', severity: 'alta' }] },
        { signals: [] }
      ]
    }
    const out = withIds(raw) as { messages: Array<{ signals: Array<{ id: string }> }> }
    expect(out.messages[0].signals[0].id).toBe('ai-1')
    expect(out.messages[1].signals).toEqual([])
  })
})
