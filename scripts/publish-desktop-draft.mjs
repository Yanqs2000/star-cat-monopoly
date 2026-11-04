import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { prepareReleaseAssets } from '../desktop/src/release.ts'
import pkg from '../desktop/package.json' with { type: 'json' }

const directory = process.argv[2], source = process.env.STAR_CAT_SOURCE_COMMIT
if (!directory || !source || !process.env.GH_REPO) throw new Error('Artifacts directory, source SHA and GH_REPO are required')
const verified = await prepareReleaseAssets(directory, pkg.version, source)
const prereleaseFlag = '--prerelease=' + pkg.version.includes('-')
const tag = 'v' + pkg.version, marker = '<!-- star-cat-desktop-release-draft -->'
const gh = args => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
let existing
try { existing = JSON.parse(gh(['release', 'view', tag, '--json', 'isDraft,body,targetCommitish'])) } catch (error) {
  if (!String(error.stderr).includes('release not found') && !String(error.stderr).includes('Not Found')) throw error
}
if (existing && (!existing.isDraft || !existing.body.includes(marker))) throw new Error('Refusing to overwrite a published or unrelated release')
let tagRef
try { tagRef = JSON.parse(gh(['api', `repos/${process.env.GH_REPO}/git/ref/tags/${tag}`])) } catch (error) { if (!String(error.stderr).includes('404')) throw error }
if (tagRef && tagRef.object.sha !== source) throw new Error('Version tag already points to another source commit')
const notes = marker + '\n' + await readFile(new URL('../docs/releases/' + pkg.version + '.md', import.meta.url), 'utf8') + `\n\n构建来源：\`${source}\`\n\n构建记录：https://github.com/${process.env.GH_REPO}/actions/runs/${process.env.GITHUB_RUN_ID}\n`
const notesFile = path.join(directory, 'release-notes.md')
await writeFile(notesFile, notes + '\n附件上传中，尚未完成草稿核对。\n')
if (existing) gh(['release', 'edit', tag, '--draft', prereleaseFlag, '--target', source, '--notes-file', notesFile])
else gh(['release', 'create', tag, '--draft', prereleaseFlag, '--target', source, '--title', '星猫大富翁 ' + pkg.version + ' · 高清桌面版', '--notes-file', notesFile])
gh(['release', 'upload', tag, ...verified.assets.map(a => a.filename), verified.checksumPath, '--clobber'])
const release = JSON.parse(gh(['api', `repos/${process.env.GH_REPO}/releases`, '--jq', `.[] | select(.tag_name=="${tag}")`]))
if (!release.draft) throw new Error('Release must remain a draft')
for (const item of verified.assets) {
  const remote = release.assets.find(asset => asset.name === item.name)
  if (!remote || remote.state !== 'uploaded' || remote.size !== item.size || remote.digest !== 'sha256:' + item.sha256) throw new Error('Uploaded asset verification failed: ' + item.name)
}
if (!release.assets.some(asset => asset.name === 'SHA256SUMS.txt' && asset.state === 'uploaded')) throw new Error('Missing uploaded checksums')
await writeFile(notesFile, notes + '\nApple Silicon DMG 已完成原生安装、高清启动、存读档/重启及覆盖安装验证。\n')
gh(['release', 'edit', tag, '--draft', prereleaseFlag, '--notes-file', notesFile])
console.log(JSON.stringify({ url: release.html_url, tag, draft: true, source, assets: verified.assets.map(({ name, size, sha256 }) => ({ name, size, sha256 })) }, null, 2))
