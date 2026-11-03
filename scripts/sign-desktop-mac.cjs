const { execFileSync } = require('node:child_process')
const { readdirSync } = require('node:fs')
const path = require('node:path')

module.exports = function signDesktopMac({ app }) {
  const frameworks = path.join(app, 'Contents', 'Frameworks')
  for (const entry of readdirSync(frameworks, { withFileTypes: true })) {
    if (entry.isDirectory() && (entry.name.endsWith('.app') || entry.name.endsWith('.framework'))) {
      execFileSync('codesign', ['--force', '--sign', '-', path.join(frameworks, entry.name)], { stdio: 'inherit' })
    }
  }
  // Signing the outer bundle seals game assets without probing each texture.
  execFileSync('codesign', ['--force', '--sign', '-', app], { stdio: 'inherit' })
  execFileSync('codesign', ['--verify', '--deep', '--strict', app], { stdio: 'inherit' })
}
