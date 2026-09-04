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
      'واقعي دافئ':'realistic professional photography, natural skin texture, warm natural light, premium soft background, restrained styling',
      'طفولي ناعم':'soft dreamy photography with realistic facial identity, pastel tones, gentle warm mood',
      'سينمائي فاخر':'cinematic high-end photography while preserving the real face above all stylization',
      'رسوم كرتونية لطيفة':'gentle illustrated styling while keeping the person recognizably the same; do not redesign the face'
    }[style]||style;

    const samePersonRoles=new Set(['graduate_current','graduate_secondary','graduate_third','birthday_current','birthday_secondary','birthday_third']);
    const roleDescriptions={
      groom_current:'current adult groom — unique person A',
      bride_current:'current adult bride — unique person B',
      groom_child:'childhood reference of the SAME groom',
      bride_child:'childhood reference of the SAME bride',
      graduate_current:'primary current identity reference of the graduate',
      graduate_secondary:'second angle/reference of the SAME graduate',
      graduate_third:'third angle/reference of the SAME graduate',
      birthday_current:'primary current identity reference of the birthday person',
      birthday_secondary:'second angle/reference of the SAME birthday person',
      birthday_third:'third angle/reference of the SAME birthday person',
      parent_primary:'primary parent identity reference',
      newborn:'newborn identity reference, only if this image is provided',
      parent_secondary:'second parent identity reference',
      host_primary:'primary host identity reference',
      host_secondary:'second person identity reference',
      primary:'primary identity reference',
      secondary:'second identity reference'
    };
    const roleText=refs.map((x,i)=>`Input image ${i+1}: ${roleDescriptions[x.role]||x.role}.`).join('\n');

    const samePersonRefCount=refs.filter(x=>samePersonRoles.has(x.role)).length;
    const hasNewborn=roleSet.has('newborn');

    const occasionHint={
      'زواج':`Create an elegant Gulf wedding image using the groom and bride references. Selected idea: ${scene}. Keep both identities separate and clearly recognizable.`,
      'ملكة / عقد قران':`Create a refined engagement / nikah image using the current groom and bride references. Selected idea: ${scene}. Keep both identities separate and clearly recognizable.`,
      'تخرج':`Create a graduation portrait of the referenced graduate. Selected idea: ${scene}. ${samePersonRefCount>1?'Multiple images are references of the SAME graduate from different angles. Combine them only to improve identity accuracy; do not create extra people.':''}`,
      'عيد ميلاد':`Create a birthday portrait of the referenced birthday person. Selected idea: ${scene}. ${samePersonRefCount>1?'Multiple images are references of the SAME birthday person from different angles. Combine them only to improve identity accuracy; do not create extra people.':''}`,
      'مولود / عقيقة':`Create a warm newborn / aqiqah image. Selected idea: ${scene}. ${hasNewborn?'Preserve the newborn identity carefully.':'If no newborn reference is supplied, create a generic newborn without implying a specific identity.'}`,
      'رمضان / عزيمة':`Create a warm Gulf Ramadan gathering portrait using the supplied references. Selected idea: ${scene}.`,
      'مناسبة خاصة':`Create a polished special-occasion portrait using the supplied references. Selected idea: ${scene}.`
    }[occasion]||`Create a polished special-occasion portrait. Selected idea: ${scene}.`;

    const prompt=`${occasionHint}\n\nREFERENCE MAP:\n${roleText}\n\nIDENTITY PRESERVATION — HIGHEST PRIORITY:\n- Preserve each person's real facial identity as closely as possible.\n- Keep face shape, eye shape and spacing, eyebrows, nose, lips, jawline, cheeks, skin tone, hairstyle/hairline, apparent age, and distinctive features consistent with the references.\n- Do not beautify, idealize, slim the face, enlarge eyes, reshape nose or lips, change age, change skin tone, or invent a new face.\n- If multiple images belong to the same person, treat them as multiple angles of ONE identity and never generate duplicate people from them.\n- If the scene contains two different people, never mix, blend, swap, or average their faces.\n- Prefer front-facing or three-quarter angles. Avoid extreme profile views if they reduce likeness.\n- If a pose would hide or distort a face, use a gentler version that keeps the face visible.\n- Change only pose, clothes, props, scene, and background as needed. Identity fidelity is more important than dramatic composition.\n\nCLOTHING AND SAFETY:\n- Everyone must be fully dressed in neat, modest, age-appropriate clothing.\n- No shirtless or bare-chested person.\n- No revealing clothing.\n- Family-friendly and suitable for a Gulf digital invitation.\n\nVISUAL STYLE:\n- ${styleHint}.\n- Premium invitation-quality composition.\n- Natural skin, believable anatomy, clean hands, coherent lighting and gentle expressions.\n\nSTRICTLY AVOID:\nidentity drift, face redesign, face swapping, blended identities, duplicate people from multiple reference angles, wrong age, beauty-filter look, distorted faces, extra fingers, extra hands, duplicated people, unintended extra people, cropped heads, text, logos, watermarks.`;

    const form=new FormData();
    form.append('prompt',prompt);
    refs.forEach((x,i)=>form.append('input_image_'+i,x.file,x.file.name||('reference'+(i+1)+'.jpg')));
    form.append('width','1024');
    form.append('height','1024');
    form.append('guidance','4');

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