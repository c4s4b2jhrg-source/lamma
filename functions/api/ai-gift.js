export async function onRequestOptions(){return withCors(new Response(null,{status:204}))}

export async function onRequestPost(context){
  try{
    if(!context.env.AI)return json({error:'ميزة AI جاهزة، باقي ربط Workers AI بالمشروع باسم AI.'},503);
    const incoming=await context.request.formData();
    const occasion=normalizeOccasion(String(incoming.get('occasion')||'مناسبة خاصة'));
    const sceneKey=String(incoming.get('sceneKey')||'');
    const style=String(incoming.get('style')||'واقعي دافئ');
    const imageCount=Math.max(1,Math.min(4,Number(incoming.get('imageCount')||1)));
    const refs=[];
    for(let i=1;i<=imageCount;i++){
      const file=incoming.get(`image${i}`);
      if(file instanceof File)refs.push(file);
    }
    if(!refs.length)return json({error:'ارفع صورة مرجعية أول.'},400);
    if(refs.some(f=>f.size>8*1024*1024))return json({error:'واحدة من الصور كبيرة جدًا. خلها أقل من 8MB.'},400);
    if(['حب','صداقة'].includes(occasion)&&refs.length!==2)return json({error:'لهذي المناسبة لازم ترفع صورتين بالضبط، صورة لكل شخص.'},400);

    const scenePrompt=getScenePrompt(occasion,sceneKey);
    if(!scenePrompt)return json({error:'اختيار المشهد غير صحيح.'},400);

    const styleHint={
      'واقعي دافئ':'realistic professional photography, natural skin texture, soft warm light, restrained styling, no beauty-filter look',
      'سينمائي فاخر':'cinematic premium photography with realistic skin and restrained grading; preserve real facial appearance above cinematic stylization',
      'ناعم حالم':'soft elegant photography while keeping the real face and skin structure unchanged'
    }[style]||'realistic professional photography, natural skin texture, restrained styling';

    const isMultiPerson=['حب','صداقة'].includes(occasion);
    const samePersonOccasions=['تخرج','عيد ميلاد','اعتذار','بدون مناسبة','مناسبة خاصة'];

    const roleLines=refs.map((_,i)=>{
      if(isMultiPerson)return `Reference image ${i+1}: DIFFERENT PERSON ${i+1}. Lock this person's identity to this specific reference only.`;
      return `Reference image ${i+1}: SAME PERSON identity reference from another angle or moment. Use all references together to reconstruct one consistent identity.`;
    }).join('\n');

    const identityMode=isMultiPerson
      ? `- There are exactly two different people. Reference 1 belongs only to person 1. Reference 2 belongs only to person 2.\n- Never merge, swap, average, or borrow facial features between them.\n- Keep both faces independently recognizable and stable.`
      : samePersonOccasions.includes(occasion)
        ? `- All uploaded references belong to the SAME person. Treat them as multiple identity views of one individual.\n- Fuse the identity evidence, not the faces: keep one consistent person, using the clearest shared facial traits across all references.\n- Never create multiple copies of the person unless the scene explicitly requires more than one person, which these scenes do not.`
        : `- Preserve identity very strictly from the supplied reference images.`;

    const prompt=`Create a premium special-occasion image for a digital gift website.\n\nOCCASION:\n${occasion}\n\nSCENE:\n${scenePrompt}\n\nREFERENCE MAP:\n${roleLines}\n\nIDENTITY MODE:\n${identityMode}\n\nIDENTITY PRESERVATION — HIGHEST PRIORITY:\n- Facial identity accuracy is more important than dramatic pose, styling, lighting, or background.\n- Keep facial geometry, eye shape and spacing, nose shape, lips, jawline, cheeks, eyebrows, hairstyle/hairline, skin tone, apparent age, and distinctive features as close to the references as possible.\n- Do NOT beautify, idealize, age up, age down, slim the face, enlarge eyes, change nose shape, change lip shape, change ethnicity, or apply a plastic-surgery look.\n- Do NOT invent a new face. The output must look like the same real person at first glance.\n- If a requested pose would hide or distort the face, use a gentler version that keeps identity readable.\n- Prefer front-facing or three-quarter angles close to the supplied references. Avoid extreme profiles.\n- Change only pose, clothing, props, scene, and background as needed. Identity must remain stable.\n\nCOMPOSITION:\n- ${scenePrompt}\n- Create a fresh composition, but keep head orientation and facial expression reasonably close to the references when that improves identity fidelity.\n- Everyone must be fully dressed in modest, neat, age-appropriate clothing.\n- Family-friendly only.\n- No text, no logos, no watermarks.\n- Natural anatomy, clean hands, realistic proportions.\n\nVISUAL STYLE:\n- ${styleHint}\n- invitation-quality image\n- polished composition\n\nSTRICTLY AVOID:\nidentity drift, face redesign, face swapping, blended identities, duplicated person, different eye shape, different nose, different jawline, different skin tone, different age, beauty filter, excessive makeup, extreme profile view, distorted face, extra fingers, extra people, cropped heads, deformed anatomy.`;

    const form=new FormData();
    form.append('prompt',prompt.trim());
    refs.forEach((file,i)=>form.append(`input_image_${i}`,file,file.name||`reference_${i+1}.jpg`));
    form.append('width','1024');
    form.append('height','1024');
    form.append('guidance','3.5');

    const serialized=new Response(form);
    const result=await context.env.AI.run('@cf/black-forest-labs/flux-2-klein-4b',{multipart:{body:serialized.body,contentType:serialized.headers.get('content-type')}});

    let b64='';
    if(result&&typeof result.image==='string')b64=result.image;
    else if(result instanceof ReadableStream){const bytes=new Uint8Array(await new Response(result).arrayBuffer());b64=bytesToBase64(bytes)}
    if(!b64)return json({error:'ما رجعت صورة من خدمة AI.'},502);
    return json({image:b64,occasion,sceneKey,provider:'cloudflare',model:'flux-2-klein-4b'});
  }catch(e){
    const msg=String(e?.message||'');
    if(/quota|limit|billing|exceed/i.test(msg))return json({error:'خلص الحد أو الرصيد الحالي لتوليد الصور.'},429);
    return json({error:'صار خطأ أثناء توليد الصورة. جرّب مرة ثانية.'},500);
  }
}

