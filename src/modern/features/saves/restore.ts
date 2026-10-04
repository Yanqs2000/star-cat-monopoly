/** Prepare new resources before handing them to the owner; failures never dispose the old match. */
export async function commitPreparedSave<T>(prepare:()=>Promise<T>,commit:(candidate:T)=>void|Promise<void>,dispose:(candidate:T)=>void):Promise<void>{
 const candidate=await prepare()
 try{await commit(candidate)}catch(error){dispose(candidate);throw error}
}
