const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=UTF-8','cache-control':'no-store'}});
const clean=s=>String(s||'').trim().slice(0,4000);
const makeId=()=>crypto.randomUUID().replaceAll('-','').slice(0,10);
async function getEvent(env,id){const raw=await env.LAMMA_DATA?.get(`event:${id}`);return raw?JSON.parse(raw):null}
async function putEvent(env,id,data){await env.LAMMA_DATA.put(`event:${id}`,JSON.stringify(data))}
async function getResponses(env,id){const raw=await env.LAMMA_DATA?.get(`responses:${id}`);return raw?JSON.parse(raw):[]}
async function putResponses(env,id,data){await env.LAMMA_DATA.put(`responses:${id}`,JSON.stringify(data))}
export async function onRequest({request,env}){
  if(!env.LAMMA_DATA)return json({ok:false,error:'LAMMA_DATA binding is not configured'},503);
  const u=new URL(request.url),id=clean(u.searchParams.get('id')),action=clean(u.searchParams.get('action')),token=clean(u.searchParams.get('token'));
  try{
    if(request.method==='POST'&&!id){
      const body=await request.json(); const e=body?.event||{}; const eventId=makeId(),adminToken=crypto.randomUUID();
      const event={id:eventId,adminToken,type:clean(e.type),title:clean(e.title),msg:clean(e.msg),date:clean(e.date),time:clean(e.time),place:clean(e.place),map:clean(e.map),host:clean(e.host),guests:Number(e.guests||0),countdown:!!e.countdown,theme:clean(e.theme)||'classic',storySource:clean(e.storySource),aiImage:clean(e.aiImage),createdAt:new Date().toISOString(),deleted:false};
      await putEvent(env,eventId,event); await putResponses(env,eventId,[]); return json({ok:true,id:eventId,adminToken});
    }
    if(!id)return json({ok:false,error:'Missing id'},400);
    const event=await getEvent(env,id); if(!event||event.deleted)return json({ok:false,error:'Invite not found'},404);
    if(request.method==='GET'&&action==='responses'){
      if(token!==event.adminToken)return json({ok:false,error:'Unauthorized'},401);
      const responses=await getResponses(env,id); return json({ok:true,event:{id:event.id,title:event.title},responses});
    }
    if(request.method==='GET'){
      const {adminToken,...publicEvent}=event; return json({ok:true,event:publicEvent});
    }
    if(request.method==='POST'&&action==='rsvp'){
      const b=await request.json(),name=clean(b.name); if(!name)return json({ok:false,error:'Name required'},400);
      const responses=await getResponses(env,id); const r={id:makeId(),name,answer:b.answer==='yes'?'yes':'no',guests:Math.max(0,Math.min(Number(b.guests||0),10)),time:new Date().toISOString(),hidden:false}; responses.push(r); await putResponses(env,id,responses); return json({ok:true,response:r});
    }
    if(request.method==='PATCH'&&action==='response'){
      if(token!==event.adminToken)return json({ok:false,error:'Unauthorized'},401);
      const rid=clean(u.searchParams.get('rid')),b=await request.json(); const responses=await getResponses(env,id); const r=responses.find(x=>x.id===rid); if(!r)return json({ok:false,error:'Response not found'},404); r.hidden=!!b.hidden; await putResponses(env,id,responses); return json({ok:true});
    }
    if(request.method==='DELETE'&&action==='response'){
      if(token!==event.adminToken)return json({ok:false,error:'Unauthorized'},401);
      const rid=clean(u.searchParams.get('rid')); let responses=await getResponses(env,id); responses=responses.filter(x=>x.id!==rid); await putResponses(env,id,responses); return json({ok:true});
    }
    return json({ok:false,error:'Unsupported request'},405);
  }catch(e){return json({ok:false,error:'Server error'},500)}
}