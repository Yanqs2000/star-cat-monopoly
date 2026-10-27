// Controlled AVM1 primitive probe. Only scratch root frame 1 is replaced.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateSync } from 'node:zlib'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('..', import.meta.url))
const scratch = resolve(root, '.analysis-cache/3b-stock-random')
const source = resolve(root, 'public/original/play.swf')
const probe = resolve(scratch, 'stock-random-probe.swf')
const sha = value => createHash('sha256').update(value).digest('hex')
const original = readFileSync(source)
const originalHash = sha(original)
const manifest = JSON.parse(readFileSync(resolve(root, 'public/original/manifest.json'), 'utf8'))
if (manifest.files.find(file => file.name === 'play.swf')?.sha256 !== originalHash) throw Error('Original SWF hash mismatch')

mkdirSync(resolve(scratch, 'import/frame_1'), { recursive: true })
writeFileSync(resolve(scratch, 'import/frame_1/DoAction.as'), `flash.external.ExternalInterface.addCallback("stockRandom", this, function() {
  var output = [];
  var bounds = [-50, -1, 0, 1, 50];
  for (var j=0; j<bounds.length; j++) {
    var samples = [];
    for (var i=0; i<32; i++) samples.push(random(bounds[j]));
    output.push(bounds[j] + ":" + samples.join(","));
  }
  return output.join(";");
});
stop();
`)
execFileSync('/opt/homebrew/opt/openjdk/bin/java', ['-jar',
  '/Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.analysis-tools/ffdec-26.2.1/ffdec.jar',
  '-importScript', source, probe, resolve(scratch, 'import')], { stdio: 'inherit' })

function frameActions(raw, target) {
  const body = raw.toString('ascii', 0, 3) === 'CWS' ? inflateSync(raw.subarray(8)) : raw.subarray(8)
  let offset = Math.ceil((5 + 4 * (body[0] >> 3)) / 8) + 4
  let frame = 1
  const actions = []
  while (offset < body.length) {
    const header = body.readUInt16LE(offset); offset += 2
    const type = header >> 6
    let size = header & 63
    if (size === 63) { size = body.readUInt32LE(offset); offset += 4 }
    if (type === 12 && frame === target) actions.push(body.subarray(offset, offset + size))
    if (type === 1) frame++
    offset += size
  }
  return Buffer.concat(actions)
}
const originalFrame4 = frameActions(original, 4)
const probeBytes = readFileSync(probe)
if (!originalFrame4.equals(frameActions(probeBytes, 4))) throw Error('Original frame 4 bytecode changed')

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] })
try {
  const page = await browser.newPage()
  await page.route('**/__stock-random-probe.swf', route => route.fulfill({ path: probe, contentType: 'application/x-shockwave-flash' }))
  await page.goto(process.env.ORIGINAL_PREVIEW_URL ?? 'http://127.0.0.1:4173/')
  await page.getByText('原版已载入', { exact: true }).waitFor()
  await page.evaluate(() => document.querySelector('ruffle-player').ruffle().load({
    url: '/__stock-random-probe.swf', autoplay: 'on', unmuteOverlay: 'hidden', allowScriptAccess: true,
  }))
  await page.waitForFunction(() => {
    try { return typeof document.querySelector('ruffle-player').ruffle().callExternalInterface('stockRandom') === 'string' }
    catch { return false }
  }, null, { timeout: 15000 })
  const encoded = await page.evaluate(() => document.querySelector('ruffle-player').ruffle().callExternalInterface('stockRandom'))
  const samples = Object.fromEntries(encoded.split(';').map(part => {
    const [bound, rest] = part.split(':')
    return [bound, rest.split(',').map(Number)]
  }))
  if (sha(readFileSync(source)) !== originalHash) throw Error('Original SWF changed')
  const result = { method: 'Original AVM1 random() primitive in Ruffle; scratch frame 1 only, 32 draws per bound',
    limitation: 'Tests the primitive, not a natural stock-price update or a seeded original game',
    sourceSha256: originalHash, probeSha256: sha(probeBytes), frame4ActionSha256: sha(originalFrame4),
    samples }
  writeFileSync(resolve(root, 'docs/modernization/evidence/stock-negative-random-runtime.json'), `${JSON.stringify(result, null, 2)}\n`)
  console.log(JSON.stringify(Object.fromEntries(Object.entries(samples).map(([bound, values]) => [bound,
    { min: Math.min(...values), max: Math.max(...values), first: values.slice(0, 5) }]))))
} finally { await browser.close() }
