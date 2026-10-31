import { checkImageFile, type AnalyzeImageInput } from '@shared/image'

export type ReadImageResult =
  | {
      ok: true
      input: AnalyzeImageInput
      /** Imagen lista para mostrar (data URL). */ preview: string
    }
  | { ok: false; message: string }

/** Valida y lee una captura como base64. Nunca lanza: devuelve un mensaje amable. */
export function readImageFile(file: File): Promise<ReadImageResult> {
  const problem = checkImageFile(file)
  if (problem) return Promise.resolve({ ok: false, message: problem })

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onerror = () =>
      resolve({ ok: false, message: 'No pude leer la imagen. Inténtalo de nuevo.' })
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : ''
      const comma = url.indexOf(',')
      if (comma === -1) {
        resolve({ ok: false, message: 'No pude leer la imagen. Inténtalo de nuevo.' })
        return
      }
      resolve({
        ok: true,
        preview: url,
        input: { mimeType: file.type as AnalyzeImageInput['mimeType'], data: url.slice(comma + 1) }
      })
    }
    reader.readAsDataURL(file)
  })
}

/** Primera imagen que haya en un conjunto de archivos (arrastrar y soltar o pegar). */
export function firstImage(files: FileList | null | undefined): File | null {
  if (!files) return null
  return Array.from(files).find((f) => f.type.startsWith('image/')) ?? files[0] ?? null
}
