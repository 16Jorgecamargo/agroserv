import { spawn, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'

const root = process.cwd()
const backendDir = join(root, 'backend')
const isWindows = process.platform === 'win32'
const colors = { api: '\x1b[32m', web: '\x1b[36m', dev: '\x1b[33m' }
const reset = '\x1b[0m'
const children = new Set()
let stopping = false

function log(name, message) {
  console.log(`${colors[name]}[${name}]${reset} ${message}`)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readEnvFile(path) {
  const values = {}
  readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (match) values[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
    })
  return values
}

function hasCommand(command) {
  return spawnSync(command, ['--version'], { stdio: 'ignore', shell: isWindows }).status === 0
}

function runOnce(command, args, cwd) {
  log('dev', `${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: isWindows })
  if (result.status !== 0) {
    log('dev', `Falhou: ${command} ${args.join(' ')}`)
    process.exit(result.status ?? 1)
  }
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => server.close(() => resolve(true)))
    server.listen(port)
  })
}

function pipeOutput(name, stream) {
  let buffer = ''
  stream.setEncoding('utf8')
  stream.on('data', (chunk) => {
    buffer += chunk
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop()
    lines.forEach((line) => console.log(`${colors[name]}[${name}]${reset} ${line}`))
  })
}

function kill(child) {
  if (isWindows) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
    return
  }
  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    child.kill('SIGTERM')
  }
}

async function stop(code) {
  if (stopping) return
  stopping = true
  log('dev', 'Encerrando...')
  children.forEach(kill)
  const deadline = Date.now() + 5000
  while (children.size > 0 && Date.now() < deadline) await sleep(100)
  process.exit(code)
}

function start(name, args, cwd, env = {}) {
  const child = spawn(process.execPath, args, {
    cwd,
    detached: !isWindows,
    env: { ...process.env, FORCE_COLOR: '1', ...env },
  })
  children.add(child)
  pipeOutput(name, child.stdout)
  pipeOutput(name, child.stderr)
  child.on('exit', (code) => {
    children.delete(child)
    if (stopping) return
    log(name, `Parou com código ${code ?? 'desconhecido'}.`)
    stop(code || 1)
  })
}

async function waitForApi(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline && !stopping) {
    const isUp = await fetch(url).then(
      (response) => response.ok,
      () => false,
    )
    if (isUp) return true
    await sleep(500)
  }
  return false
}

async function main() {
  if (!existsSync(join(root, 'node_modules'))) runOnce('npm', ['install'], root)

  if (!existsSync(join(backendDir, 'node_modules'))) {
    const [command, ...prefix] = hasCommand('pnpm') ? ['pnpm'] : ['npx', '-y', 'pnpm@10']
    runOnce(command, [...prefix, 'install'], backendDir)
  }

  const envPath = join(backendDir, '.env')
  if (!existsSync(envPath)) {
    copyFileSync(join(backendDir, '.env.example'), envPath)
    log('dev', 'backend/.env criado a partir do backend/.env.example')
  }

  const env = readEnvFile(envPath)
  const apiPort = Number(env.PORT || 3333)
  const webPort = Number(new URL(env.FRONTEND_URL || 'http://localhost:5173').port || 5173)
  const apiUrl = `http://localhost:${apiPort}`

  for (const [name, port] of [['api', apiPort], ['web', webPort]]) {
    if (!(await isPortFree(port))) {
      log(name, `A porta ${port} já está em uso. Feche o programa que está usando essa porta e rode de novo.`)
      process.exit(1)
    }
  }

  start('api', [join(backendDir, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js'), 'start', '--watch'], backendDir)
  log('dev', 'Aguardando a API subir...')

  if (!(await waitForApi(`${apiUrl}/health`, 120000))) {
    log('api', 'A API não respondeu em 2 minutos.')
    await stop(1)
    return
  }

  start('web', [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(webPort), '--strictPort'], root, {
    VITE_API_MODE: 'http',
    VITE_API_URL: apiUrl,
  })

  log('dev', `App: http://localhost:${webPort}`)
  log('dev', `API: ${apiUrl}`)
  log('dev', `Banco: backend/${env.DATABASE_PATH || 'data/agroserv.sqlite'}`)
  log('dev', 'Contas demo: produtor@agroserv.com, prestador@agroserv.com e admin@agroserv.com, senha 123456')
  log('dev', 'Ctrl+C para parar tudo.')
}

process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))

main()
