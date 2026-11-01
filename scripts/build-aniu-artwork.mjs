import{spawn}from'node:child_process'
const python=process.env.PYTHON??'/opt/homebrew/bin/python3'
const commands=[
 [python,['scripts/build-characters25.py','--role','2']],
 [python,['scripts/build-characters25.py','--role','2','--author','role-02-carnival-authoring.json']],
 [process.execPath,['scripts/build-characters25-review.mjs']],
 [python,['scripts/build-aniu-materials.py','prepare']],
 [process.execPath,['scripts/render-aniu-materials.mjs']],
 [python,['scripts/build-aniu-materials.py','finalize']],
 [process.execPath,['scripts/build-characters25-review.mjs']],
]
for(const[program,args]of commands){
 console.log('A-Niu build: '+args[0])
 const child=spawn(program,args,{stdio:'inherit'})
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)})
 if(code!==0)throw new Error(args[0]+' failed with '+code)
}
