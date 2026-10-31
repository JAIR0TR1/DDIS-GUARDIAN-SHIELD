/* eslint-disable @typescript-eslint/explicit-function-return-type */
// Regenera el icono de la app con el Nilo 3D actual (npm run icon):
//  1. Abre la app en modo desarrollo en la pantalla interna #icon y captura a Nilo.
//  2. Aplica las esquinas redondeadas y arma build/icon.ico y build/icon.png.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const shotsDir = join(root, '.screenshots')
mkdirSync(shotsDir, { recursive: true })

function run(script, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(root, 'scripts', script), ...args], {
      stdio: 'inherit',
      cwd: root,
      env: { ...process.env, ...env }
    })
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${script} terminó con ${code}`))
    )
  })
}

const shots = JSON.stringify([
  {
    name: 'icon-source',
    wait: 2500,
    rect: { x: 0, y: 0, width: 512, height: 512 },
    js: "location.hash = '#icon'; location.reload()"
  }
])

await run('electron-vite.mjs', ['dev'], {
  GUARDIAN_SHOTS: shots,
  GUARDIAN_SHOTS_DIR: shotsDir,
  GUARDIAN_DATA_DIR: join(shotsDir, 'icon-data')
})
await run('run-electron.mjs', ['scripts/finish-icon.cjs'])
