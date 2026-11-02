import {spawn} from 'node:child_process'
const role=Number(process.argv[2]);if(![3,4,7,11,6,10,12].includes(role))throw Error('Unsupported character role')
const python=process.env.PYTHON??'/opt/homebrew/bin/python3',id=String(role).padStart(2,'0')
const commands=[
 [python,['scripts/build-characters25.py','--role',String(role)]],
 [python,['scripts/build-characters25.py','--role',String(role),'--author',`role-${id}-carnival-authoring.json`]],
 [process.execPath,['scripts/build-characters25-next-review.mjs']],
 [process.execPath,['scripts/render-character-materials.mjs',String(role)]],
 [python,['scripts/build-character-materials.py','--role',String(role)]],
 [process.execPath,['scripts/build-characters25-next-review.mjs']],
]
for(const[program,args]of commands){
 const child=spawn(program,args,{stdio:'inherit'})
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)})
 if(code!==0)throw Error(`${args[0]} failed with${code}`)
}
