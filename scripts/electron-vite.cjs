// Lanza electron-vite sin ELECTRON_RUN_AS_NODE.
// Algunos terminales de editores definen esa variable y hacen que Electron arranque como Node
// (error: "Cannot read properties of undefined (reading 'isPackaged')").
const { spawn } = require('node:child_process')
const { join } = require('node:path')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const bin = join(__dirname, '..', 'node_modules', 'electron-vite', 'bin', 'electron-vite.js')
const child = spawn(process.execPath, [bin, ...process.argv.slice(2)], { stdio: 'inherit', env })
child.on('exit', (code) => process.exit(code ?? 0))
