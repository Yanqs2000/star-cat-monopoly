// Controlled AVM1 probe: replaces only root frame 1 in a scratch SWF.
// The original frame 4 event-handler bytecode must remain identical.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateSync } from 'node:zlib'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('..', import.meta.url))
const scratch = resolve(root, '.analysis-cache/phase-3a')
const source = resolve(root, 'public/original/play.swf')
const probe = resolve(scratch, 'b01-probe.swf')
const hash = value => createHash('sha256').update(value).digest('hex')
const original = readFileSync(source)
const manifest = JSON.parse(readFileSync(resolve(root, 'public/original/manifest.json'), 'utf8'))
if (manifest.files.find(file => file.name === 'play.swf')?.sha256 !== hash(original)) throw Error('Original SWF hash mismatch')
const tables = JSON.parse(readFileSync(resolve(root, 'docs/modernization/evidence/original-tables.json'), 'utf8'))
const event = tables.luckdate.value[28]
if (event[0] !== 1 || event[2] !== 1000) throw Error('Unexpected original B-01 event')
mkdirSync(resolve(scratch, 'b01-import/frame_1'), { recursive: true })
writeFileSync(resolve(scratch, 'b01-import/frame_1/DoAction.as'), `gotoAndStop(4);
this.onEnterFrame = function() {
 if (typeof(end_pg25) == "function") {
  delete this.onEnterFrame;
  luckdate = ${JSON.stringify([[1, 'placeholder', 0], event])};
  pid=1; moneydate=[[0],[0,100000,100000,200]]; tenor_id=0;
  end_pg25();
  flash.external.ExternalInterface.addCallback("b01Cash",this,function(){return moneydate[1][1];});
  createTextField("probeResult",90000,10,10,780,90);
  probeResult.text="B-01 original handler: cash 100000 -> "+moneydate[1][1]+"; pay "+pay;
  stop();
 }
};
`)
execFileSync(process.env.JAVA_BIN ?? '/opt/homebrew/opt/openjdk/bin/java', ['-jar',
  process.env.FFDEC_JAR ?? '/Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.analysis-tools/ffdec-26.2.1/ffdec.jar',
  '-importScript', source, probe, resolve(scratch, 'b01-import')], { stdio: 'inherit' })

function frameActions(raw, target) {
  const body = raw.toString('ascii', 0, 3) === 'CWS' ? inflateSync(raw.subarray(8)) : raw.subarray(8)
  let offset = Math.ceil((5 + 4 * (body[0] >> 3)) / 8) + 4
  let frame = 1
  const actions = []
  while (offset < body.length) {
    const header = body.readUInt16LE(offset)
    offset += 2
    const type = header >> 6
    let size = header & 63
    if (size === 63) { size = body.readUInt32LE(offset); offset += 4 }
    if (type === 12 && frame === target) actions.push(body.subarray(offset, offset + size))
    if (type === 1) frame++
    offset += size
  }
  return Buffer.concat(actions)
}
const handler = frameActions(original, 4)
const probeBytes = readFileSync(probe)
if (handler.length === 0 || !handler.equals(frameActions(probeBytes, 4))) throw Error('Original handler bytecode changed')
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] })
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 850 } })
  await page.route('**/__b01-probe.swf', route => route.fulfill({ path: probe, contentType: 'application/x-shockwave-flash' }))
  await page.goto(process.env.ORIGINAL_PREVIEW_URL ?? 'http://127.0.0.1:4173/')
  await page.getByText('原版已载入', { exact: true }).waitFor()
  // Script access is enabled for this isolated test player, not the shipped app.
  await page.evaluate(() => document.querySelector('ruffle-player').ruffle().load({
    url: '/__b01-probe.swf', autoplay: 'on', unmuteOverlay: 'hidden', allowScriptAccess: true,
  }))
  await page.waitForFunction(() => {
    try { return document.querySelector('ruffle-player').ruffle().callExternalInterface('b01Cash') === 101000 }
    catch { return false }
  }, null, { timeout: 15000 })
  const after = await page.evaluate(() => document.querySelector('ruffle-player').ruffle().callExternalInterface('b01Cash'))
  const screenshot = '/tmp/starcat-3a-b01-original-handler.png'
  await page.screenshot({ path: screenshot })
  if (hash(readFileSync(source)) !== hash(original)) throw Error('Original SWF changed')
  const result = { sourceEventId: 28, sourceDescription: event[1], sourceAmount: event[2], before: 100000, after,
    sourceSha256: hash(original), probeSha256: hash(probeBytes), frame4ActionSha256: hash(handler), frame4Bytes: handler.length,
    method: 'Original frame 4 bytecode in Ruffle; scratch frame 1 narrows the pool to source event 28 and exposes the result.',
    limitation: 'Controlled original-handler execution, not an unmodified natural gameplay route.', screenshot }
  writeFileSync(resolve(root, 'docs/modernization/evidence/b01-runtime.json'), `${JSON.stringify(result, null, 2)}\n`)
  console.log(JSON.stringify(result))
} finally { await browser.close() }
