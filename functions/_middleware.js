export async function onRequest(context){
  const response=await context.next();
  try{
    const url=new URL(context.request.url);
    const type=response.headers.get('content-type')||'';
    if((url.pathname==='/'||url.pathname.endsWith('/create.html'))&&type.includes('text/html')){
      return new HTMLRewriter().on('body',{
        element(el){
          if(url.pathname.endsWith('/create.html')){
            el.append('<script src="/occasion-ui.js?v=2"></script><script src="/ai-occasion.js?v=2"></script>',{html:true});
          }
        }
      }).transform(response);
    }
  }catch{}
  return response;
}
