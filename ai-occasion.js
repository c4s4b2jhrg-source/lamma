(()=>{
  const configs={
    'زواج':{
      title:'صورتكم بالـ AI 🤍',
      desc:'ارفع صورة العريس وصورة العروس، واختر شكل المشهد اللي تبيه.',
      first:'صورة العريس',second:'صورة العروس',secondRequired:true,
      scenes:['لقطة زفاف أنيقة','يمسكون يد بعض','جلسة رسمية فخمة','لقطة رومانسية ناعمة']
    },
    'ملكة / عقد قران':{
      title:'صورتكم بالـ AI 💍',
      desc:'ارفع صورة الخطيب وصورة الخطيبة، وبنولد لكم لقطة تناسب الملكة أو عقد القران.',
      first:'صورة الخطيب',second:'صورة الخطيبة',secondRequired:true,
      scenes:['طابع عقد قران راقٍ','جلسة خطوبة أنيقة','يمسكون يد بعض','لقطة ناعمة ورسمية']
    },
    'تخرج':{
      title:'صورة التخرج بالـ AI 🎓',
      desc:'ارفع صورة الخريج الحالية، وإذا تبي أضف صورة وهو صغير عشان نسوي لقطة طفولة وحاضر.',
      first:'صورة الخريج الحالية',second:'صورة وهو صغير (اختياري)',secondRequired:false,
      scenes:['لابس روب التخرج وماسك الشهادة','قبعة تخرج في أجواء احتفالية','طفولة وحاضر في لقطة واحدة','جلسة تخرج سينمائية']
    },
    'عيد ميلاد':{
      title:'صورة عيد الميلاد بالـ AI 🎂',
      desc:'ارفع صورته الحالية، وإذا تبي أضف صورة وهو صغير. بنولد الصورة حسب أجواء عيد الميلاد.',
      first:'صورته الحالية',second:'صورته وهو صغير (اختياري)',secondRequired:false,
      scenes:['مع كيك وبالونات','حفلة عيد ميلاد فخمة','طفولة وحاضر في لقطة واحدة','لقطة احتفالية ناعمة']
    },
    'مولود / عقيقة':{
      title:'صورة المولود بالـ AI 👶🏻',
      desc:'ارفع صورة الأم أو الأب، وإذا عندك صورة للمولود أضفها. وإذا المولود للحين ما وصل، نولد مشهد استقبال مولود لطيف.',
      first:'صورة الأم أو الأب',second:'صورة المولود (اختياري)',secondRequired:false,
      scenes:['يحمل المولود بين يديه','استقبال مولود بأجواء ناعمة','المولود في سرير أنيق','عقيقة بطابع خليجي هادئ']
    },
    'رمضان / عزيمة':{
      title:'صورتك بالـ AI 🌙',
      desc:'ارفع صورة صاحب المناسبة، وتقدر تضيف صورة ثانية اختيارية. بنولد أجواء رمضانية أو عزيمة مرتبة.',
      first:'صورة صاحب المناسبة',second:'صورة ثانية (اختياري)',secondRequired:false,
      scenes:['مجلس رمضاني فاخر','سفرة عزيمة أنيقة','جلسة خليجية رمضانية','فوانيس وإضاءة دافئة']
    },
    'مناسبة خاصة':{
      title:'صورتك بالـ AI ✨',
      desc:'ارفع الصورة الأساسية، وتقدر تضيف صورة ثانية اختيارية. بعدها اختر المشهد المناسب لك.',
      first:'الصورة الأساسية',second:'صورة ثانية (اختياري)',secondRequired:false,
      scenes:['واقعي وأنيق','سينمائي فاخر','لطيف وناعم','احتفالي']
    }
  };

  function getDraft(){
    try{return JSON.parse(localStorage.getItem('lammaInvite')||'{}')}catch{return {}}
  }
  function setDraft(patch){
    const d={...getDraft(),...patch};
    try{localStorage.setItem('lammaInvite',JSON.stringify(d))}catch{}
    return d;
  }

  function init(){
    const d=getDraft();
    const type=d.type||'مناسبة خاصة';
    const cfg=configs[type]||configs['مناسبة خاصة'];
    const aiMode=document.getElementById('aiMode');
    if(!aiMode)return;

    const panel=aiMode.closest('.panel');
    const headTitle=panel?.querySelector('.head h1');
    const headDesc=panel?.querySelector('.head p');
    const aiTitle=aiMode.querySelector('.aiTitle h2');
    if(headTitle)headTitle.textContent=cfg.title;
    if(headDesc)headDesc.textContent=cfg.desc;
    if(aiTitle)aiTitle.textContent=cfg.title.replace(/\s*[🤍💍🎓🎂👶🏻🌙✨]+$/u,'');

    const boyText=document.getElementById('boyText');
    const girlText=document.getElementById('girlText');
    if(boyText)boyText.innerHTML='📷<br><b>'+cfg.first+'</b>';
    if(girlText)girlText.innerHTML='📷<br><b>'+cfg.second+'</b>';

    let sceneBox=document.getElementById('occasionScenes');
    if(!sceneBox){
      sceneBox=document.createElement('div');
      sceneBox.id='occasionScenes';
      sceneBox.style.marginTop='12px';
      sceneBox.innerHTML='<div style="font-size:14px;font-weight:900;margin-bottom:8px">اختر المشهد</div><div id="occasionSceneGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"></div>';
      const consent=aiMode.querySelector('.consent');
      aiMode.insertBefore(sceneBox,consent||null);
    }

    const grid=document.getElementById('occasionSceneGrid');
    const saved=d.aiScene&&cfg.scenes.includes(d.aiScene)?d.aiScene:cfg.scenes[0];
    grid.innerHTML='';
    cfg.scenes.forEach((scene,i)=>{
      const b=document.createElement('button');
      b.type='button';
      b.textContent=scene;
      b.dataset.scene=scene;
      b.style.cssText='min-height:48px;border-radius:13px;border:1px solid #ddcfc5;background:#fff;padding:8px;font:inherit;font-size:13px;font-weight:800;color:#5f4c43';
      if(scene===saved){b.style.border='2px solid #b66a45';b.style.background='#fff0e8'}
      b.onclick=()=>{
        [...grid.children].forEach(x=>{x.style.border='1px solid #ddcfc5';x.style.background='#fff'});
        b.style.border='2px solid #b66a45';b.style.background='#fff0e8';
        setDraft({aiScene:scene});
      };
      grid.appendChild(b);
    });
    setDraft({aiScene:saved});

    const hint=document.createElement('div');
    hint.id='occasionAiHint';
    hint.style.cssText='margin-top:10px;padding:10px 12px;border-radius:13px;background:#fff8f4;color:#76594b;font-size:12px;line-height:1.65;border:1px solid #eaded5';
    hint.textContent=cfg.secondRequired?'لازم ترفع الصورتين عشان نحافظ على ملامح الشخصين.':'الصورة الثانية اختيارية — تقدر تولد بالصورة الأساسية فقط.';
    const old=document.getElementById('occasionAiHint');if(old)old.remove();
    sceneBox.insertAdjacentElement('afterend',hint);

    window.generateAI=async function(){
      const a=document.getElementById('boyPhoto')?.files?.[0];
      const b=document.getElementById('girlPhoto')?.files?.[0];
      if(!a)return alert('ارفع '+cfg.first+' أول');
      if(cfg.secondRequired&&!b)return alert('ارفع '+cfg.second+' بعد');
      if(!document.getElementById('consent')?.checked)return alert('أكد الإذن باستخدام الصور');

      const btn=document.getElementById('aiBtn');
      const result=document.getElementById('aiResult');
      const msg=document.getElementById('aiMsg');
      btn.disabled=true;btn.textContent='جاري التوليد...';msg.textContent='';
      try{
        const fd=new FormData();
        fd.append('image1',a);
        if(b)fd.append('image2',b);
        fd.append('style',document.querySelector('input[name=aistyle]:checked')?.value||'واقعي دافئ');
        fd.append('occasion',type);
        fd.append('scene',getDraft().aiScene||cfg.scenes[0]);
        const r=await fetch('/api/ai-couple',{method:'POST',body:fd});
        const j=await r.json();
        if(!r.ok||!j.image)throw new Error(j.error||'تعذر التوليد');
        let raw=j.image.startsWith('data:')?j.image:'data:image/png;base64,'+j.image;
        let data=typeof window.compressDataUrl==='function'?await window.compressDataUrl(raw):raw;
        const now=setDraft({aiImage:data,storySource:'ai',aiScene:getDraft().aiScene||cfg.scenes[0]});
        if(typeof window.draft==='object'){window.draft.aiImage=data;window.draft.storySource='ai';window.draft.aiScene=now.aiScene}
        const img=document.getElementById('aiImage');img.src=data;
        result.style.display='block';msg.textContent='تمت الصورة 🤍';
      }catch(e){
        result.style.display='block';msg.textContent=e.message||'تعذر التوليد';
      }finally{
        btn.disabled=false;btn.textContent='✨ توليد الصورة';
      }
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();