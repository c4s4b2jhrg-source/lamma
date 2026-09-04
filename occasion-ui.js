(()=>{
  const configs={
    'زواج':{head:'تفاصيل دعوة الزواج 💍',sub:'العنوان والرسالة الخاصة بالزواج.',title:'مثال: زواج سارة ومحمد',msg:'يسعدنا حضوركم ومشاركتنا فرحتنا...',host:'اسم صاحب الدعوة',hostPlaceholder:'مثال: عائلة أحمد',place:'مثال: قاعة اللؤلؤة'},
    'ملكة / عقد قران':{head:'تفاصيل الملكة / عقد القران 🤍',sub:'العنوان والرسالة الخاصة بالمناسبة.',title:'مثال: ملكة سارة ومحمد',msg:'يسعدنا حضوركم ومشاركتنا فرحة عقد القران...',host:'اسم صاحب الدعوة',hostPlaceholder:'مثال: عائلة أحمد',place:'مثال: مجلس أو قاعة المناسبة'},
    'تخرج':{head:'تفاصيل التخرج 🎓',sub:'اكتب عنوان ورسالة التخرج.',title:'مثال: حفل تخرج سارة 🎓',msg:'بكل فخر نشارككم فرحة التخرج ونسعد بحضوركم...',host:'اسم الخريج / الخريجة',hostPlaceholder:'مثال: سارة أحمد',place:'مثال: قاعة حفل التخرج'},
    'عيد ميلاد':{head:'تفاصيل عيد الميلاد 🎂',sub:'اكتب عنوان ورسالة عيد الميلاد.',title:'مثال: عيد ميلاد علي 🎂',msg:'نفرح بوجودكم معنا في عيد الميلاد...',host:'اسم صاحب / صاحبة عيد الميلاد',hostPlaceholder:'مثال: علي',place:'مثال: البيت أو مكان الحفلة'},
    'مولود / عقيقة':{head:'تفاصيل المولود / العقيقة 👶🏻',sub:'اكتب عنوان ورسالة المناسبة.',title:'مثال: أهلاً بمولودنا يوسف 👶🏻',msg:'بكل حب نشارككم فرحتنا بالمولود ونسعد بحضوركم...',host:'اسم صاحب المناسبة',hostPlaceholder:'مثال: عائلة أحمد',place:'مثال: المنزل أو مجلس العقيقة'},
    'رمضان / عزيمة':{head:'تفاصيل العزيمة 🌙',sub:'اكتب عنوان ورسالة العزيمة.',title:'مثال: عزيمة رمضان 🌙',msg:'يسعدنا تشريفكم ولمّتكم معنا...',host:'اسم صاحب العزيمة',hostPlaceholder:'مثال: أبو محمد',place:'مثال: المنزل أو المجلس'},
    'مناسبة خاصة':{head:'تفاصيل المناسبة ✨',sub:'اكتب العنوان والرسالة.',title:'مثال: لمّتنا الخاصة ✨',msg:'يسعدنا حضوركم ومشاركتنا هذه المناسبة...',host:'اسم صاحب المناسبة',hostPlaceholder:'مثال: عائلة أحمد',place:'مثال: مكان المناسبة'}
  };
  function selectedType(){
    const q=new URLSearchParams(location.search).get('type');
    if(q&&configs[q])return q;
    try{const d=JSON.parse(localStorage.getItem('lammaInvite')||'{}');if(d.type&&configs[d.type])return d.type}catch{}
    return 'مناسبة خاصة';
  }
  function init(){
    const type=selectedType();
    try{const d=JSON.parse(localStorage.getItem('lammaInvite')||'{}');d.type=type;localStorage.setItem('lammaInvite',JSON.stringify(d))}catch{}
    const cfg=configs[type];
    const panels=[...document.querySelectorAll('.panel')];
    const first=panels[0];
    if(first){const h=first.querySelector('.head h1'),p=first.querySelector('.head p');if(h)h.textContent=cfg.head;if(p)p.textContent=cfg.sub}
    const title=document.getElementById('title');if(title)title.placeholder=cfg.title;
    const msg=document.getElementById('msg');if(msg)msg.placeholder=cfg.msg;
    const place=document.getElementById('place');if(place)place.placeholder=cfg.place;
    const host=document.getElementById('host');if(host){host.placeholder=cfg.hostPlaceholder;const label=host.previousElementSibling;if(label&&label.tagName==='LABEL')label.textContent=cfg.host}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();