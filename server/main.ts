import { mkdirSync, chmodSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createSaveServer } from './app'
const major=Number(process.versions.node.split('.')[0])
if(major!==24)throw new Error('本地存档服务要求Node24 LTS，请按.node-version使用运行时')
const dbPath=resolve(process.env.STAR_CAT_SAVE_DB??'.data/saves.sqlite')
mkdirSync(dirname(dbPath),{recursive:true,mode:0o700})
const port=Number(process.env.STAR_CAT_SAVE_PORT??4186)
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('本地端口无效')
const root=resolve('dist-modern')
const app=await createSaveServer({dbPath,staticRoot:existsSync(root)?root:undefined})
chmodSync(dbPath,0o600)
await app.listen({host:'127.0.0.1',port})
process.stdout.write(`星猫本地存档服务：http://127.0.0.1:${port}/modern.html\nSQLite：${dbPath}\n`)
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>{void app.close().then(()=>process.exit(0))})
