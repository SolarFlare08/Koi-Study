export const soundChannels={rain:'Rain',water:'Water',wind:'Wind',focus:'Focus chimes',break:'Break reminders'};
const levels={rain:.22,water:.25,wind:.29};
const volume=value=>Number.isFinite(value)?Math.max(0,Math.min(100,Math.round(value))):0;

export function loadSoundSettings(value){
  const settings=Object.fromEntries(Object.keys(soundChannels).map(key=>[key,volume(value?.[key])]));
  return {...settings,muted:value?.muted===true,musicMode:value?.musicMode===true};
}

export function createGardenAudio(){
  const AudioEngine=globalThis.AudioContext||globalThis.webkitAudioContext;
  const tracks=new Map();
  let context,master,settings=loadSoundSettings(),blocked=false;

  function ambientTrack(kind){
    const seconds=8;
    const buffer=context.createBuffer(1,context.sampleRate*seconds,context.sampleRate);
    const samples=buffer.getChannelData(0);
    let brown=0;
    for (let i=0;i<samples.length;i++){
      const white=Math.random()*2-1;
      brown=(brown+white*.027)*.978;
      const edge=Math.min(1,i/240,(samples.length-1-i)/240);
      samples[i]=edge*(kind==='rain'?white*.73+brown*.5:brown*2);
    }
    const source=context.createBufferSource();
    source.buffer=buffer; source.loop=true;
    const filter=context.createBiquadFilter();
    filter.type=kind==='wind'?'lowpass':'bandpass';
    filter.frequency.value={rain:2100,water:640,wind:350}[kind];
    filter.Q.value=.55;
    const sway=context.createGain(), channel=context.createGain();
    sway.gain.value=.72; channel.gain.value=0;
    const lfo=context.createOscillator(), depth=context.createGain();
    lfo.frequency.value={rain:.21,water:.31,wind:.13}[kind];
    depth.gain.value=kind==='wind'?.27:.16;
    lfo.connect(depth).connect(sway.gain);
    source.connect(filter).connect(sway).connect(channel).connect(master);
    source.start();lfo.start();
    return channel;
  }

  function sync(next,musicPlaying){
    settings=next;
    blocked=settings.muted||settings.musicMode||musicPlaying;
    if (!context) return;
    const now=context.currentTime;
    master.gain.setTargetAtTime(blocked?0:1,now,.035);
    for (const key of Object.keys(levels)){
      if (settings[key]&&!tracks.has(key)) tracks.set(key,ambientTrack(key));
      tracks.get(key)?.gain.setTargetAtTime(settings[key]/100*levels[key],now,.14);
    }
  }

  function unlock(){
    if (!AudioEngine||!Object.keys(soundChannels).some(key=>settings[key])) return;
    try {
      if (!context){
        context=new AudioEngine();
        master=context.createGain();
        master.gain.value=0;
        master.connect(context.destination);
        sync(settings,blocked);
      }
      if (context.state==='suspended') context.resume().catch(()=>{});
    } catch { /* Text warnings remain available when audio is unavailable. */ }
  }

  function cue(mode,warning=false){
    if (blocked||context?.state!=='running'||!settings[mode]) return;
    const start=context.currentTime+.02;
    const notes=mode==='break'?[440,523.25]:warning?[659.25,523.25]:[523.25,659.25,783.99];
    notes.forEach((frequency,index)=>{
      const oscillator=context.createOscillator(), envelope=context.createGain();
      const at=start+index*.16;
      oscillator.type='sine'; oscillator.frequency.value=frequency;
      envelope.gain.setValueAtTime(.0001,at);
      envelope.gain.exponentialRampToValueAtTime(settings[mode]/100*.12,at+.045);
      envelope.gain.exponentialRampToValueAtTime(.0001,at+.58);
      oscillator.connect(envelope).connect(master);
      oscillator.start(at);oscillator.stop(at+.6);
      oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();};
    });
  }

  return {supported:Boolean(AudioEngine),sync,unlock,cue};
}
