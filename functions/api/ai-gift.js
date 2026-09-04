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
    const scenePrompt=getScenePrompt(occasion,sceneKey);
    if(!scenePrompt)return json({error:'اختيار المشهد غير صحيح.'},400);
    const styleHint={
      'واقعي دافئ':'realistic professional photography, warm natural light, soft premium background',
      'سينمائي فاخر':'cinematic luxury portrait, rich lighting, elegant depth, premium film look',
      'ناعم حالم':'soft dreamy portrait, gentle tones, polished and elegant mood',
      'كرتوني لطيف':'cute polished cartoon illustration, clean shapes, charming expressions'
    }[style]||style;
    const roleLines=refs.map((_,i)=>`Reference image ${i+1}: preserve the identity of person ${i+1}.`).join('\n');
    const prompt=`Create a premium special-occasion image for a digital gift website.\n\nOCCASION:\n${occasion}\n\nSCENE:\n${scenePrompt}\n\nREFERENCE MAP:\n${roleLines}\n\nRULES:\n- Preserve the recognizable identity of each referenced person.\n- If there are multiple reference images, treat them as different people unless the scene clearly implies the same person at different moments.\n- Create a fresh composition, not a copy of the source pose.\n- Make the result elegant, clean, gift-ready, and visually appealing.\n- Everyone must be fully dressed in modest, neat, age-appropriate clothing.\n- Family-friendly only.\n- No text, no logos, no watermarks.\n- Clean hands, clean faces, believable anatomy, natural expressions.\n- Avoid identity mixing, extra fingers, extra people, distorted faces, cropped heads, deformed bodies.\n\nVISUAL STYLE:\n- ${styleHint}\n- invitation-quality image\n- polished composition`;
    const form=new FormData();
    form.append('prompt',prompt.trim());
    refs.forEach((file,i)=>form.append(`input_image_${i}`,file,file.name||`reference_${i+1}.jpg`));
    form.append('width','1024');form.append('height','1024');form.append('guidance','5');
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
  if(/تخرج|graduate|graduation/i.test(v))return 'تخرج';
  if(/ميلاد|birthday/i.test(v))return 'عيد ميلاد';
  if(/زواج|ملكة|عقد|nikah|wedding|engagement/i.test(v))return 'زواج / ملكة';
  if(/مولود|عقيق|newborn|baby/i.test(v))return 'مولود / عقيقة';
  if(/رمضان|عزيمة|iftar|ramadan/i.test(v))return 'رمضان / عزيمة';
  if(/شكر|thanks/i.test(v))return 'شكر';
  if(/اعتذار|sorry|apology/i.test(v))return 'اعتذار';
  return 'مناسبة خاصة';
}

function getScenePrompt(occasion,sceneKey){
  const map={
    'حب':{
      holding_hands:'Create a romantic couple scene where the two people are standing together and holding hands in a warm elegant setting.',
      hug:'Create a tasteful romantic couple scene with a gentle warm hug, elegant and soft.',
      looking_at_each_other:'Create a romantic scene where the two people are standing and looking at each other warmly.',
      cozy_sitting:'Create a cozy romantic seated scene for two people with a calm elegant atmosphere.'
    },
    'تخرج':{
      cap_only:'Create a graduation portrait featuring the graduate wearing a graduation cap in a polished celebratory style.',
      cap_diploma:'Create a graduation portrait featuring the graduate with a graduation cap and diploma.',
      cap_cake:'Create a graduation celebration portrait with the graduate, a graduation cap, and a tasteful cake.',
      toss_cap:'Create a dynamic graduation portrait where the graduate is joyfully tossing the graduation cap.'
    },
    'عيد ميلاد':{
      cake:'Create a birthday portrait featuring the person with a beautiful birthday cake.',
      balloons:'Create a birthday portrait with elegant balloons and a celebratory mood.',
      opening_gift:'Create a birthday portrait where the person is opening a gift happily.',
      blowing_candles:'Create a birthday portrait where the person is blowing out birthday candles.'
    },
    'زواج / ملكة':{
      formal_pose:'Create an elegant wedding or engagement portrait with a refined formal pose.',
      holding_hands:'Create an elegant wedding or engagement portrait where the couple are gently holding hands.',
      rings:'Create an elegant wedding or engagement portrait highlighting a tasteful ring exchange moment.',
      bouquet:'Create an elegant soft portrait with bouquet details and a romantic luxury atmosphere.'
    },
    'مولود / عقيقة':{
      newborn_only:'Create a warm newborn celebration image focusing on the baby in a soft elegant style.',
      mother_baby:'Create a warm mother and newborn portrait for a newborn celebration.',
      parents_baby:'Create a warm family portrait with parents and the newborn in a gentle elegant setting.',
      aqiqah_style:'Create a polished aqiqah-style newborn celebration portrait with soft festive details.'
    },
    'رمضان / عزيمة':{
      table:'Create a warm Ramadan gathering scene with a tasteful iftar table and elegant atmosphere.',
      lantern:'Create a Ramadan portrait scene with beautiful lantern details and warm lighting.',
      coffee_dates:'Create a warm Ramadan scene with Arabic coffee and dates in an elegant presentation.',
      family_session:'Create a cozy family Ramadan gathering scene with a refined atmosphere.'
    },
    'شكر':{
      flowers:'Create a soft appreciation portrait with flowers and a thankful elegant mood.',
      thank_you_card:'Create an appreciation portrait with a tasteful thank-you card detail.',
      formal_soft:'Create a polished soft formal appreciation portrait.',
      minimal_gratitude:'Create a minimal elegant gratitude-themed portrait.'
    },
    'اعتذار':{
      flower_sorry:'Create a gentle apology-themed portrait with flowers and a soft emotional mood.',
      sorry_card:'Create an apology-themed portrait with a tasteful sorry-card detail.',
      calm_emotional:'Create a calm emotional portrait suitable for a sincere apology.',
      soft_apology:'Create a soft elegant apology-themed portrait with warm tones.'
    },
    'مناسبة خاصة':{
      soft_portrait:'Create a polished elegant special-occasion portrait.',
      warm_pose:'Create a warm elegant pose suitable for a digital gift.',
      luxury_style:'Create a refined luxury-style celebratory portrait.',
      dreamy_style:'Create a dreamy elegant celebration portrait.'
    }
  };
  return map[occasion]?.[sceneKey]||null;
}

function bytesToBase64(bytes){let s='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)s+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(s)}
function withCors(res){const headers=new Headers(res.headers);headers.set('Access-Control-Allow-Origin','*');headers.set('Access-Control-Allow-Methods','POST, OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type');headers.set('Cache-Control','no-store');return new Response(res.body,{status:res.status,statusText:res.statusText,headers})}
function json(body,status=200){return withCors(new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8'}}))}
