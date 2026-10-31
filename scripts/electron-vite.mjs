// Lanza electron-vite sin ELECTRON_RUN_AS_NODE.
// Algunos terminales de editores definen esa variable y hacen que Electron arranque como Node
// (error: "Cannot read properties of undefined (reading 'isPackaged')").
//
// Opción --real: ejecuta con la IA real (DEMO_MODE=false) solo en esta ejecución, sin tocar el
// archivo .env. Las variables del proceso tienen prioridad sobre las del .env.
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const real = args.includes('--real')
const passthrough = args.filter((a) => a !== '--real')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
if (real) env.DEMO_MODE = 'false'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const bin = join(root, 'node_modules', 'electron-vite', 'bin', 'electron-vite.js')
const child = spawn(process.execPath, [bin, ...passthrough], { stdio: 'inherit', env })
child.on('exit', (code) => process.exit(code ?? 0))
