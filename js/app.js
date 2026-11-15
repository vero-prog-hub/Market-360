(async function(){
  const $=selector=>document.querySelector(selector), scene=$('a-scene'), cam=$('#cam'), rig=$('#rig');
  let ready=false, index=-1, floorIndex=-1, sceneHandle;
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
    // Hawkers and indoor stalls tell their story without moving the street tour's position.
    if(!shop.hawker&&!shop.inside)index=MarketData.shops.indexOf(shop);
    $('#ct').textContent=shop.inside?`${shop.name} · ${shop.telugu}`:shop.name;$('#cd').textContent=shop.desc;$('#card').classList.add('show');
    const stops=sceneHandle?.floorStops?.[shop.storey]||[];
    $('#counter').textContent=shop.hawker?`Street hawker · ${shop.name}`:shop.inside?(shop.zone?`${floorIndex+1} / ${stops.length} · ${shop.floor}`:`${shop.floor} · Stall ${shop.stall}`):`${index+1} / ${MarketData.shops.length} · ${shop.name}`;
    $('#pt').setAttribute('value',shop.name);$('#pd').setAttribute('value',shop.desc);
    const panel=$('#panel');panel.setAttribute('visible',scene.is('vr-mode'));
    const py=shop.inside?shop.y+.6:2.8;
    if(shop.inside)panel.object3D.position.set(shop.x,py,shop.z);else panel.object3D.position.set(shop.side*3.9,2.8,shop.z);
    cam.object3D.getWorldPosition(position);panel.object3D.lookAt(position.x,py,position.z);
  }
  function glide(x,z){
    x=clamp(x,b.minX,b.maxX);z=clamp(z,b.minZ,b.maxZ);rig.removeAttribute('animation__mv');
    cam.object3D.getWorldPosition(position);
    const offsetX=position.x-rig.object3D.position.x,offsetZ=position.z-rig.object3D.position.z;
    const target=`${x-offsetX} 0 ${z-offsetZ}`;
    if(!MarketState.motion||scene.is('vr-mode')){rig.object3D.position.set(x-offsetX,0,z-offsetZ);return}
    rig.setAttribute('animation__mv',{property:'position',to:target,dur:1000,easing:'easeInOutCubic'});
  }
  // Turn to face a world point (desktop/mobile look-controls, or the rig in VR).
  function face(x,z){
    cam.object3D.getWorldPosition(position);const yaw=Math.atan2(-(x-position.x),-(z-position.z)),look=cam.components['look-controls'];
    if(scene.is('vr-mode')){const head=new T.Euler().setFromQuaternion(cam.object3D.quaternion,'YXZ');rig.object3D.rotation.y=yaw-head.y}
    else if(look){look.yawObject.rotation.y=yaw;look.pitchObject.rotation.x=-.08}
  }
  const walker=()=>cam.components.bounds;
  // Floor buttons jump straight to a floor of the market building; the ramps stay walkable on foot.
  function goFloor(storey){
    if(!ready||!MarketNav.current)return;if(!MarketState.entered)enter(false);
    const spawn=MarketNav.current.header.spawns[storey];if(!spawn)return;
    walker().teleport(spawn.x,spawn.z,spawn.y);floorIndex=-1;
    const tables=MarketNav.current.header.tables.filter(t=>t.floor===storey);
    if(tables.length)face(tables.reduce((s,t)=>s+t.x,0)/tables.length,tables.reduce((s,t)=>s+t.z,0)/tables.length);
    $('#card').classList.remove('show');$('#panel').setAttribute('visible',false);
  }
  for(const button of document.querySelectorAll('#floors button'))button.onclick=()=>goFloor(Number(button.dataset.floor));
  // Inside the building, ‹ › tours the trade zones of the current floor.
  function goStop(next){
    const stops=sceneHandle.floorStops[MarketState.storey]||[];if(!stops.length)return;
    floorIndex=(next+stops.length)%stops.length;const s=stops[floorIndex];
    walker().teleport(s.x,s.z,s.y);face(s.lookX,s.lookZ);story(s.item);
  }
  const floorNames=storey=>{const f=MarketData.floors[storey];return `${f.name} · ${f.cats.map(c=>MarketData.categories[c].name.replace(' Stalls','')).join(', ')}`};
  let minimapBase=null,minimapTimer=0;
  function drawMinimap(){
    const canvas=$('#minimap'),nav=MarketNav.current;if(!nav||!minimapBase||MarketState.storey===null)return;
    const ctx=canvas.getContext('2d'),h=nav.header;ctx.putImageData(minimapBase,0,0);
    cam.object3D.getWorldPosition(position);const px=(position.x-h.minX)/h.cell/2,pz=(position.z-h.minZ)/h.cell/2;
    const yaw=cam.components['look-controls']?.yawObject.rotation.y||0;
    ctx.save();ctx.translate(px,pz);ctx.rotate(-yaw);ctx.fillStyle='#e63979';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(5,5);ctx.lineTo(-5,5);ctx.closePath();ctx.fill();ctx.restore();
  }
  function buildMinimap(storey){
    const nav=MarketNav.current,h=nav.header,mask=nav.storeyMask(storey),canvas=$('#minimap'),ctx=canvas.getContext('2d');
    const img=ctx.createImageData(canvas.width,canvas.height);
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
      const c=(y*2)*h.nx+x*2,o=(y*canvas.width+x)*4,on=mask[c]||mask[c+1]||mask[c+h.nx];
      img.data[o]=on?232:42;img.data[o+1]=on?214:14;img.data[o+2]=on?178:28;img.data[o+3]=on?235:150;
    }
    for(const t of h.tables)if(t.floor===storey){const x=Math.round((t.x-h.minX)/h.cell/2),y=Math.round((t.z-h.minZ)/h.cell/2);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const o=((y+dy)*canvas.width+x+dx)*4;if(o>=0&&o<img.data.length){img.data[o]=169;img.data[o+1]=86;img.data[o+2]=54;img.data[o+3]=255}}}
    minimapBase=img;
  }
  scene.addEventListener('storeychange',event=>{
    const storey=event.detail.storey;floorIndex=-1;
    for(const button of document.querySelectorAll('#floors button'))button.setAttribute('aria-pressed',String(Number(button.dataset.floor)===storey));
    $('#floor-label').textContent=storey===null?'':floorNames(storey);
    $('#minimap').classList.toggle('off',storey===null);clearInterval(minimapTimer);
    if(storey!==null&&MarketNav.current){buildMinimap(storey);drawMinimap();minimapTimer=setInterval(drawMinimap,150)}
    $('#counter').textContent=storey===null?'Stroll freely or tour the shops':`${MarketData.floors[storey].name} · ‹ › to tour its stalls`;
  });
  function goTo(next){
    if(!ready||!MarketState.entered)return;
    if(MarketState.storey!==null&&sceneHandle?.floorStops)return goStop(next);
    const s=MarketData.shops[(next+MarketData.shops.length)%MarketData.shops.length];
    const look=cam.components['look-controls'];
    // Preserve tracked head orientation in VR; rotate the rig toward the shop instead.
    if(scene.is('vr-mode')){const head=new T.Euler().setFromQuaternion(cam.object3D.quaternion,'YXZ');rig.object3D.rotation.y=-s.side*Math.PI/2-head.y}
    else if(look){look.yawObject.rotation.y=-s.side*Math.PI/2;look.pitchObject.rotation.x=.06}
    glide(-s.side*1.4,s.z);
    story(s);
  }
  $('#next').onclick=()=>MarketState.storey!==null?goStop(floorIndex+1):goTo(index+1);
  $('#prev').onclick=()=>MarketState.storey!==null?goStop(floorIndex<0?-1:floorIndex-1):goTo(index<0?MarketData.shops.length-1:index-1);
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
    // Hovering a stall, shop or hawker shows a pointing-hand cursor (no box drawn in the scene).
    for(const el of document.querySelectorAll('.stall-hit,.shop-hit,.hawker-hit')){
      el.addEventListener('mouseenter',()=>{scene.canvas.style.cursor='pointer'});
      el.addEventListener('mouseleave',()=>{scene.canvas.style.cursor=''});
    }
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
