#!/usr/bin/env node
// Cross-platform helper that preloads the fix-localstorage script and runs
// the project's dev script (Next dev). This avoids shell quoting issues with
// NODE_OPTIONS and works on Windows, macOS, and Linux.

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const projectRoot = path.resolve(__dirname, '..')
const fixScript = path.join(projectRoot, 'scripts', 'fix-localstorage.js')

// Ensure the fix script is applied in this process if possible (best-effort)
try {
  require(fixScript)
} catch (e) {
  // ignore
}

// Build environment for child processes (do not set NODE_OPTIONS to avoid
// confusion with quoting). We'll preload the fix via the `-r` node flag.
const env = Object.assign({}, process.env)

// Prefer running the locally installed `next` binary if present
const nextLocal = path.join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'next.cmd' : 'next')
const nextNodeBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next')

const args = ['dev', '--turbopack']

// On Windows, .cmd wrappers require a shell; running the JS entrypoint with
// node does not. Use shell only for .cmd, otherwise spawn node directly to
// avoid issues with spaces in paths.
if (fs.existsSync(nextNodeBin)) {
  // Run Next's JS entry with the current node executable and preload fixScript via -r
  const child = spawn(process.execPath, ['-r', fixScript, nextNodeBin, ...args], { stdio: 'inherit', env })
  child.on('exit', (code) => process.exit(code))
} else if (fs.existsSync(nextLocal)) {
  // When .bin wrapper exists (Windows), prefer running node with the JS entry
  const nodeNext = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next')
  const child = spawn(process.execPath, ['-r', fixScript, nodeNext, ...args], { stdio: 'inherit', env })
  child.on('exit', (code) => process.exit(code))
} else {
  // As a last resort, run `npm run dev` via shell (preload not available here)
  const child = spawn('npm', ['run', 'dev'], { stdio: 'inherit', env, shell: true })
  child.on('exit', (code) => process.exit(code))
}
