// Redeploy marker: Workers AI binding enabled
export async function onRequestPost(context){
  try{
    if(!context.env.AI){
      return json({error:'ميزة AI جاهزة. باقي ربط Workers AI بالمشروع باسم AI.'},503);
    }

    const incoming=await context.request.formData();
    const image1=incoming.get('image1');
    const image2=incoming.get('image2');
    const style=String(incoming.get('style')||'واقعي دافئ');

    if(!(image1 instanceof File)||!(image2 instanceof File)){
      return json({error:'ارفع الصورتين أول.'},400);
    }
    if(image1.size>8*1024*1024||image2.size>8*1024*1024){
      return json({error:'حجم الصورة كبير. اختر صورة أصغر.'},400);
    }

    const form=new FormData();
    form.append('prompt',`Create one tasteful childhood memory portrait combining the two children from the two reference photos into one natural scene. Keep each child's recognizable facial identity and age appearance as faithfully as possible. They should look naturally photographed together, with realistic proportions, matching lighting, coherent camera angle, warm elegant Gulf family-memory aesthetic. Style: ${style}. No text, no logos, no watermark, no extra people, no duplicated faces, no deformed hands.`);
    form.append('input_image_0',image1,image1.name||'child1.jpg');
    form.append('input_image_1',image2,image2.name||'child2.jpg');
    form.append('width','1024');
    form.append('height','1024');
    form.append('guidance','4');

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
    return json({image:b64,provider:'cloudflare',model:'flux-2-klein-4b'});
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
