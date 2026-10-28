/** Bound both fetch and bitmap decoding; a burst of thousands exceeds Chrome's resource cap. */
export async function loadSceneTextures(urls:string[],load:(url:string)=>Promise<void>,signal:AbortSignal):Promise<void>{
 signal.throwIfAborted()
 let cursor=0,failed=false,failure:unknown
 const workers=Array.from({length:Math.min(6,urls.length)},async()=>{
  while(cursor<urls.length&&!failed&&!signal.aborted){const url=urls[cursor++]!;try{await load(url)}catch(error){failed=true;failure=error}}
 })
 await Promise.all(workers)
 if(failed)throw failure
 signal.throwIfAborted()
}
