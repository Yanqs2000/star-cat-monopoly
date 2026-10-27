import { createGenerator } from 'ts-json-schema-generator'
import { writeFileSync, readFileSync } from 'node:fs'
const schema=createGenerator({path:'src/modern/features/saves/snapshot-types.ts',tsconfig:'tsconfig.json',type:'SaveSnapshot',additionalProperties:false}).createSchema('SaveSnapshot')
// Numeric Record unions are inferred as arrays by the generator; runtime stores JSON objects.
for(const name of ['forcedDice','pendingControl']) {
 const field=schema.definitions.GameState.properties[name]
 if(field.type!=='array'||!field.items)throw new Error(`Unexpected schema for ${name}`)
 schema.definitions.GameState.properties[name]={type:'object',additionalProperties:field.items}
}
const text=JSON.stringify(schema,null,2)+'\n'
const path='src/modern/features/saves/snapshot.schema.json'
if(process.argv.includes('--check')) {if(readFileSync(path,'utf8')!==text)throw new Error('存档schema与权威类型不同，请运行npm run schema:saves')}
else writeFileSync(path,text)
