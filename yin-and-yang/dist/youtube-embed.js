const videoId=/^[a-zA-Z0-9_-]{11}$/;
const listId=/^[a-zA-Z0-9_-]{10,100}$/;

export function youtubeContent(link){
  let url;
  try{url=new URL(link);}catch{return null;}
  if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
  const short=url.hostname==='youtu.be';
  if(!short&&!['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'].includes(url.hostname))return null;
  const [part,id]=url.pathname.split('/').filter(Boolean);
  const video=(short?part:part==='watch'?url.searchParams.get('v'):
    ['shorts','live','embed'].includes(part)?id:'')||'';
  const list=url.searchParams.get('list')||'';
  if(video&&!videoId.test(video)||list&&!listId.test(list)||!video&&!list)return null;
  return {video,list};
}

export function youtubeLinks({video,list},origin){
  const watch=new URL(video?'/watch':'/playlist','https://www.youtube.com');
  const embed=new URL(video?'/embed/'+video:'/embed','https://www.youtube.com');
  if(video)watch.searchParams.set('v',video);
  if(list){watch.searchParams.set('list',list);embed.searchParams.set('listType','playlist');embed.searchParams.set('list',list);}
  embed.searchParams.set('playsinline','1');
  if(origin&&origin!=='null'){embed.searchParams.set('enablejsapi','1');embed.searchParams.set('origin',origin);}
  return {watch:watch.href,embed:embed.href};
}

let ready;
function youtubeApi(){
  if(window.YT?.Player)return Promise.resolve(window.YT);
  if(ready)return ready;
  ready=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    const fail=()=>{clearTimeout(timeout);script.remove();reject(new Error('YouTube API unavailable'));};
    const timeout=setTimeout(fail,6500);
    window.onYouTubeIframeAPIReady=()=>{clearTimeout(timeout);resolve(window.YT);};
    script.src='https://www.youtube.com/iframe_api';script.async=true;script.onerror=fail;
    document.head.append(script);
  }).catch(error=>{ready=null;throw error;});
  return ready;
}

export function createYouTubeEmbed(setPlayback,onError){
  let player,revision=0;
  function clear(){
    revision++;
    player?.destroy();
    player=null;
    setPlayback('idle');
  }
  async function mount(wrap,content){
    clear();
    const token=revision;
    const iframe=document.createElement('iframe');
    iframe.src=youtubeLinks(content,location.origin).embed;
    iframe.title='YouTube video player';
    iframe.className='youtube-embed';
    iframe.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';
    iframe.allowFullscreen=true;
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    wrap.replaceChildren(iframe);
    setPlayback('unknown');
    try{
      const YT=await youtubeApi();
      if(token!==revision)return;
      player=new YT.Player(iframe,{
        events:{
          onReady:()=>{if(token===revision)setPlayback('idle');},
          onStateChange:({data})=>{
            if(token===revision)setPlayback(data===1||data===3?'playing':'idle');
          },
          onError:()=>{
            if(token!==revision)return;
            setPlayback('idle');
            onError('This video could not play here. Open it on YouTube.');
          }
        }
      });
    }catch{if(token===revision)onError('Playback status is unavailable. If the player cannot load, open it on YouTube.');}
  }
  return {clear,mount};
}
