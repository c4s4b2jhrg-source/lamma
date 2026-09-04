export async function onRequest(context){
  const response=await context.next();
  try{
    const url=new URL(context.request.url);
    const contentType=response.headers.get('content-type')||'';
    if(url.pathname.endsWith('/create.html')&&contentType.includes('text/html')){
      const configs={
        'زواج':{title:'مثال: زواج سارة ومحمد',msg:'يسعدنا حضوركم ومشاركتنا فرحتنا...',place:'مثال: قاعة اللؤلؤة',host:'مثال: عائلة أحمد'},
        'ملكة / عقد قران':{title:'مثال: ملكة سارة ومحمد',msg:'يسعدنا حضوركم ومشاركتنا فرحة عقد القران...',place:'مثال: مجلس أو قاعة المناسبة',host:'مثال: عائلة أحمد'},
        'تخرج':{title:'مثال: حفل تخرج سارة 🎓',msg:'بكل فخر نشارككم فرحة التخرج ونسعد بحضوركم...',place:'مثال: قاعة حفل التخرج',host:'مثال: سارة أحمد'},
        'عيد ميلاد':{title:'مثال: عيد ميلاد علي 🎂',msg:'نفرح بوجودكم معنا في عيد الميلاد...',place:'مثال: البيت أو مكان الحفلة',host:'مثال: علي'},
        'مولود / عقيقة':{title:'مثال: أهلاً بمولودنا يوسف 👶🏻',msg:'بكل حب نشارككم فرحتنا بالمولود ونسعد بحضوركم...',place:'مثال: المنزل أو مجلس العقيقة',host:'مثال: عائلة أحمد'},
        'رمضان / عزيمة':{title:'مثال: عزيمة رمضان 🌙',msg:'يسعدنا تشريفكم ولمّتكم معنا...',place:'مثال: المنزل أو المجلس',host:'مثال: أبو محمد'},
        'مناسبة خاصة':{title:'مثال: لمّتنا الخاصة ✨',msg:'يسعدنا حضوركم ومشاركتنا هذه المناسبة...',place:'مثال: مكان المناسبة',host:'مثال: عائلة أحمد'}
      };
      const selected=url.searchParams.get('type');
      const cfg=configs[selected]||null;
      let rewriter=new HTMLRewriter().on('body',{element(el){
        const safe=selected&&configs[selected]?selected:'';
        if(safe)el.prepend(`<script>try{localStorage.setItem('lammaInvite',JSON.stringify({type:${JSON.stringify(safe)}}))}catch(e){}</script>`,{html:true});
        el.append('<script src="/occasion-ui.js?v=4"></script><script src="/ai-occasion.js?v=4"></script>',{html:true});
      }});
      if(cfg){
        rewriter=rewriter
          .on('#title',{element(el){el.setAttribute('placeholder',cfg.title)}})
          .on('#msg',{element(el){el.setAttribute('placeholder',cfg.msg)}})
          .on('#place',{element(el){el.setAttribute('placeholder',cfg.place)}})
          .on('#host',{element(el){el.setAttribute('placeholder',cfg.host)}});
      }
      return rewriter.transform(response);
    }
  }catch{}
  return response;
}
