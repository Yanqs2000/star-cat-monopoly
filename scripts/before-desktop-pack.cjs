const { Arch } = require('electron-builder')
module.exports = async function beforePack(context) {
  if (context.electronPlatformName !== process.platform || Arch[context.arch] !== process.arch) {
    throw new Error('Use a native runner for each target: installed Electron must match platform and CPU architecture')
  }
}
