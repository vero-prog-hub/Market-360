window.MarketAudio = (() => {
  let context, gain, source, buffer, loading, on=true, started=false, volume=.3, unavailable=false;
  const listeners=new Set();
  try { const saved=JSON.parse(localStorage.getItem('poorna-audio'));if(saved){volume=Math.max(0,Math.min(1,Number(saved.volume)||0));on=saved.on!==false} } catch {}
  function state(){return {on,volume,started,unavailable,playing:!!source&&context?.state==='running',contextState:context?.state||'uninitialized',duration:buffer?.duration||0}}
  function update(){for(const fn of listeners)fn(state());try{localStorage.setItem('poorna-audio',JSON.stringify({on,volume}))}catch{}}
  function level(fade=.4){if(gain&&context){gain.gain.cancelScheduledValues(context.currentTime);gain.gain.setTargetAtTime(on?volume:0,context.currentTime,fade)}}
  async function start(){
    started=true;
    try{
      if(!context){context=new (window.AudioContext||window.webkitAudioContext)();gain=context.createGain();gain.gain.value=0;gain.connect(context.destination)}
      if(context.state==='suspended'&&!document.hidden)await context.resume();
      if(!loading&&!buffer)loading=fetch('assets/audio/poorna-golden-hour.wav').then(r=>{if(!r.ok)throw new Error('Music unavailable');return r.arrayBuffer()}).then(b=>context.decodeAudioData(b));
      if(!buffer)buffer=await loading;
      if(!source){source=context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(gain);source.start()}
      unavailable=false;level(.65);update();
    }catch(error){unavailable=true;loading=null;update();console.warn('Music unavailable; exploration remains available.',error.message)}
  }
  function toggle(){on=!on;if(on&&(!source||unavailable))start();level(.12);update();return on}
  function setVolume(value){volume=Math.max(0,Math.min(1,Number(value)));level(.05);update()}
  async function visibility(){
    if(!context)return;
    try{if(document.hidden)await context.suspend();else if(started)await context.resume();update()}catch{unavailable=true;update()}
  }
  document.addEventListener('visibilitychange',visibility);
  async function dispose(){document.removeEventListener('visibilitychange',visibility);source?.stop();source=null;await context?.close();listeners.clear()}
  return {start,toggle,setVolume,state,dispose,subscribe(fn){listeners.add(fn);fn(state());return()=>listeners.delete(fn)}};
})();