function normalizeOccasion(raw){
  const v=String(raw||'').trim();
  if(/حب|رومان|love/i.test(v))return 'حب';
  if(/صديق|صداقة|friend/i.test(v))return 'صداقة';
  if(/تخرج|graduate|graduation/i.test(v))return 'تخرج';
  if(/ميلاد|birthday/i.test(v))return 'عيد ميلاد';
  if(/اعتذار|sorry|apology/i.test(v))return 'اعتذار';
  if(/بدون مناسبة|surprise|مفاجأة/i.test(v))return 'بدون مناسبة';
  return 'مناسبة خاصة';
}

function getScenePrompt(occasion,sceneKey){
  const map={
    'حب':{
      holding_hands:'Create a romantic couple scene where the two people are standing together and holding hands in a warm elegant setting, with both faces clearly visible.',
      hug:'Create a tasteful gentle hug with both faces clearly visible and unobstructed; avoid hiding either face against the other person.',
      looking_at_each_other:'Create a romantic scene where the two people look at each other softly while keeping both faces mostly visible in a three-quarter angle.',
      cozy_sitting:'Create a cozy seated romantic scene with both people facing slightly toward camera so both identities remain clear.'
    },
    'عيد ميلاد':{
      cake:'Create a birthday portrait featuring the person with a beautiful birthday cake while keeping the face clearly visible.',
      balloons:'Create a birthday portrait with elegant balloons and the person\'s face clearly visible.',
      opening_gift:'Create a birthday portrait where the person is opening a gift while still keeping their face visible to camera.',
      blowing_candles:'Create a birthday scene with the person near the cake and candles, using a three-quarter angle that still preserves facial identity clearly.'
    },
    'صداقة':{
      side_by_side:'Create a warm friendship portrait with the friends standing side by side naturally, both faces clearly visible.',
      friendly_hug:'Create a cheerful tasteful friendship hug with both faces visible and unobstructed.',
      laughing:'Create a candid friendship scene where the friends are laughing together while keeping both faces recognizable and visible.',
      coffee:'Create a cozy friendship scene with the friends sitting together over coffee, both facing slightly toward camera.'
    },
    'تخرج':{
      cap_only:'Create a graduation portrait featuring the graduate wearing a graduation cap; do not let the cap hide the forehead, eyebrows, or face.',
      cap_diploma:'Create a graduation portrait with cap and diploma while keeping the graduate facing camera or three-quarter view.',
      cap_cake:'Create a graduation celebration portrait with cap and tasteful cake while keeping the face clearly visible.',
      toss_cap:'Create a dynamic graduation portrait immediately before or after tossing the cap, keeping the face visible and recognizable rather than turning away.'
    },
    'اعتذار':{
      flower_sorry:'Create a gentle apology-themed portrait with flowers and a soft emotional mood while keeping the face clearly recognizable.',
      sorry_card:'Create an apology-themed portrait with a tasteful apology-card detail but no readable text; keep the face clearly visible.',
      calm_emotional:'Create a calm emotional portrait suitable for a sincere apology, preserving natural facial features exactly.',
      soft_apology:'Create a soft elegant apology-themed portrait with warm tones and minimal facial stylization.'
    },
    'بدون مناسبة':{
      surprise_gift:'Create a warm surprise-gift portrait with a tasteful wrapped gift and a clear recognizable face.',
      flowers:'Create a beautiful just-because portrait with flowers and a soft premium atmosphere, keeping the face unchanged.',
      elegant_portrait:'Create a polished elegant portrait that feels like an unexpected thoughtful gift, prioritizing identity accuracy over stylization.',
      cozy_moment:'Create a cozy warm candid moment suitable for a no-reason surprise gift while keeping the face clearly visible.'
    },
    'مناسبة خاصة':{
      soft_portrait:'Create a polished elegant special-occasion portrait with strict identity preservation.',
      warm_pose:'Create a warm elegant pose suitable for a digital gift while keeping facial identity unchanged.',
      luxury_style:'Create a refined luxury-style celebratory portrait with restrained styling and accurate identity.',
      dreamy_style:'Create a softly dreamy celebration portrait without changing the person\'s facial structure or identity.'
    }
  };
  return map[occasion]?.[sceneKey]||null;
}

function bytesToBase64(bytes){let s='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)s+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(s)}
function withCors(res){const headers=new Headers(res.headers);headers.set('Access-Control-Allow-Origin','*');headers.set('Access-Control-Allow-Methods','POST, OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type');headers.set('Cache-Control','no-store');return new Response(res.body,{status:res.status,statusText:res.statusText,headers})}
function json(body,status=200){return withCors(new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8'}}))}
