(()=>{
  const configs={
    'زواج':{title:'صورتكم بالـ AI 🤍',desc:'ارفع صور العريس والعروس، وبعدها اختر واحد من 4 مشاهد خاصة بالزواج.',uploads:[{label:'صورة العريس الحالية',role:'groom_current',required:true},{label:'صورة العروس الحالية',role:'bride_current',required:true},{label:'صورة العريس وهو صغير',role:'groom_child',required:false},{label:'صورة العروس وهي صغيرة',role:'bride_child',required:false}],scenes:['وقفة زفاف رسمية','مسكة يد رومانسية','تبادل خواتم','بوكيه ولقطة ناعمة']},
    'ملكة / عقد قران':{title:'صورتكم بالـ AI 💍',desc:'ارفع صورة الخطيب والخطيبة، وبعدها اختر واحد من 4 مشاهد خاصة بالملكة.',uploads:[{label:'صورة الخطيب الحالية',role:'groom_current',required:true},{label:'صورة الخطيبة الحالية',role:'bride_current',required:true},{label:'صورة الخطيب وهو صغير',role:'groom_child',required:false},{label:'صورة الخطيبة وهي صغيرة',role:'bride_child',required:false}],scenes:['وقفة ملكة راقية','يمسكون يد بعض','لقطة خواتم','جلسة خطوبة أنيقة']},
    'تخرج':{title:'صورة التخرج بالـ AI 🎓',desc:'ارفع صورة الخريج، وبعدها اختر واحد من 4 مشاهد خاصة بالتخرج.',uploads:[{label:'صورة الخريج / الخريجة الحالية',role:'graduate_current',required:true},{label:'صورة ثانية لنفس الشخص — اختياري',role:'graduate_secondary',required:false},{label:'صورة ثالثة لنفس الشخص — اختياري',role:'graduate_third',required:false}],scenes:['قبعة التخرج فقط','قبعة + شهادة','قبعة + كيكة','رمي القبعة']},
    'عيد ميلاد':{title:'صورة عيد الميلاد بالـ AI 🎂',desc:'ارفع صورة صاحب عيد الميلاد، وبعدها اختر واحد من 4 مشاهد خاصة بعيد الميلاد.',uploads:[{label:'الصورة الحالية لصاحب عيد الميلاد',role:'birthday_current',required:true},{label:'صورة ثانية لنفس الشخص — اختياري',role:'birthday_secondary',required:false},{label:'صورة ثالثة لنفس الشخص — اختياري',role:'birthday_third',required:false}],scenes:['مع كيكة','مع بالونات','يفتح هدية','ينفخ الشموع']},
    'مولود / عقيقة':{title:'صورة المولود بالـ AI 👶🏻',desc:'اختر واحد من 4 مشاهد خاصة بالمولود والعقيقة.',uploads:[{label:'صورة الأم أو الأب',role:'parent_primary',required:true},{label:'صورة المولود — إذا موجود',role:'newborn',required:false},{label:'صورة الوالد الثاني — اختياري',role:'parent_secondary',required:false}],scenes:['المولود لحاله','الأم مع المولود','الأب والأم مع المولود','ستايل عقيقة خليجي']},
    'رمضان / عزيمة':{title:'صورتك بالـ AI 🌙',desc:'ارفع صورة صاحب المناسبة، وبعدها اختر واحد من 4 مشاهد رمضانية.',uploads:[{label:'صورة صاحب المناسبة',role:'host_primary',required:true},{label:'صورة شخص ثاني — اختياري',role:'host_secondary',required:false}],scenes:['سفرة رمضانية','مع فانوس','قهوة وتمور','جلسة عائلية رمضانية']},
    'مناسبة خاصة':{title:'صورتك بالـ AI ✨',desc:'ارفع الصورة الأساسية، وبعدها اختر واحد من 4 ستايلات جاهزة.',uploads:[{label:'الصورة الأساسية',role:'primary',required:true},{label:'صورة ثانية — اختياري',role:'secondary',required:false}],scenes:['هدية مفاجأة','ورد','بورتريه فاخر','لحظة عفوية']}
  };

  function getDraft(){try{return JSON.parse(localStorage.getItem('lammaInvite')||'{}')}catch{return {}}}
  function setDraft(patch){const d={...getDraft(),...patch};try{localStorage.setItem('lammaInvite',JSON.stringify(d))}catch{};try{Object.assign(draft,patch)}catch{};return d}

  function addStyles(){
    if(document.getElementById('occasionAiStyles'))return;
    const s=document.createElement('style');s.id='occasionAiStyles';
    s.textContent='.occasionUploads{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.occasionUpload{position:relative;min-height:132px;border:1.5px dashed #c99f8e;border-radius:16px;background:#fff;display:grid;place-items:center;text-align:center;overflow:hidden;padding:8px;color:#5f4c43}.occasionUpload input{position:absolute;inset:0;width:100%;height:100%;opacity:0;z-index:3}.occasionUpload img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none}.occasionUpload .uploadText{position:relative;z-index:1;font-size:13px;line-height:1.5}.occasionUpload .req{display:block;color:#a34f3b;font-size:11px;margin-top:4px}.occasionUpload .opt{display:block;color:#917c71;font-size:11px;margin-top:4px}.occasionCount{margin-top:9px;color:#8a756a;font-size:12px;text-align:center}.occasionSceneGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.occasionScene{min-height:58px;border-radius:14px;border:1px solid #ddcfc5;background:#fff;padding:10px;font:inherit;font-size:13px;font-weight:800;color:#5f4c43}.occasionScene.on{border:2px solid #b66a45;background:#fff0e8;color:#8e4e31}.occasionHint{margin-top:10px;padding:10px 12px;border-radius:13px;background:#fff8f4;color:#76594b;font-size:12px;line-height:1.65;border:1px solid #eaded5}.desktopDateGrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}.desktopDateGrid select{height:62px;border:1.5px solid #ddcfc5;background:#fff;border-radius:18px;padding:0 12px;font:inherit;font-size:16px;color:#251b17;cursor:pointer}@media(max-width:699px){.desktopDateGrid{display:none!important}}@media(max-width:380px){.occasionUploads{grid-template-columns:1fr 1fr;gap:7px}.occasionUpload{min-height:120px}.occasionSceneGrid{grid-template-columns:1fr 1fr}.occasionScene{font-size:12px;padding:8px}}';
    document.head.appendChild(s);
  }

  function fixPickers(){
    const dateInput=document.getElementById('date');
    if(dateInput&&innerWidth>=700&&!document.getElementById('desktopDateGrid')){
      const wrap=dateInput.closest('.pickerWrap');
      if(wrap){
        const grid=document.createElement('div');grid.id='desktopDateGrid';grid.className='desktopDateGrid';
        const day=document.createElement('select'),month=document.createElement('select'),year=document.createElement('select');
        day.innerHTML='<option value="">اليوم</option>'+Array.from({length:31},(_,i)=>`<option value="${String(i+1).padStart(2,'0')}">${i+1}</option>`).join('');
        const months=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
        month.innerHTML='<option value="">الشهر</option>'+months.map((m,i)=>`<option value="${String(i+1).padStart(2,'0')}">${m}</option>`).join('');
        const y=new Date().getFullYear();year.innerHTML='<option value="">السنة</option>'+Array.from({length:8},(_,i)=>`<option value="${y+i}">${y+i}</option>`).join('');
        const sync=()=>{if(day.value&&month.value&&year.value){dateInput.value=`${year.value}-${month.value}-${day.value}`;dateInput.dispatchEvent(new Event('input',{bubbles:true}));dateInput.dispatchEvent(new Event('change',{bubbles:true}))}};
        [day,month,year].forEach(s=>s.addEventListener('change',sync));
        if(dateInput.value){const [yy,mm,dd]=dateInput.value.split('-');year.value=yy;month.value=mm;day.value=dd}
        grid.append(day,month,year);wrap.insertAdjacentElement('afterend',grid);wrap.style.display='none';
      }
    }
    const timeInput=document.getElementById('time');
    if(timeInput){timeInput.style.setProperty('opacity','1','important');timeInput.style.setProperty('pointer-events','auto','important');timeInput.style.setProperty('position','static','important');timeInput.style.setProperty('width','100%','important');timeInput.style.setProperty('height','62px','important');timeInput.style.setProperty('appearance','auto','important');timeInput.style.setProperty('-webkit-appearance','auto','important');const tw=timeInput.closest('.pickerWrap');if(tw){const txt=tw.querySelector('.pickerText');if(txt)txt.style.display='none';tw.style.height='auto';tw.style.border='0';tw.style.background='transparent'}}
  }

  function buildUploads(aiMode,cfg){
    const old=aiMode.querySelector('.uploadgrid');if(!old)return;
    old.className='occasionUploads';old.innerHTML='';
    cfg.uploads.forEach((u,i)=>{const label=document.createElement('label');label.className='occasionUpload';label.innerHTML='<div class="uploadText">📷<br><b>'+u.label+'</b><span class="'+(u.required?'req':'opt')+'">'+(u.required?'مطلوبة':'اختيارية')+'</span></div><img id="occasionPreview'+i+'"><input id="occasionFile'+i+'" type="file" accept="image/*">';const input=label.querySelector('input'),img=label.querySelector('img'),txt=label.querySelector('.uploadText');input.addEventListener('change',()=>{const f=input.files?.[0];if(!f)return;img.src=URL.createObjectURL(f);img.style.display='block';txt.style.opacity='0'});old.appendChild(label)});
    let count=document.getElementById('occasionCount');if(!count){count=document.createElement('div');count.id='occasionCount';count.className='occasionCount';old.insertAdjacentElement('afterend',count)}const required=cfg.uploads.filter(x=>x.required).length,optional=cfg.uploads.length-required;count.textContent='الصور المطلوبة: '+required+(optional?' • اختيارية: '+optional:'');
  }

  function buildScenes(aiMode,cfg,d){
    let box=document.getElementById('occasionScenes');if(!box){box=document.createElement('div');box.id='occasionScenes';box.style.marginTop='14px';const consent=aiMode.querySelector('.consent');aiMode.insertBefore(box,consent||null)}
    box.innerHTML='<div style="font-size:14px;font-weight:900;margin-bottom:8px">اختر شكل الصورة — 4 خيارات</div><div id="occasionSceneGrid" class="occasionSceneGrid"></div>';
    const grid=box.querySelector('#occasionSceneGrid');const saved=d.aiScene&&cfg.scenes.includes(d.aiScene)?d.aiScene:cfg.scenes[0];cfg.scenes.forEach(scene=>{const b=document.createElement('button');b.type='button';b.className='occasionScene'+(scene===saved?' on':'');b.textContent=scene;b.onclick=()=>{grid.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');setDraft({aiScene:scene})};grid.appendChild(b)});setDraft({aiScene:saved});
  }

  function init(){
    addStyles();fixPickers();
    const d=getDraft(),type=d.type||'مناسبة خاصة',cfg=configs[type]||configs['مناسبة خاصة'];const aiMode=document.getElementById('aiMode');if(!aiMode)return;
    const panel=aiMode.closest('.panel'),headTitle=panel?.querySelector('.head h1'),headDesc=panel?.querySelector('.head p'),aiTitle=aiMode.querySelector('.aiTitle h2');if(headTitle)headTitle.textContent=cfg.title;if(headDesc)headDesc.textContent=cfg.desc;if(aiTitle)aiTitle.textContent=cfg.title.replace(/\s*[🤍💍🎓🎂👶🏻🌙✨]+$/u,'');buildUploads(aiMode,cfg);buildScenes(aiMode,cfg,d);
    const oldHint=document.getElementById('occasionAiHint');if(oldHint)oldHint.remove();const hint=document.createElement('div');hint.id='occasionAiHint';hint.className='occasionHint';hint.textContent=(type==='زواج'||type==='ملكة / عقد قران')?'ارفع صورتين واضحتين للوجه، صورة لكل شخص. هذا يساعد على تثبيت الوجوه.':'إذا رفعت أكثر من صورة لنفس الشخص، النظام يستخدمها كزوايا إضافية لتثبيت الوجه.';document.getElementById('occasionScenes').insertAdjacentElement('afterend',hint);
    window.generateAI=async function(){const inputs=cfg.uploads.map((u,i)=>({u,file:document.getElementById('occasionFile'+i)?.files?.[0]}));const missing=inputs.find(x=>x.u.required&&!x.file);if(missing)return alert('ارفع '+missing.u.label+' أول');if(!document.getElementById('consent')?.checked)return alert('أكد الإذن باستخدام الصور');const files=inputs.filter(x=>x.file),btn=document.getElementById('aiBtn'),result=document.getElementById('aiResult'),msg=document.getElementById('aiMsg');btn.disabled=true;btn.textContent='جاري التوليد...';msg.textContent='';try{const fd=new FormData();files.forEach((x,i)=>{fd.append('image'+(i+1),x.file);fd.append('role'+(i+1),x.u.role)});fd.append('style',document.querySelector('input[name=aistyle]:checked')?.value||'واقعي دافئ');fd.append('occasion',type);fd.append('scene',getDraft().aiScene||cfg.scenes[0]);fd.append('imageCount',String(files.length));const r=await fetch('/api/ai-couple',{method:'POST',body:fd}),j=await r.json();if(!r.ok||!j.image)throw new Error(j.error||'تعذر التوليد');const raw=j.image.startsWith('data:')?j.image:'data:image/png;base64,'+j.image,data=typeof compressDataUrl==='function'?await compressDataUrl(raw):raw;setDraft({aiImage:data,storySource:'ai',aiScene:getDraft().aiScene||cfg.scenes[0]});const img=document.getElementById('aiImage');img.src=data;result.style.display='block';msg.textContent='تمت الصورة 🤍'}catch(e){result.style.display='block';msg.textContent=e.message||'تعذر التوليد'}finally{btn.disabled=false;btn.textContent='✨ توليد الصورة'}};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();