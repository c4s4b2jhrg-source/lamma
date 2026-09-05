const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=UTF-8','cache-control':'no-store'}});
const ADMIN_HASH='7e36c67f6c8507b243bac18baadea54dfefcea580eff91a84fb317e9e8ab1324';
const clean=s=>String(s||'').trim();
async function sha256(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function auth(request){const key=request.headers.get('x-lamma-admin')||new URL(request.url).searchParams.get('key')||'';return (await sha256(key))===ADMIN_HASH}
export async function onRequest({request,env}){
  if(!env.LAMMA_DATA)return json({ok:false,error:'LAMMA_DATA binding is not configured'},503);
  if(!(await auth(request)))return json({ok:false,error:'Unauthorized'},401);
  const u=new URL(request.url),id=clean(u.searchParams.get('id')),action=clean(u.searchParams.get('action'));
  try{
    if(request.method==='GET'&&action==='list'){
      let cursor,items=[];
      do{
        const page=await env.LAMMA_DATA.list({prefix:'event:',limit:1000,cursor});
        for(const k of page.keys){const raw=await env.LAMMA_DATA.get(k.name);if(!raw)continue;try{const e=JSON.parse(raw);if(e&&!e.deleted)items.push({id:e.id,title:e.title||'',type:e.type||'',host:e.host||'',date:e.date||'',time:e.time||'',place:e.place||'',createdAt:e.createdAt||'',archived:!!e.archived})}catch{}}
        cursor=page.list_complete?null:page.cursor;
      }while(cursor);
      items.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
      return json({ok:true,items});
    }
    if(!id)return json({ok:false,error:'Missing id'},400);
    const raw=await env.LAMMA_DATA.get(`event:${id}`); if(!raw)return json({ok:false,error:'Not found'},404); const event=JSON.parse(raw);
    if(request.method==='PATCH'&&action==='archive'){
      const b=await request.json().catch(()=>({})); event.archived=!!b.archived; await env.LAMMA_DATA.put(`event:${id}`,JSON.stringify(event)); return json({ok:true,archived:event.archived});
    }
    if(request.method==='DELETE'&&action==='hard-delete'){
      await Promise.all([env.LAMMA_DATA.delete(`event:${id}`),env.LAMMA_DATA.delete(`responses:${id}`)]); return json({ok:true});
    }
    return json({ok:false,error:'Unsupported request'},405);
  }catch(e){return json({ok:false,error:'Server error'},500)}
}
