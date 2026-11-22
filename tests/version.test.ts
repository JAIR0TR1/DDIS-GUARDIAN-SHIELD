import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '..')
const read = (file: string): string => readFileSync(resolve(root, file), 'utf-8')
const { version } = JSON.parse(read('package.json')) as { version: string }

describe('coherencia de la versión entre código y documentos', () => {
  it('el README nombra el instalador de la versión actual', () => {
    expect(read('README.md')).toContain(`EscudoGuardian-${version}-setup.exe`)
  })

  it('QA.md nombra el instalador de la versión actual', () => {
    expect(read('docs/QA.md')).toContain(`EscudoGuardian-${version}-setup.exe`)
  })

  it('CLAUDE.md menciona la versión actual', () => {
    expect(read('CLAUDE.md')).toContain(version)
  })

  it('existen las notas de versión de la versión actual', () => {
    expect(existsSync(resolve(root, `docs/release-notes-${version}.md`))).toBe(true)
  })

  it('el package-lock.json tiene la misma versión que package.json', () => {
    const lock = JSON.parse(read('package-lock.json')) as { version: string }
    expect(lock.version).toBe(version)
  })

  it('la versión sigue el formato mayor.menor.parche', () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
