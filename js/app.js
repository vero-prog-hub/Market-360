(async function(){
  const $=selector=>document.querySelector(selector), scene=$('a-scene'), cam=$('#cam'), rig=$('#rig');
  let ready=false, index=-1, sceneHandle;
  let timeOfDay='day';try{if(localStorage.getItem('poorna-time-of-day')==='evening')timeOfDay='evening'}catch{}
  function applyTimeOfDay(){
    sceneHandle?.setTimeOfDay(timeOfDay);$('#lighting').setAttribute('aria-pressed',String(timeOfDay==='evening'));
    $('#lighting').title=timeOfDay==='evening'?'Return to daylight':'Switch to evening lighting';
    try{localStorage.setItem('poorna-time-of-day',timeOfDay)}catch{}
  }
  $('#lighting').onclick=()=>{timeOfDay=timeOfDay==='day'?'evening':'day';applyTimeOfDay()};
  const timers=new Set();
  const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);fn()},ms);timers.add(id);return id};
  function fail(message){
    document.body.classList.remove('market-entered');
    $('#status').textContent=message;$('#retry').hidden=false;$('#enter').disabled=$('#guided').disabled=true;
    $('#intro').classList.remove('off','fade');$('#intro').inert=false;$('#hud').classList.add('off');
    if(window.AFRAME){cam.setAttribute('wasd-controls','enabled',false);cam.setAttribute('look-controls','enabled',false)}
  }
  if(!window.AFRAME){fail('The 3D engine could not load. Reload the page to try again.');return}
  const T=AFRAME.THREE, position=new T.Vector3(), b=MarketData.bounds;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function controls(enabled){cam.setAttribute('wasd-controls','enabled',enabled);cam.setAttribute('look-controls','enabled',enabled)}
  function setMotion(enabled){
    MarketState.motion=enabled;$('#motion').checked=enabled;$('#petals').setAttribute('visible',enabled);
    if(!enabled){
      const animation=rig.components.animation__mv;
      if(animation?.data?.to){const target=animation.data.to;rig.object3D.position.copy(typeof target==='string'?AFRAME.utils.coordinates.parse(target):target)}
      rig.removeAttribute('animation__mv');
    }
  }
  const motion=matchMedia('(prefers-reduced-motion: reduce)');motion.addEventListener('change',event=>setMotion(!event.matches));
  $('#motion').onchange=event=>setMotion(event.target.checked);setMotion(MarketState.motion);
  function story(shop){
    if(!MarketState.entered||$('#help').open)return;
    index=MarketData.shops.indexOf(shop);$('#ct').textContent=shop.name;$('#cd').textContent=shop.desc;$('#card').classList.add('show');
    $('#counter').textContent=`${index+1} / ${MarketData.shops.length} · ${shop.name}`;
    $('#pt').setAttribute('value',shop.name);$('#pd').setAttribute('value',shop.desc);
    const panel=$('#panel');panel.setAttribute('visible',scene.is('vr-mode'));
    panel.object3D.position.set(shop.side*3.9,2.8,shop.z);cam.object3D.getWorldPosition(position);panel.object3D.lookAt(position.x,2.8,position.z);
  }
  function glide(x,z){
    x=clamp(x,b.minX,b.maxX);z=clamp(z,b.minZ,b.maxZ);rig.removeAttribute('animation__mv');
    cam.object3D.getWorldPosition(position);
    const offsetX=position.x-rig.object3D.position.x,offsetZ=position.z-rig.object3D.position.z;
    const target=`${x-offsetX} 0 ${z-offsetZ}`;
    if(!MarketState.motion||scene.is('vr-mode')){rig.object3D.position.set(x-offsetX,0,z-offsetZ);return}
    rig.setAttribute('animation__mv',{property:'position',to:target,dur:1000,easing:'easeInOutCubic'});
  }
  function goTo(next){
    if(!ready||!MarketState.entered)return;
    const s=MarketData.shops[(next+MarketData.shops.length)%MarketData.shops.length];
    const look=cam.components['look-controls'];
    // Preserve tracked head orientation in VR; rotate the rig toward the shop instead.
    if(scene.is('vr-mode')){const head=new T.Euler().setFromQuaternion(cam.object3D.quaternion,'YXZ');rig.object3D.rotation.y=-s.side*Math.PI/2-head.y}
    else if(look){look.yawObject.rotation.y=-s.side*Math.PI/2;look.pitchObject.rotation.x=.06}
    glide(-s.side*1.4,s.z);
    story(s);
  }
  $('#next').onclick=()=>goTo(index+1);$('#prev').onclick=()=>goTo(index<0?MarketData.shops.length-1:index-1);
  $('#hlp').onclick=()=>{rig.removeAttribute('animation__mv');controls(false);$('#help').showModal()};
  $('#hx').onclick=()=>$('#help').close();$('#help').addEventListener('close',()=>{controls(MarketState.entered);$('#hlp').focus()});
  const unsubscribe=MarketAudio.subscribe(state=>{
    $('#snd').textContent=state.on&&!state.unavailable?'🔊':'🔇';
    const label=state.unavailable?'Retry music':state.on?'Mute sound':'Unmute sound';
    $('#snd').setAttribute('aria-label',label);$('#snd').title=label;$('#snd').setAttribute('aria-pressed',String(!state.on));
    $('#volume').value=Math.round(state.volume*100);$('#volume-value').textContent=`${Math.round(state.volume*100)}%`;
    $('#audio-status').textContent=state.unavailable?'Music could not load. Use the sound button to retry.':'';
  });
  $('#snd').onclick=()=>{if(MarketAudio.state().unavailable)MarketAudio.start();else MarketAudio.toggle()};
  $('#volume').oninput=event=>MarketAudio.setVolume(Number(event.target.value)/100);
  window.addEventListener('keydown',event=>{
    if(MarketState.entered&&!$('#help').open&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)){
      if(document.activeElement===scene.canvas)scene.canvas.blur();if(document.activeElement===document.body)rig.removeAttribute('animation__mv');
    }
  },true);
  function enter(guided){
    if(!ready||MarketState.entered)return;MarketState.entered=true;document.body.classList.add('market-entered');controls(true);MarketAudio.start();
    $('#intro').classList.add('fade');$('#intro').inert=true;$('#hud').classList.remove('off');
    later(()=>$('#intro').classList.add('off'),MarketState.motion?900:0);scene.canvas.focus();
    later(()=>{$('#toast').style.opacity=0},8000);if(guided)goTo(0);
  }
  $('#enter').onclick=()=>enter(false);$('#guided').onclick=()=>enter(true);
  const timeout=later(()=>{if(!ready)fail('The market is taking too long to load. Reload to try again.')},25000);
  try{
    if(!scene.hasLoaded)await new Promise(resolve=>scene.addEventListener('loaded',resolve,{once:true}));
    sceneHandle=await MarketScene.build($('#world'),story);
    applyTimeOfDay();
    if(!scene.renderStarted)await new Promise(resolve=>scene.addEventListener('renderstart',resolve,{once:true}));
    sceneHandle.ground.addEventListener('click',event=>{
      if(!MarketState.entered||$('#help').open||!event.detail.intersection)return;
      const p=event.detail.intersection.point;glide(p.x,p.z);$('#card').classList.remove('show');$('#panel').setAttribute('visible',false);
    });
    const capResolution=()=>{if(scene.renderer){const compact=matchMedia('(max-width:600px)').matches;
      cam.setAttribute('camera','fov',compact?88:68);scene.renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(pointer:coarse)').matches?1.25:1.5))}};
    capResolution();window.addEventListener('resize',capResolution);
    scene.canvas.tabIndex=0;scene.canvas.setAttribute('aria-label','3D Poorna Market. Drag to look; WASD or arrow keys to walk. Use the shop tour buttons to read every shop story.');
    scene.canvas.addEventListener('webglcontextlost',()=>fail('The 3D view was interrupted. Reload the market to continue.'));
    scene.addEventListener('enter-vr',()=>{if(!MarketState.entered)enter(false);if(index>=0)story(MarketData.shops[index])});
    scene.addEventListener('exit-vr',()=>{$('#panel').setAttribute('visible',false);rig.object3D.rotation.y=0});
    ready=true;clearTimeout(timeout);timers.delete(timeout);$('#enter').disabled=$('#guided').disabled=false;$('#status').textContent='';
    window.addEventListener('pagehide',event=>{
      if(event.persisted)return;
      scene.pause();scene.renderer.setAnimationLoop(null);
      for(const timer of timers)clearTimeout(timer);unsubscribe();MarketAudio.dispose();sceneHandle?.dispose();
    },{once:true});
  }catch(error){console.error(error);fail('The market could not be prepared. Reload the page to try again.')}
})();
