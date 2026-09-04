export async function onRequestPost(context){
  try{
    if(!context.env.AI){
      return json({error:'ميزة AI جاهزة. باقي ربط Workers AI بالمشروع باسم AI.'},503);
    }

    const incoming=await context.request.formData();
    const style=String(incoming.get('style')||'واقعي دافئ');
    const occasion=String(incoming.get('occasion')||'مناسبة خاصة');
    const scene=String(incoming.get('scene')||'واقعي وأنيق');
    const count=Math.max(1,Math.min(4,Number(incoming.get('imageCount')||1)));
    const refs=[];
    for(let i=1;i<=count;i++){
      const file=incoming.get('image'+i);
      const role=String(incoming.get('role'+i)||('reference_'+i));
      if(file instanceof File)refs.push({file,role});
    }

    if(!refs.length)return json({error:'ارفع الصورة الأساسية أول.'},400);
    if(refs.some(x=>x.file.size>8*1024*1024))return json({error:'حجم إحدى الصور كبير. اختر صورة أصغر.'},400);

    const roleSet=new Set(refs.map(x=>x.role));
    if((occasion==='زواج'||occasion==='ملكة / عقد قران')&&(!roleSet.has('groom_current')||!roleSet.has('bride_current'))){
      return json({error:'ارفع الصورتين الحاليتين أول.'},400);
    }

    const styleHint={
      'واقعي دافئ':'realistic professional photography, warm natural light, premium soft background',
      'طفولي ناعم':'soft dreamy portrait, pastel tones, gentle warm mood',
      'سينمائي فاخر':'cinematic high-end portrait, elegant lighting, premium film look',
      'رسوم كرتونية لطيفة':'cute polished cartoon illustration, soft clean shapes, charming expressions'
    }[style]||style;

    const roleDescriptions={
      groom_current:'current adult groom identity reference',
      bride_current:'current adult bride identity reference',
      groom_child:'childhood reference of the SAME groom',
      bride_child:'childhood reference of the SAME bride',
      graduate_current:'current identity reference of the graduate',
      graduate_child:'childhood reference of the SAME graduate',
      birthday_current:'current identity reference of the birthday person',
      birthday_child:'childhood reference of the SAME birthday person',
      parent_primary:'primary parent identity reference',
      newborn:'newborn identity reference, only if this image is provided',
      parent_secondary:'second parent identity reference',
      host_primary:'primary host identity reference',
      host_secondary:'second person identity reference',
      primary:'primary identity reference',
      secondary:'second identity reference'
    };
    const roleText=refs.map((x,i)=>`Input image ${i}: ${roleDescriptions[x.role]||x.role}.`).join('\n');

    const hasChildhood=roleSet.has('groom_child')||roleSet.has('bride_child')||roleSet.has('graduate_child')||roleSet.has('birthday_child');
    const hasNewborn=roleSet.has('newborn');

    const occasionHint={
      'زواج':`Create an elegant Gulf wedding image using the groom and bride current references. Dress both in complete, modest, premium wedding/formal clothing. Selected idea: ${scene}. ${hasChildhood?'Childhood references are also supplied; only use them if the selected idea calls for a childhood-and-present composition. Never turn the adults into children unless the chosen scene explicitly asks for childhood and present together.':''}`,
      'ملكة / عقد قران':`Create a refined engagement / nikah image using the current groom and bride references. Use modest elegant Gulf formal attire and a tasteful setting. Selected idea: ${scene}. ${hasChildhood?'Childhood references are supplied for an optional then-and-now composition only.':''}`,
      'تخرج':`Create a graduation portrait of the referenced graduate. Selected idea: ${scene}. Use a complete graduation gown, cap and/or diploma when appropriate. ${hasChildhood?'A childhood image of the SAME person is supplied; use it only when the selected idea is childhood and present together.':''}`,
      'عيد ميلاد':`Create a birthday portrait of the referenced birthday person. Selected idea: ${scene}. Add tasteful cake, balloons or celebration decor when appropriate. ${hasChildhood?'A childhood image of the SAME person is supplied; use it only for a tasteful then-and-now idea when appropriate.':''}`,
      'مولود / عقيقة':`Create a warm newborn / aqiqah invitation image. Selected idea: ${scene}. ${hasNewborn?'A real newborn reference is supplied, so preserve the newborn identity carefully.':'No newborn reference is supplied; if the scene includes a baby, create a generic newborn without implying a specific facial identity.'} Preserve any supplied parent identities.`,
      'رمضان / عزيمة':`Create a warm Gulf Ramadan gathering / invitation portrait using the supplied person references. Selected idea: ${scene}. Use modest traditional or elegant clothing, tasteful majlis or dining details, lanterns and warm lighting when appropriate.`,
      'مناسبة خاصة':`Create a polished special-occasion portrait using the supplied references. Selected idea: ${scene}. Keep it elegant, warm and invitation-ready.`
    }[occasion]||`Create a polished special-occasion portrait. Selected idea: ${scene}.`;

    const prompt=`${occasionHint}\n\nREFERENCE MAP:\n${roleText}\n\nIDENTITY RULES:\n- Match each input only to its stated role.\n- Preserve recognizable facial identity, hairstyle and key facial features as faithfully as possible.\n- Do not mix identities between adults, children, parents or newborns.\n- Create a fresh three-quarter or full-body composition rather than copying the source pose.\n\nCLOTHING AND SAFETY:\n- Everyone must be fully dressed in neat, modest, age-appropriate clothing.\n- No shirtless or bare-chested person.\n- No revealing clothing.\n- Family-friendly and suitable for a Gulf digital invitation.\n\nVISUAL STYLE:\n- ${styleHint}.\n- Premium invitation-quality composition.\n- Natural skin, believable anatomy, clean hands, coherent lighting and gentle expressions.\n\nSTRICTLY AVOID: identity mixing, wrong age, awkward pose, extra fingers, extra hands, duplicated people, unintended extra people, distorted faces, deformed anatomy, cropped heads, scary expressions, text, logos, watermarks.`;

    const form=new FormData();
    form.append('prompt',prompt);
    refs.forEach((x,i)=>form.append('input_image_'+i,x.file,x.file.name||('reference'+(i+1)+'.jpg')));
    form.append('width','1024');
    form.append('height','1024');
    form.append('guidance','5');

    const serialized=new Response(form);
    const result=await context.env.AI.run('@cf/black-forest-labs/flux-2-klein-4b',{
      multipart:{body:serialized.body,contentType:serialized.headers.get('content-type')}
    });

    let b64='';
    if(result&&typeof result.image==='string')b64=result.image;
    else if(result instanceof ReadableStream){
      const bytes=new Uint8Array(await new Response(result).arrayBuffer());
      b64=bytesToBase64(bytes);
    }
    if(!b64)return json({error:'ما رجعت صورة من خدمة الذكاء الاصطناعي.'},502);
    return json({image:b64,provider:'cloudflare',model:'flux-2-klein-4b',occasion,scene,references:refs.length});
  }catch(e){
    const msg=String(e&&e.message||'');
    if(/quota|limit|neuron|billing|exceed/i.test(msg))return json({error:'خلص الحد المجاني لليوم. جرّب مرة ثانية باچر 🤍'},429);
    return json({error:'صار خطأ أثناء توليد الصورة. جرّب مرة ثانية.'},500);
  }
}

function bytesToBase64(bytes){let s='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)s+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(s)}
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}