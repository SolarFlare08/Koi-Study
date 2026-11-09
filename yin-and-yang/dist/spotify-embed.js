let apiReady;
function spotifyApi(){
  if (apiReady) return apiReady;
  apiReady=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    const deadline=setTimeout(()=>reject(new Error('Spotify API unavailable')),6500);
    window.onSpotifyIframeApiReady=api=>{clearTimeout(deadline);resolve(api);};
    script.src='https://open.spotify.com/embed/iframe-api/v1';
    script.async=true;
    script.onerror=()=>{clearTimeout(deadline);reject(new Error('Spotify API unavailable'));};
    document.head.append(script);
  });
  return apiReady;
}

export function createSpotifyEmbed(setPlayback){
  let generation=0,controller;
  function clear(wrap){
    generation++;
    controller?.destroy();
    controller=null;
    wrap.replaceChildren();
    setPlayback('idle');
  }
  async function mount(wrap,path){
    clear(wrap);
    const token=generation;
    setPlayback('unknown');
    const loading=document.createElement('div');
    loading.textContent='Loading Spotify…';
    loading.className='spotify-embed-placeholder';
    wrap.append(loading);
    try {
      const api=await spotifyApi();
      if (token!==generation) return;
      loading.textContent='';
      const [type,id]=path.split('/');
      api.createController(loading,{uri:`spotify:${type}:${id}`,width:'100%',height:152},embed=>{
        if (token!==generation){embed.destroy();return;}
        controller=embed;
        const emit=value=>{if(token===generation)setPlayback(value);};
        embed.addListener('ready',()=>emit('idle'));
        embed.addListener('playback_started',()=>emit('playing'));
        embed.addListener('playback_update',({data})=>{
          if (typeof data?.isPaused==='boolean') emit(!data.isPaused||data.isBuffering?'playing':'idle');
        });
      });
    } catch {
      if (token!==generation) return;
      const iframe=document.createElement('iframe');
      iframe.className='spotify-embed';
      iframe.title='Spotify player';
      iframe.src=`https://open.spotify.com/embed/${path}?theme=0`;
      iframe.allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
      wrap.replaceChildren(iframe);
      setPlayback('unknown');
    }
  }
  return {mount,clear};
}
