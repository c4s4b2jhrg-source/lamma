export async function onRequestPost(context){
  try{
    if(!context.env.AI){
      return json({error:'ميزة AI جاهزة. باقي ربط Workers AI بالمشروع باسم AI.'},503);
    }

    const incoming=await context.request.formData();
    const image1=incoming.get('image1');
    const image2=incoming.get('image2');
    const style=String(incoming.get('style')||'واقعي دافئ');
    const occasion=String(incoming.get('occasion')||'مناسبة خاصة');
    const scene=String(incoming.get('scene')||'واقعي وأنيق');

    if(!(image1 instanceof File)){
      return json({error:'ارفع الصورة الأساسية أول.'},400);
    }
    if(image1.size>8*1024*1024||(image2 instanceof File&&image2.size>8*1024*1024)){
      return json({error:'حجم الصورة كبير. اختر صورة أصغر.'},400);
    }

    const needsTwo=occasion==='زواج'||occasion==='ملكة / عقد قران';
    if(needsTwo&&!(image2 instanceof File)){
      return json({error:'هذي المناسبة تحتاج الصورتين.'},400);
    }

    const styleHint={
      'واقعي دافئ':'realistic professional photography, warm natural light, premium soft background',
      'طفولي ناعم':'soft dreamy portrait, pastel tones, gentle warm mood',
      'سينمائي فاخر':'cinematic high-end portrait, elegant lighting, premium film look',
      'رسوم كرتونية لطيفة':'cute polished cartoon illustration, soft clean shapes, charming expressions'
    }[style]||style;

    const occasionHint={
      'زواج':`Create an elegant Gulf wedding portrait of the two referenced adults. Dress both in complete, modest, premium wedding/formal clothing. Keep them naturally close together. The selected scene is: ${scene}. If suitable, let them gently hold hands or stand shoulder-to-shoulder.`,
      'ملكة / عقد قران':`Create a refined engagement / nikah portrait of the two referenced adults. Use modest elegant formal Gulf attire and a tasteful celebratory setting. The selected scene is: ${scene}. Keep their interaction natural and respectful.`,
      'تخرج':`Create a graduation portrait of the main referenced person. Put the person in a complete graduation gown and cap and/or holding a diploma depending on the selected scene: ${scene}. If a second reference is provided, treat it as a childhood reference of the SAME person and only make a tasteful then-and-now composition when the selected scene implies childhood and present day.`,
      'عيد ميلاد':`Create a birthday portrait of the main referenced person. Use the selected scene: ${scene}. Add tasteful birthday details such as cake, balloons or elegant celebration decor as appropriate. If a second reference is provided, treat it as a childhood reference of the SAME person and use it only for a then-and-now composition when appropriate.`,
      'مولود / عقيقة':`Create a warm newborn / aqiqah themed portrait. The main reference is a parent or family member; if a second reference exists, it may be the newborn. Use the selected scene: ${scene}. If no newborn reference exists, create a generic newborn in the scene without claiming a specific facial identity. Keep everything modest, gentle and family-friendly.`,
      'رمضان / عزيمة':`Create a warm Gulf Ramadan gathering / invitation portrait using the uploaded reference person or people. Use modest traditional or elegant clothing, lanterns or a tasteful majlis/dining atmosphere as appropriate. The selected scene is: ${scene}.`,
      'مناسبة خاصة':`Create a polished special-occasion portrait using the uploaded reference person or people. The selected scene is: ${scene}. Keep the result elegant, warm and invitation-ready.`
    }[occasion]||`Create a polished special-occasion portrait. The selected scene is: ${scene}.`;

    const referenceInstruction=image2 instanceof File
      ? 'Use BOTH uploaded reference images according to the occasion instructions. Preserve recognizable facial identity, hairstyle and key facial features of each referenced person as faithfully as possible.'
      : 'Use the uploaded reference image as the primary identity reference. Preserve recognizable facial identity, hairstyle and key facial features as faithfully as possible.';

    const prompt=`${occasionHint}\n\nREFERENCE RULES:\n- ${referenceInstruction}\n- Create a fresh three-quarter or full-body composition; do not simply copy the original pose.\n- Keep realistic proportions and coherent lighting.\n\nCLOTHING AND SAFETY:\n- Everyone must be fully dressed in neat, modest, age-appropriate clothing.\n- No shirtless or bare-chested person.\n- No revealing clothing.\n- Family-friendly, tasteful and suitable for a Gulf digital invitation.\n\nVISUAL STYLE:\n- ${styleHint}.\n- Premium invitation-quality composition.\n- Natural skin, believable anatomy, clean hands and gentle expressions.\n\nSTRICTLY AVOID: awkward pose, extra fingers, extra hands, duplicated people, unintended extra people, distorted faces, deformed anatomy, cropped heads, scary expressions, text, logos, watermarks.`;

    const form=new FormData();
    form.append('prompt',prompt);
    form.append('input_image_0',image1,image1.name||'reference1.jpg');
    if(image2 instanceof File){
      form.append('input_image_1',image2,image2.name||'reference2.jpg');
    }
    form.append('width','1024');
    form.append('height','1024');
    form.append('guidance','5');

    const serialized=new Response(form);
    const result=await context.env.AI.run('@cf/black-forest-labs/flux-2-klein-4b',{
      multipart:{
        body:serialized.body,
        contentType:serialized.headers.get('content-type')
      }
    });

    let b64='';
    if(result&&typeof result.image==='string')b64=result.image;
    else if(result instanceof ReadableStream){
      const bytes=new Uint8Array(await new Response(result).arrayBuffer());
      b64=bytesToBase64(bytes);
    }

    if(!b64)return json({error:'ما رجعت صورة من خدمة الذكاء الاصطناعي.'},502);
    return json({image:b64,provider:'cloudflare',model:'flux-2-klein-4b',occasion,scene});
  }catch(e){
    const msg=String(e&&e.message||'');
    if(/quota|limit|neuron|billing|exceed/i.test(msg)){
      return json({error:'خلص الحد المجاني لليوم. جرّب مرة ثانية باچر 🤍'},429);
    }
    return json({error:'صار خطأ أثناء توليد الصورة. جرّب مرة ثانية.'},500);
  }
}

function bytesToBase64(bytes){
  let s='';
  const chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk)s+=String.fromCharCode(...bytes.subarray(i,i+chunk));
  return btoa(s);
}

function json(body,status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{
      'content-type':'application/json; charset=utf-8',
      'cache-control':'no-store'
    }
  });
}
