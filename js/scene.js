/* Shared, instanced geometry keeps the detailed streetscape inexpensive to draw. */
window.MarketScene = (() => {
  const T = window.AFRAME && AFRAME.THREE;
  const PI = Math.PI;
  let seed = 360;
  const rand = (a=0,b=1) => { seed = (seed * 1664525 + 1013904223) >>> 0; return a + seed/4294967296*(b-a); };

  async function build(world, onShop) {
    await document.fonts.load('24px "Market Telugu"');
    const root = new T.Group(), batches = new Map(), materials = new Map(), textures = [], signs = [];
    const geos = {
      box: new T.BoxGeometry(1,1,1), sphere: new T.SphereGeometry(1,12,8), bud: new T.SphereGeometry(1,6,4), petal: new T.CircleGeometry(1,7),
      cylinder: new T.CylinderGeometry(1,1,1,12), cone: new T.CylinderGeometry(.02,1,1,12),
      bowl: new T.LatheGeometry([new T.Vector2(.08,0),new T.Vector2(.55,.08),new T.Vector2(.94,.55),new T.Vector2(1,1)],16),
      pot: new T.LatheGeometry([new T.Vector2(.35,0),new T.Vector2(.7,.12),new T.Vector2(1,.52),new T.Vector2(.82,.84),new T.Vector2(.48,1),new T.Vector2(.5,1.12)],18),
      ring: new T.TorusGeometry(1,.08,6,28), plane: new T.PlaneGeometry(1,1)
    };
    function texture(draw, size=512) {
      const c=document.createElement('canvas'); c.width=c.height=size;
      draw(c.getContext('2d'),size);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
      tex.anisotropy=4;textures.push(tex);return tex;
    }
    const plaster = texture((c,n)=>{
      c.fillStyle='#e8dfcb';c.fillRect(0,0,n,n);
      for(let i=0;i<15000;i++){c.fillStyle=`rgba(73,58,39,${rand(.015,.065)})`;c.fillRect(rand(0,n),rand(0,n),rand(1,3),1)}
    });
    const wood = texture((c,n)=>{
      c.fillStyle='#795238';c.fillRect(0,0,n,n);
      for(let x=0;x<n;x+=3){c.strokeStyle=`rgba(35,17,7,${rand(.08,.28)})`;c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x+rand(-8,8),n*.3,x+rand(-8,8),n*.7,x,n);c.stroke()}
      for(let y=0;y<n;y+=128){c.fillStyle='#49321f';c.fillRect(0,y,n,2)}
    });
    const paving = texture((c,n)=>{
      c.fillStyle='#857e6d';c.fillRect(0,0,n,n);
      for(let row=0;row<8;row++)for(let col=-1;col<5;col++){
        const x=col*128+(row%2)*64,y=row*64;
        const v=Math.floor(rand(164,193));c.fillStyle=`rgb(${v+13},${v+7},${v-6})`;c.fillRect(x+2,y+2,124,60);
        c.fillStyle='#ffffff24';c.fillRect(x+3,y+3,122,1);
      }
      for(let i=0;i<18000;i++){c.fillStyle=rand()>.5?'#fff1':'#44332213';c.fillRect(rand(0,n),rand(0,n),1,1)}
    });
    paving.wrapS=paving.wrapT=T.RepeatWrapping;paving.repeat.set(3,28);
    const apron=paving.clone();apron.repeat.set(8,4);textures.push(apron);
    const bamboo = texture((c,n)=>{
      c.fillStyle='#bea16c';c.fillRect(0,0,n,n);
      for(let i=0;i<n;i+=12){c.fillStyle=i%24?'#8d713f':'#d4b984';c.fillRect(i,0,4,n);c.fillStyle='#5b482445';c.fillRect(0,i,n,3)}
    });
    const shadow = texture((c,n)=>{
      const g=c.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);g.addColorStop(0,'#30291c55');g.addColorStop(.6,'#30291c22');g.addColorStop(1,'#30291c00');c.fillStyle=g;c.fillRect(0,0,n,n)
    },128);
    function mat(color, kind='plain') {
      const key=color+kind;if(materials.has(key))return materials.get(key);
      const m=new T.MeshStandardMaterial({color,roughness:.87,metalness:0});
      if(kind==='plaster')m.map=plaster;
      if(kind==='wood'){m.map=wood;m.roughness=.8}
      if(kind==='woven'){m.map=bamboo;m.side=T.DoubleSide}
      if(kind==='metal'){m.roughness=.3;m.metalness=.75}
      if(kind==='glass'){m.color.set('#567573');m.roughness=.23;m.metalness=.35}
      if(kind==='window'){m.color.set('#567373');m.roughness=.28;m.metalness=.2;m.emissive.set('#ffd39a');m.emissiveIntensity=0}
      if(kind==='lamp'){m.emissive.set('#ffd39a');m.emissiveIntensity=0;m.roughness=.45}
      m.userData.selfLitSurface=kind==='window'||kind==='lamp';
      if(kind==='paving')m.map=paving;
      if(kind==='apron')m.map=apron;
      if(kind==='shadow'){m.map=shadow;m.transparent=true;m.depthWrite=false;m.side=T.DoubleSide}
      materials.set(key,m);return m;
    }
    function frame(x=0,y=0,z=0,yaw=0){return new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(0,yaw,0)),new T.Vector3(1,1,1))}
    const identity=frame();
    const skin=['#8a5a3c','#9b6a48','#7a4e34'],cloth=['#a94f62','#d8993d','#477663','#626b89','#c68c32'];
    function put(type,f,x,y,z,sx,sy,sz,color,kind='plain',rx=0,ry=0,rz=0){
      // Ordinary surfaces batch by shape and material type with per-instance colour (far fewer draw calls);
      // lit, glazed and shadow surfaces keep one material per colour.
      const tinted=['plain','plaster','wood','woven','metal'].includes(kind);
      const m=tinted?mat('#ffffff',kind):mat(color,kind),key=type+':'+m.uuid;
      if(!batches.has(key))batches.set(key,{geometry:geos[type],material:m,items:[],colors:tinted?[]:null});
      const local=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz));
      const batch=batches.get(key);batch.items.push(local.premultiply(f));if(tinted)batch.colors.push(color);
    }
    const box=(f,x,y,z,w,h,d,c,k='plain',rx=0,ry=0,rz=0)=>put('box',f,x,y,z,w,h,d,c,k,rx,ry,rz);
    const ball=(f,x,y,z,r,c,sx=1,sy=1,sz=1)=>put('sphere',f,x,y,z,r*sx,r*sy,r*sz,c);
    const cyl=(f,x,y,z,r,h,c,k='plain',rx=0,rz=0)=>put('cylinder',f,x,y,z,r,h,r,c,k,rx,0,rz);
    const pot=(f,x,y,z,r,h,c='#ad6749',kind='plain')=>{put('pot',f,x,y,z,r,h,r,c,kind);cyl(f,x,y+h*1.1,z,r*.4,.014,'#402c20')};
    const ring=(f,x,y,z,r,c,rx=PI/2)=>put('ring',f,x,y,z,r,r,r,c,'plain',rx);
    const contact=(f,x,z,w,d)=>put('plane',f,x,.035,z,w,d,1,'#ffffff','shadow',-PI/2);
    function flower(f,x,y,z,r,color){
      cyl(f,x,y-.1,z,.012,.22,'#496a35');
      for(let k=0;k<5;k++){const a=k*PI*2/5;put('bud',f,x+Math.cos(a)*r*.52,y,z+Math.sin(a)*r*.52,r*.62,r*.24,r*.62,color)}
      ball(f,x,y+.015,z,r*.32,'#c5a04b',1,.5,1);
    }
    function bloomTray(f,x,y,z,color,count=28,w=.8,d=.7){
      box(f,x,y-.1,z,w+.08,.16,d+.08,'#704b30','wood');
      for(let n=0;n<count;n++)flower(f,x+rand(-w*.43,w*.43),y+rand(0,.04),z+rand(-d*.4,d*.4),rand(.065,.1),color);
    }
    function sign(f,english,telugu,w=5.8,y=3.15,z=1.88){
      const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');
      ctx.fillStyle='#2a0e1c';ctx.fillRect(0,0,1024,256);ctx.strokeStyle='#b99458';ctx.lineWidth=4;ctx.strokeRect(12,12,1000,232);
      ctx.textAlign='center';ctx.fillStyle='#fff4d6';ctx.font='54px "Market Telugu"';ctx.fillText(telugu,512,105,960);
      ctx.fillStyle='#f3cd85';ctx.font='500 45px Georgia';ctx.fillText(english,512,192,960);
      const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;textures.push(tex);
      const m=new T.MeshBasicMaterial({map:tex});const p=new T.Mesh(geos.plane,m);p.matrixAutoUpdate=false;
      p.matrix.copy(frame(0,y,z)).premultiply(f);p.scale.set(1,1,1);
      p.matrix.multiply(new T.Matrix4().makeScale(w,w/4,1));root.add(p);signs.push(p);
    }

    // Warm daylight, a clear skyline and stone underfoot.
    const skyTex=texture((c,n)=>{const g=c.createLinearGradient(0,0,0,n);g.addColorStop(0,'#76a7c0');g.addColorStop(.5,'#c8d6cc');g.addColorStop(.75,'#f6d6aa');g.addColorStop(1,'#e8c58f');c.fillStyle=g;c.fillRect(0,0,n,n)},256);
    const eveningTex=texture((c,n)=>{const g=c.createLinearGradient(0,0,0,n);g.addColorStop(0,'#202b50');g.addColorStop(.4,'#4e5479');g.addColorStop(.54,'#ae7f89');g.addColorStop(.66,'#e8b18a');g.addColorStop(1,'#6e697f');c.fillStyle=g;c.fillRect(0,0,n,n)},256);
    const sky=new T.Mesh(new T.SphereGeometry(180,24,16),new T.MeshBasicMaterial({map:skyTex,side:T.BackSide,fog:false}));root.add(sky);
    const sun=new T.Mesh(geos.sphere,new T.MeshBasicMaterial({color:'#fff0cc',fog:false}));sun.position.set(-65,42,-110);sun.scale.setScalar(5);root.add(sun);
    const hemisphere=new T.HemisphereLight('#e7eff3','#8b7050',1.65);root.add(hemisphere);
    const moon=new T.Mesh(geos.sphere,new T.MeshBasicMaterial({color:'#f5ecd9',fog:false}));moon.position.set(65,68,-105);moon.scale.setScalar(2.3);moon.visible=false;root.add(moon);
    const sunlight=new T.DirectionalLight('#ffdfb2',2.1);sunlight.position.set(-12,22,9);root.add(sunlight);
    sunlight.target.position.set(0,0,-24);root.add(sunlight.target);sunlight.castShadow=true;
    sunlight.shadow.mapSize.set(2048,2048);sunlight.shadow.camera.left=-24;sunlight.shadow.camera.right=24;
    sunlight.shadow.camera.top=30;sunlight.shadow.camera.bottom=-30;sunlight.shadow.camera.near=.5;sunlight.shadow.camera.far=95;
    sunlight.shadow.bias=-.0004;sunlight.shadow.normalBias=.025;sunlight.shadow.radius=3;
    box(identity,0,-.12,-35,320,.2,320,'#9c9982');
    put('plane',identity,0,.012,-35,10.4,112,1,'#ffffff','paving',-PI/2);
    for(const side of [-1,1]){
      box(identity,side*5.4,.01,-35,.9,.14,112,'#a29379');
      box(identity,side*3.55,.03,-35,.12,.025,112,'#806f56');
      box(identity,side*4.5,.022,-35,.12,.02,112,'#5c625c','metal');
      for(let z=16;z>-89;z-=.45)box(identity,side*4.5,.04,z,.18,.016,.035,'#adb0a5','metal');
    }
    // Hawker verge: paving from the left kerb to the supplied market's street wall.
    const M=MarketData.model,vergeW=-5.85-M.wallX,vergeL=M.zStart-M.zEnd+1;
    const verge=paving.clone();verge.repeat.set(2,vergeL/4);textures.push(verge);
    const vergeMat=new T.MeshStandardMaterial({map:verge,color:'#efe3cc',roughness:.9});materials.set('verge',vergeMat);
    const vergeMesh=new T.Mesh(geos.plane,vergeMat);vergeMesh.rotation.x=-PI/2;vergeMesh.position.set(-5.85-vergeW/2,.014,(M.zStart+M.zEnd)/2);
    vergeMesh.scale.set(vergeW,vergeL,1);vergeMesh.receiveShadow=true;root.add(vergeMesh);
    const ground=document.createElement('a-plane');ground.id='street-ground';ground.classList.add('clickable');
    ground.setAttribute('rotation','-90 0 0');ground.setAttribute('position','-3.33 .025 -35');ground.setAttribute('width','17');ground.setAttribute('height','112');ground.setAttribute('material','opacity:0;transparent:true;depthWrite:false');world.appendChild(ground);

    function upperBuilding(f,s){
      const facade=['#d8cfb9','#c7d0c8','#e0c7af','#c6c4b8'][Math.floor(-s.z/9)%4];
      const h=s.tall?10.15:4.15;
      box(f,0,h/2,-1.8,6.8,h,5.8,facade,'plaster');
      // A recessed open shop with slender columns and stone thresholds.
      box(f,0,1.55,1.15,5.8,2.95,.12,'#51493b');
      box(f,0,.08,1.8,6.8,.16,1.3,'#9b8d76');
      for(const x of [-3.18,3.18]){box(f,x,1.8,1.4,.38,3.6,.6,'#d9d1be','plaster');box(f,x,.28,1.46,.5,.55,.68,'#938773')}
      box(f,0,3.72,1.55,7,.23,.8,'#a59d8b');
      if(s.tall){
        for(const floor of [1,2]){
          const y=3.8+(floor-1)*3;
          box(f,0,y+.04,1.75,7,.18,1.3,'#c9c2b1');
          for(const x of [-1.95,0,1.95]){
            box(f,x,y+1.45,1.14,1.38,1.95,.12,'#4a544d');
            box(f,x,y+1.45,1.23,1.16,1.75,.08,'#567373','window');
            box(f,x,y+1.45,1.3,.055,1.78,.05,'#c6bda8');
            box(f,x,y+2.56,1.58,1.65,.12,.8,'#d9d1be');
            box(f,x,y+.5,2.24,1.65,.07,.08,'#4f5a52','metal');
            box(f,x,y+1.02,2.24,1.65,.06,.08,'#4f5a52','metal');
            for(let k=0;k<6;k++)box(f,x-.76+k*.3,y+.76,2.24,.035,.52,.04,'#4f5a52','metal');
          }
          for(const x of [-3.15,3.15])box(f,x,y+.55,1.78,.07,1.1,1,'#4f5a52','metal');
          for(const x of [-2.2,1.9]){box(f,x,y+.24,2,.6,.25,.35,'#9a573c');for(let n=0;n<9;n++)ball(f,x+rand(-.25,.25),y+.5+rand(0,.1),2,.13,'#4e7048',1,.6,1)}
        }
        box(f,0,10.32,-1.6,7,.38,6.1,'#b9b09a');
        box(f,0,10.7,1.36,6.8,.55,.2,facade,'plaster');
        cyl(f,-1.8,10.9,-2.5,.6,1.05,'#5a6059');box(f,1.5,10.58,-1.7,1.8,.06,1.1,'#35556a','metal',-.15);
        // One modest AC condenser per building, not a blank tower facade.
        box(f,2.6,5.7,1.45,.65,.45,.35,'#b8b9aa');
      }else{box(f,0,4.32,1.2,6.8,.35,.22,facade,'plaster');for(const x of [-2,2])pot(f,x,4.38,-.5,.23,.4)}
      for(const x of [-2.8,2.8])for(let y=.4;y<2.8;y+=.12)box(f,x,y,1.25,.45,.035,.08,'#777d73','metal');
      // Canvas awning with a real frame, valance and muted alternating panels.
      for(let k=0;k<8;k++)box(f,-2.98+k*.85,3.68,2.15,.85,.07,1.85,k%2?'#e6ddc5':s.accent,'plain',.15);
      box(f,0,3.48,3.04,6.8,.28,.07,s.accent);
      for(const x of [-3.2,3.2])cyl(f,x,3,2.9,.027,1,'#4a4e42','metal',0,.25*x/3.2);
      sign(f,s.name,s.telugu,5.8,3.03,1.4);
    }
    function counter(f,wooden=true){box(f,0,.52,2.05,4.8,1,1.1,wooden?'#b39266':'#abada3',wooden?'wood':'metal');box(f,0,1.04,2.05,5,.09,1.25,'#c2ad8b')}
    function shelf(f){for(const y of [.5,1.3,2.1])box(f,0,y,1.4,4.9,.08,.8,'#b39266','wood');for(const x of [-2.4,2.4])box(f,x,1.2,1.2,.08,2.4,.12,'#796447')}
    function goods(f,s){
      const c=s.accent;
      if(s.type==='flowers'){
        counter(f);
        const tones={marigold:['#ebaa2b','#dd7d23'],jasmine:['#f2eedc','#f7f5e8'],roses:['#b63e58','#d98592'],seasonal:['#d7bfe0','#e0ce64']}[s.id];
        for(let k=0;k<4;k++)bloomTray(f,-1.8+k*1.2,1.2,2.08,tones[k%2],34,1,.9);
        for(const x of [-2.4,2.4]){pot(f,x,.15,2.8,.4,.5);for(let n=0;n<25;n++)flower(f,x+rand(-.32,.32),.85+rand(-.1,.15),2.8+rand(-.25,.25),.1,tones[n%2])}
        for(let k=0;k<6;k++)for(let j=0;j<14;j++)ball(f,-2.25+k*.9,2.22-j*.075,1.68,.067,tones[(k+j)%2],1,1.3,1);
      }else if(s.type==='vegetables'||s.type==='fruit'){
        counter(f);const colors=s.type==='vegetables'?['#b64c38','#61516f','#7b994e','#c68c36']:['#cead3d','#c1a769','#7b944a','#da8d3c'];
        for(let k=0;k<4;k++){
          const x=-1.8+k*1.2;box(f,x,1.2,2.1,1.05,.25,1, '#74744b','wood');
          for(let n=0;n<30;n++)ball(f,x+rand(-.43,.43),1.4+rand(0,.18),2.1+rand(-.36,.36),rand(.095,.14),colors[k],1,s.type==='vegetables'&&k===1?1.6:1,1);
        }
        if(s.type==='vegetables')for(let n=0;n<50;n++)ball(f,-2+rand(-.35,.35),.4+rand(0,.2),3.1+rand(-.2,.2),.17,'#4e7649',1,.3,1);
        else for(let k=0;k<3;k++)for(let j=0;j<6;j++)put('sphere',f,-2.3+k*.22,.5+j*.07,3,.1,.09,.4,'#c6ac43','plain',0,0,.25);
        for(const x of [-1.6,0,1.6]){box(f,x,.2,3.2,1,.35,.7,'#82754e','wood');for(let n=0;n<12;n++)ball(f,x+rand(-.35,.35),.45+rand(0,.2),3.2+rand(-.25,.25),.16,s.type==='fruit'?'#958462':'#7d9958')}
      }else if(s.type==='bamboo'){
        for(let k=0;k<18;k++)cyl(f,-2.5+(k%5)*.17,1.4,1.7+Math.floor(k/5)*.12,.055,2.7,'#c0ad70');
        for(let k=0;k<4;k++)box(f,.1+k*.55,1.45,1.55,.43,2.4,.065,'#dbc18a','woven',0,k*.1);
        for(const x of [-.8,1,2.4]){cyl(f,x,.58,2.8,.43,.12,'#c3a570','woven');for(const a of [0,PI/2,PI,PI*1.5])cyl(f,x+Math.cos(a)*.32,.3,2.8+Math.sin(a)*.32,.045,.6,'#b99c65')}
      }else if(s.type==='pottery'){
        shelf(f);for(let row=0;row<3;row++)for(let k=0;k<8;k++)pot(f,-2.1+k*.6,.55+row*.8,1.5,.17,.35,['#ac6547','#b97b56','#925139'][k%3]);
        for(const x of [-2,-.85,.4,1.7])pot(f,x,.13,3,rand(.32,.45),rand(.7,.9));
        for(let n=0;n<18;n++)put('bowl',f,rand(-2,2),.12,rand(2.2,3.5),.16,.08,.16,'#c07a50');
      }else if(s.type==='spices'||s.type==='groceries'){
        shelf(f);for(let row=0;row<3;row++)for(let k=0;k<10;k++){cyl(f,-2.2+k*.49,.8+row*.8,1.5,.16,.45,['#d1b780','#a45c39','#8b923f'][k%3]);cyl(f,-2.2+k*.49,1.04+row*.8,1.5,.17,.05,'#716b54','metal')}
        for(let k=0;k<5;k++){put('bowl',f,-2+k,0,2.9,.44,.65,.44,'#b7a282','woven');ball(f,-2+k,.6,2.9,.37,(s.type==='spices'?['#b2492f','#cc9b31','#927844','#858a43','#d3bd7f']:['#dfcd9d','#c7b57c','#c38e58','#bd986a','#dbca9e'])[k],1,.35,1)}
      }else if(s.type==='textiles'){
        shelf(f);const colors=['#a45868','#d0ad6d','#687f8d','#708764','#c38b77'];
        for(let k=0;k<5;k++){box(f,-2+k,1.32,1.95,.78,1.8,.025,colors[k]);box(f,-2+k,.62,1.97,.78,.2,.03,'#c8ad72');for(let n=0;n<5;n++)box(f,-2+k-.3+n*.15,1.32,1.974,.013,1.75,.008,'#b5a680')}
        for(let k=0;k<4;k++)for(let j=0;j<5;j++)box(f,-1.7+k*1.1,.25+j*.12,3,.88,.1,.65,colors[(k+j)%5]);
      }else if(s.type==='puja'||s.type==='utensils'){
        shelf(f);const metal=s.type==='puja'?'#bd9b56':'#b9c1bc';
        for(let row=0;row<3;row++)for(let k=0;k<7;k++){
          const x=-2.1+k*.7,y=.56+row*.8;
          if(s.type==='puja'){cyl(f,x,y+.2,1.5,.055,.38,metal,'metal');put('bowl',f,x,y+.38,1.5,.18,.08,.18,metal,'metal');cyl(f,x,y+.03,1.5,.17,.05,metal,'metal')}
          else {put('bowl',f,x,y,1.5,.26,.32,.26,metal,'metal');ring(f,x,y+.32,1.5,.26,metal)}
        }
        for(let k=0;k<4;k++){pot(f,-1.7+k*1.1,0,3,.4,.65,metal,'metal');cyl(f,-1.7+k*1.1,.73,3,.21,.04,metal,'metal')}
      }else if(s.type==='tea'){
        counter(f,false);cyl(f,-1,1.45,2.1,.32,.65,'#b5bcb5','metal');put('cone',f,-1,1.86,2.1,.37,.17,.37,'#b5bcb5','metal');ring(f,-1,1.9,2.1,.22,'#555a53',0);
        cyl(f,-.55,1.5,2.1,.08,.5,'#c5cac2','metal',0,-.65);
        for(let k=0;k<7;k++){cyl(f,.1+k*.3,1.21,2.1,.095,.3,'#c2b69d');cyl(f,.1+k*.3,1.365,2.1,.08,.01,'#825638')}
        for(const x of [-2,2]){box(f,x,.55,3.3,.65,.12,1.6,'#8d6c43','wood');for(const z of [2.7,3.9])box(f,x,.28,z,.4,.55,.14,'#606153','metal')}
      }else if(s.type==='sweets'){
        counter(f,false);box(f,0,1.4,2.05,4.8,.7,1.1,'#73827a','glass');
        // Open-front display: trays sit ahead of the glass backing.
        for(let k=0;k<4;k++){box(f,-1.8+k*1.2,1.13,2.75,1,.04,.6,'#aeb5aa','metal');for(let j=0;j<12;j++){const x=-2.17+k*1.2+(j%4)*.23,z=2.55+Math.floor(j/4)*.2;if(k%2)box(f,x,1.23,z,.18,.14,.15,'#ddd0a7');else ball(f,x,1.25,z,.11,'#d3a148')}}
      }else if(s.type==='baskets'){
        for(let row=0;row<2;row++)for(let k=0;k<5;k++){put('bowl',f,-2+k,.05+row*.6,2.6,.43,.65,.43,'#c9ae78','woven');ring(f,-2+k,.7+row*.6,2.6,.43,'#a18453')}
        for(let k=0;k<4;k++)box(f,-1.8+k*1.2,1.5,1.6,.85,2.3,.06,'#d2bd8d','woven');
      }
    }

    for(const s of MarketData.shops){
      const f=frame(s.x,0,s.z,-s.side*PI/2);upperBuilding(f,s);goods(f,s);contact(f,0,2.1,8,5);
      vendor(f,1.2,1.35,MarketData.shops.indexOf(s),false); // shopkeeper behind the counter
      box(f,0,2.24,1.7,3.8,.055,.12,'#e3c98a','lamp');
      const el=document.createElement('a-box');el.id=`shop-${s.id}`;el.classList.add('clickable','shop-hit');el.dataset.type=s.type;el.dataset.storeys=s.tall?'3':'1';
      el.setAttribute('position',`${s.x-s.side*2} 1.5 ${s.z}`);el.setAttribute('width','1.7');el.setAttribute('height','2.8');el.setAttribute('depth','6.3');el.setAttribute('material','opacity:0;transparent:true;depthWrite:false');
      el.addEventListener('click',()=>onShop(s));world.appendChild(el);
    }

    // Sakura trees stand in the gaps between the right-hand shops (and at both ends of the row).
    const blossom=['#f7c6d5','#f2a9c0','#fbd9e3','#ea93b2','#f5b8cb'];
    function sakura(x,z,scale=1){
      const f=frame(x,0,z,rand(0,PI*2));
      box(f,0,.18,0,1.3,.36,1.3,'#a99b80');box(f,0,.37,0,1.1,.04,1.1,'#4f3b2c');
      cyl(f,0,1.35*scale,0,.13*scale,2.7*scale,'#5b3a2e','wood');
      const crown=[];
      for(let k=0;k<4;k++){
        const a=k*PI/2+rand(-.3,.3),tilt=rand(.55,.8),len=rand(1.5,2)*scale,bx=Math.sin(tilt)*len/2,by=Math.cos(tilt)*len/2;
        const cx=Math.cos(a)*bx,cz=Math.sin(a)*bx,y0=2.55*scale;
        put('cylinder',f,cx,y0+by,cz,.075*scale,len,.075*scale,'#5b3a2e','plain',Math.sin(a)*tilt,0,-Math.cos(a)*tilt);
        crown.push([cx*2,y0+by*2,cz*2]);
      }
      crown.push([0,3.4*scale,0]);
      for(const [cx,cy,cz] of crown)for(let n=0;n<11;n++)
        ball(f,cx+rand(-.75,.75)*scale,cy+rand(-.2,.55)*scale,cz+rand(-.75,.75)*scale,rand(.38,.62)*scale,blossom[n%5],1,.78,1);
      // Fallen petals ring each planter.
      for(let n=0;n<60;n++){const a=rand(0,PI*2),r=rand(.8,2.1);put('petal',f,Math.cos(a)*r,.045,Math.sin(a)*r,.03,.045,1,blossom[n%5],'plain',-PI/2,0,rand(0,PI))}
      contact(f,0,0,4.2,4.2);
    }
    const shopZ=MarketData.shops.map(s=>s.z);
    const sakuraZ=[shopZ[0]+5,...shopZ.slice(1).map((z,i)=>(z+shopZ[i])/2),shopZ[shopZ.length-1]-5];
    for(const z of sakuraZ)sakura(6.3,z,rand(.92,1.08));

    // Street hawkers: carts and mats on the verge, set back from the kerb and the wall, gates left clear.
    function vendor(f,x,z,i,seated=true){
      const y=seated?.25:0;
      cyl(f,x,y+.45,z,.2,.7,cloth[i%5]);ball(f,x,y+.95,z,.13,skin[i%3]);ball(f,x,y+1.02,z-.03,.135,'#1f1611',1,.8,1);
      for(const s of [-1,1])put('cylinder',f,x+s*.2,y+.55,z+.12,.05,.45,.05,skin[i%3],'plain',.9,0,0);
      if(seated){box(f,x,.12,z,.55,.24,.55,'#7a5a3a','wood');for(const s of [-1,1])put('cylinder',f,x+s*.09,.3,z+.25,.06,.42,.06,cloth[(i+2)%5],'plain',PI/2,0,0)}
    }
    function umbrella(f,x,z,c){
      cyl(f,x,1.25,z,.025,2.5,'#4a4e42','metal');
      for(let k=0;k<8;k++)put('cone',f,x,2.55,z,1.25,.42,1.25,k%2?'#eee3ca':c,'plain',0,k*PI/4,0);
      put('cone',f,x,2.55,z,1.27,.42,1.27,c);
    }
    function cart(f,w=1.7,d=.95,h=.85){
      box(f,0,h,0,w,.08,d,'#8d6c43','wood');box(f,0,h-.14,0,w-.1,.2,d-.1,'#6f5233','wood');
      for(const s of [-1,1]){ring(f,0,.32,s*(d/2+.05),.32,'#3f342b',0);cyl(f,0,.32,s*(d/2+.05),.04,.06,'#3f342b','plain',PI/2)}
      cyl(f,0,.32,0,.025,d+.1,'#3f342b','metal',PI/2);
      cyl(f,-w/2-.25,h-.15,0,.03,.6,'#6f5233','wood',0,PI/2);put('box',f,0,h/2-.1,-d/2+.05,.06,h-.2,.06,'#6f5233');
    }
    function hawkerGoods(f,h,i){
      const t=h.type;
      if(t==='flowers'||t==='jasmine'){
        cart(f);const tones=t==='flowers'?['#ebaa2b','#dd7d23','#f0c040']:['#f6f2e3','#ece6cf','#fffaf0'];
        for(let n=0;n<70;n++)flower(f,rand(-.72,.72),.98+rand(0,.12),rand(-.36,.36),rand(.06,.09),tones[n%3]);
        for(let k=0;k<5;k++)for(let j=0;j<12;j++)ball(f,-.7+k*.35,2.05-j*.08,-.42,.05,tones[(k+j)%3],1,1.3,1);
        box(f,0,2.12,-.42,1.8,.04,.04,'#6f5233','wood');umbrella(f,.95,-.1,t==='flowers'?'#d8993d':'#477663');
      }else if(t==='bangles'){
        box(f,0,.55,0,1.4,.08,.7,'#8d6c43','wood');for(const s of [-1,1])box(f,s*.62,.27,0,.08,.55,.6,'#6f5233');
        const c=['#c0392b','#2e86c1','#d4ac0d','#8e44ad','#16a085','#e67e22','#c2185b'];
        for(let k=0;k<7;k++){cyl(f,-.6+k*.2,1.05,0,.012,1,'#6f5233','wood');for(let j=0;j<10;j++)ring(f,-.6+k*.2,.68+j*.07,0,.08,c[(k+j)%7],PI/2)}
        umbrella(f,.95,.05,'#a94f62');
      }else if(t==='tea'){
        cart(f,1.5,.85,.9);cyl(f,-.35,1.05,0,.22,.22,'#2b2622');cyl(f,-.35,1.18,0,.25,.05,'#e07a2e','lamp');
        put('pot',f,-.35,1.2,0,.2,.32,.2,'#bd9b56','metal');cyl(f,-.15,1.42,0,.025,.25,'#bd9b56','metal',0,-.8);
        for(let k=0;k<6;k++)cyl(f,.15+k*.1,1.02,.15,.035,.1,'#d9cfb5');for(let k=0;k<4;k++)cyl(f,.2+k*.13,1.0,-.2,.05,.06,'#c4b8a0');
        for(const s of [-1,1])box(f,s*.4,.22,1.05,.9,.08,.32,'#8d6c43','wood');umbrella(f,.9,-.15,'#477663');
      }else if(t==='bananas'){
        cart(f);for(let k=0;k<4;k++){cyl(f,-.6+k*.4,1.65,-.2,.02,1.3,'#6f5233','wood');for(let j=0;j<14;j++)put('sphere',f,-.6+k*.4+Math.cos(j)*.09,1.95-j*.06,-.2+Math.sin(j)*.09,.04,.15,.04,k%2?'#d9c13c':'#8aa040','plain',.3,0,0)}
        for(let n=0;n<18;n++)put('sphere',f,rand(-.7,.7),.98,rand(-.3,.3),.04,.04,.16,n%3?'#e1c53e':'#9aab48','plain',0,rand(0,PI),PI/2);
        umbrella(f,.95,.1,'#c68c32');
      }else if(t==='coconut'){
        for(let n=0;n<26;n++){const lay=Math.floor(n/10);ball(f,rand(-.55,.55)*(1-lay*.3),.2+lay*.28,rand(-.4,.4)*(1-lay*.3),.17,n%4?'#6d8f3c':'#87a14a',1,1.15,1)}
        box(f,-.85,.2,0,.5,.4,.5,'#7a5a3a','wood');box(f,-.85,.43,.05,.35,.03,.08,'#b5bcb5','metal');umbrella(f,.95,-.2,'#626b89');
      }else if(t==='corn'){
        cart(f,1.4,.8,.85);box(f,0,.98,0,1,.15,.55,'#2b2622');for(let n=0;n<40;n++)put('sphere',f,rand(-.45,.45),1.07,rand(-.22,.22),.035,.035,.035,n%2?'#ff7a2e':'#c23b1b','lamp');
        for(let k=0;k<7;k++)put('sphere',f,-.4+k*.13,1.13,0,.035,.035,.15,'#e7c24a','plain',PI/2,0,0);
        for(let k=0;k<10;k++)put('sphere',f,.85+rand(-.12,.12),1.05+k*.02,rand(-.25,.25),.035,.035,.15,'#d6b84a','plain',PI/2,rand(0,PI),0);umbrella(f,.9,-.1,'#a95636');
      }else if(t==='vegetables'){
        put('plane',f,0,.02,0,1.8,1.2,1,'#c9ae78','woven',-PI/2);
        const c=['#4e7649','#61516f','#7b994e','#b64c38'];for(let k=0;k<4;k++){put('bowl',f,-.6+k*.4,.02,-.15+(k%2)*.3,.2,.16,.2,'#b7a282','woven');for(let n=0;n<8;n++)ball(f,-.6+k*.4+rand(-.1,.1),.15,-.15+(k%2)*.3+rand(-.1,.1),.06,c[k],1,k===0?.4:1,1)}
        for(let n=0;n<12;n++)put('cylinder',f,rand(-.7,.7),.04,.45,.015,.6,.015,'#6b8f3e','plain',0,0,PI/2);umbrella(f,.95,-.35,'#477663');
      }else if(t==='peanuts'){
        cart(f,1.3,.8,.85);put('bowl',f,-.2,.89,0,.4,.25,.4,'#3c3530','metal');for(let n=0;n<40;n++)ball(f,-.2+rand(-.28,.28),1.08,rand(-.28,.28),.03,'#c69a63',1,.7,1);
        for(let k=0;k<5;k++)put('cone',f,.35+k*.07,.98,.2-k*.05,.05,.16,.05,'#e8dcc0','plain',PI,0,0);umbrella(f,.85,-.2,'#d8993d');
      }else if(t==='toys'){
        box(f,0,.6,0,1,.08,.6,'#8d6c43','wood');cyl(f,0,1.4,0,.025,1.6,'#6f5233','wood');
        const c=['#e63979','#ffc94d','#2e86c1','#16a085','#e67e22','#8e44ad'];
        for(let n=0;n<14;n++){const a=n*2.4,r=rand(.15,.45),y=2.55+rand(0,.55);ball(f,Math.cos(a)*r,y,Math.sin(a)*r,.14,c[n%6],1,1.2,1);put('cylinder',f,Math.cos(a)*r/2,(y+2.1)/2,Math.sin(a)*r/2,.004,y-2.1,.004,'#eee')}
        for(let k=0;k<5;k++){const x=-.4+k*.2;cyl(f,x,.85,.2,.012,.5,'#6f5233','wood');for(let j=0;j<4;j++)box(f,x,1.1,.21,.18,.03,.005,c[(k+j)%6],'plain',0,0,j*PI/4)}
      }
      vendor(f,-.15,-.85,i,t!=='toys'&&t!=='bangles');
      contact(f,0,0,2.6,2.4);
    }
    for(const [i,h] of MarketData.hawkers.entries()){
      if(MarketData.model.gates.some(g=>Math.abs(g.z-h.z)<4.8))continue; // never block a gate
      const f=frame(h.x,0,h.z,PI/2);hawkerGoods(f,h,i);
      const el=document.createElement('a-box');el.id=`hawker-${h.id}`;el.classList.add('clickable','hawker-hit');el.dataset.type=h.type;
      el.setAttribute('position',`${h.x+.2} 1.2 ${h.z}`);el.setAttribute('width','1.6');el.setAttribute('height','2.4');el.setAttribute('depth','2.2');el.setAttribute('material','opacity:0;transparent:true;depthWrite:false');
      el.addEventListener('click',()=>onShop(h));world.appendChild(el);
    }

    // Street-wall detailing on the supplied model: plinth, pilasters, frieze, coping, lamps and gate pillars.
    {
      const x=M.wallX,top=M.wallTop,len=M.zStart-M.zEnd,mid=(M.zStart+M.zEnd)/2,gates=M.gates,inGate=(z,pad=0)=>gates.some(g=>Math.abs(g.z-z)<3.1+pad);
      box(identity,x+.06,.35,mid,.14,.7,len,'#8f4f3a');box(identity,x+.1,.72,mid,.2,.06,len,'#c1b29a');
      box(identity,x+.04,top+.08,mid,.5,.16,len+.2,'#c1b29a');box(identity,x+.16,top-.08,mid,.12,.1,len,'#b39864');
      box(identity,x+.04,top-.55,mid,.06,.42,len,'#2a0e1c');
      for(let z=M.zStart-.4;z>M.zEnd;z-=.55)if(!inGate(z))ball(identity,x+.08,top-.55,z,.07,'#e0b04c',.6,1,1);
      for(let z=M.zStart-.2;z>=M.zEnd;z-=4.2){
        if(inGate(z,.5))continue;
        box(identity,x+.17,top/2,z,.32,top,.55,'#e2d6bd','plaster');box(identity,x+.2,top-.25,z,.42,.2,.68,'#c1b29a');box(identity,x+.2,.45,z,.42,.9,.68,'#a99b80');
        const lz=z-2.1;if(lz>M.zEnd&&!inGate(lz,.6)){box(identity,x+.2,3.2,lz,.18,.22,.18,'#4a4e42','metal');put('sphere',identity,x+.33,3.05,lz,.1,.14,.1,'#e3c98a','lamp')}
        for(const dz of [-1.1,1.1])if(!inGate(z+dz,.6)){pot(identity,x+.55,.0,z+dz,.28,.48);for(let n=0;n<9;n++)ball(identity,x+.55+rand(-.2,.2),.68+rand(0,.2),z+dz+rand(-.2,.2),.13,n%3?'#4e7048':'#e5ad3b',1,.8,1)}
      }
      for(const g of gates){
        for(const s of [-1,1]){
          const z=g.z+s*3.35;box(identity,x+.25,3,z,.75,6,.75,'#e2d6bd','plaster');box(identity,x+.25,.4,z,.95,.8,.95,'#a99b80');
          box(identity,x+.25,6.08,z,.95,.16,.95,'#c1b29a');put('pot',identity,x+.25,6.16,z,.24,.42,.24,'#cfa64e','metal');put('cone',identity,x+.25,6.72,z,.12,.32,.12,'#cfa64e','metal');
          box(identity,x+.64,2.9,z,.06,.5,.4,'#4a4e42','metal');put('sphere',identity,x+.7,2.72,z,.13,.18,.13,'#e3c98a','lamp');
          pot(identity,x+1.2,0,z,.34,.6);for(let n=0;n<16;n++)flower(identity,x+1.2+rand(-.25,.25),.85+rand(0,.15),z+rand(-.25,.25),.09,n%2?'#e5ad3b':'#dd7e36');
        }
        // Marigold toran with mango leaves under each canopy.
        for(let k=0;k<44;k++){const t=k/43,z=g.z-3+t*6,y=4.35-.35*Math.sin(t*PI);ball(identity,x+.95,y,z,.07,k%3?'#e5ad3b':'#dd7e36',1,1.3,1);
          if(k%4===2)put('sphere',identity,x+.95,y-.22,z,.03,.17,.07,'#4e7a3a')}
        sign(frame(x+.62,0,g.z,PI/2),g.name,g.telugu,4.4,6.05,0);
        // Rangoli on the threshold.
        for(let k=0;k<8;k++){const a=k*PI/4;put('sphere',identity,x+1.6+Math.sin(a)*.42,.05,g.z+Math.cos(a)*.42,.15,.006,.34,k%2?'#e63979':'#ffc94d','plain',0,a)}
        put('ring',identity,x+1.6,.052,g.z,.8,.8,.018,'#eee3ca','plain',PI/2);
      }
    }

    // Flower borders leave the central walking lane completely clear.
    for(let row=0;row<9;row++)for(const side of [-1,1]){
      const x=side*3.98,z=-3.5-row*9;
      box(identity,x,.25,z,.8,.48,2.5,'#a96b4e');box(identity,x,.51,z,.7,.04,2.36,'#554737');
      for(let n=0;n<35;n++)flower(identity,x+rand(-.26,.26),.69+rand(0,.13),z+rand(-1.05,1.05),rand(.06,.1),['#e5ad3b','#dd7e36','#d3a3aa','#eee8c7'][row%4]);
      contact(identity,x,z,1.5,3.3);
      // Right-side benches only: the left verge belongs to the hawkers.
      if(row%3===1&&side===1){
        const bf=frame(side*5.8,0,z,PI/2);
        box(bf,0,.58,0,2.1,.12,.6,'#aa8558','wood');box(bf,0,1, -.24,2.1,.48,.07,'#aa8558','wood');
        for(const px of [-.8,.8])box(bf,px,.28,0,.1,.56,.5,'#555e53','metal');
      }
    }

    // Flat petal carpets and traditional rangoli are anchored to actual paving.
    const carpets=[{z:3.5,w:4.8,d:2.2},{z:-8,w:2.8,d:1.9},{z:-17,w:2.8,d:1.9}];
    for(const {z,w,d} of carpets){
      for(let n=0;n<650;n++){
        const x=rand(-w/2,w/2),dz=rand(-d/2,d/2),edge=Math.abs(x)>w*.41||Math.abs(dz)>d*.35;
        put('petal',identity,x,.047,z+dz,.025,.042,1,edge?'#c66443':(Math.sin(x*4)+Math.cos(dz*5)>0?'#e5ae3f':'#e8d5ad'),'plain',-PI/2,0,rand(0,PI));
      }
    }
    for(const z of [8,-35,-71]){
      for(let k=0;k<8;k++){const a=k*PI/4;put('sphere',identity,Math.sin(a)*.45,.042,z+Math.cos(a)*.45,.16,.006,.36,k%2?'#d2a658':'#eee3ca','plain',0,a)}
      put('ring',identity,0,.044,z,.86,.86,.018,'#c7a362','plain',PI/2);
      put('ring',identity,0,.044,z,.98,.98,.018,'#eee3ca','plain',PI/2);
    }

    // A restrained garland canopy punctuates, rather than obscures, the street.
    for(const z of [-1,-22,-44,-66]){
      for(const side of [-1,1])cyl(identity,side*5.15,2.8,z,.045,5.6,'#677263','metal');
      for(let k=0;k<60;k++){
        const x=-5.1+k*.173,y=5.3-.8*(1-(x/5.1)**2);
        ball(identity,x,y,z,.055,k%4?'#cba345':'#eee3be',1,1.3,1);
        if(k%12===0){cyl(identity,x,y-.25,z,.018,.5,'#bfa16b');put('bowl',identity,x,y-.54,z,.13,.2,.13,'#cda35c')}
        if(k%12===0)put('sphere',identity,x,y-.46,z,.08,.12,.08,'#e3c98a','lamp');
      }
    }

    // Entrance: contemporary masonry, timber detailing, bilingual identity.
    for(const x of [-5.3,5.3]){box(identity,x,2.7,5,.65,5.4,.8,'#b89b75','plaster');box(identity,x,.4,5,.9,.8,1,'#8f7b60');}
    box(identity,0,5.4,5,11.3,.9,.75,'#714c38','wood');box(identity,0,5.94,5,11.6,.16,1,'#b39864');
    sign(frame(0,0,3.3),'Poorna Market · Visakhapatnam','పూర్ణ మార్కెట్',7.6,5.4,2.12);
    for(let k=0;k<60;k++)ball(identity,-5+k*.17,4.74-.35*Math.sin(k/59*PI),5.5,.065,k%4?'#d99c38':'#eee5c9');
    // Terminal shrine: small stone plinth, tiered terracotta silhouette.
    const sf=frame(0,0,-88);box(sf,0,.15,0,7,.3,6,'#a79a80');
    for(let k=0;k<4;k++){const w=5.4-k*1.05;box(sf,0,.7+k*1.25,0,w,1.2,w,'#b49a72','plaster');box(sf,0,1.31+k*1.25,0,w+.25,.16,w+.25,'#c1aa80')}
    box(sf,0,1.25,2.73,1.55,2.2,.08,'#43372d');box(sf,0,2.45,2.78,2,.15,.14,'#9b7c4d');
    put('cone',sf,0,6.15,0,.65,1.1,.65,'#cfa64e');pot(sf,-2.3,.3,2.5,.33,.6);pot(sf,2.3,.3,2.5,.33,.6);

    const neighborhood=MarketNeighborhood.build({T,root,identity,frame,box,cyl,ball,put,rand});
    // The supplied market building fills the left side. A failed download leaves the street usable.
    let model=null;
    try{model=await MarketModel.load({T,url:M.url,offset:M.offset,mat});root.add(model);world.dataset.model='loaded'}
    catch(error){console.warn('Market model unavailable',error);world.dataset.model='unavailable'}
    // Walk map and indoor stalls: each counter in the model gets goods for its floor's trade.
    const floorStops=[[],[],[],[]];let indoorStalls=0;
    try{
      if(!model)throw new Error('no model');
      const nav=await MarketNav.load(M.nav);MarketNav.current=nav;world.dataset.nav='loaded';
      const C=MarketData.categories;
      const tones={flowers:['#ebaa2b','#dd7d23','#f6f2e3','#b63e58','#e9c8d8'],vegetables:['#b64c38','#61516f','#6b8f3e','#c68c36','#4e7649'],
        fruit:['#e1c53e','#d9852c','#b8322b','#7da344','#e8a93a'],puja:['#c0392b','#e0b04c','#cfa64e','#f3e6c8','#6d8f3c'],
        dryfruit:['#e6d3a8','#a8714a','#3a2420','#9bb05a','#5a3423'],spices:['#b2492f','#d9a520','#7a6a3a','#2b2622','#9b7b3c'],
        seafood:['#c9d1d6','#9aa6ad','#e58a5c','#c0392b','#e8f1f4'],meat:['#a8423a','#c96a5e','#e8d5c0','#8a5a3c','#b5bcb5']};
      function goodsOn(t,cat,i){
        const long=t.w>=t.d,L=Math.max(t.w,t.d),S=Math.min(t.w,t.d),f=frame(t.x,t.top,t.z,long?0:PI/2),c=tones[cat];
        const n=Math.max(2,Math.floor((L-.2)/.42)),u=k=>-L/2+.25+k*(L-.5)/Math.max(1,n-1);
        if(cat==='flowers'){
          for(let k=0;k<n;k++){box(f,u(k),.03,0,.36,.06,Math.min(S-.06,.42),'#704b30','wood');for(let j=0;j<7;j++)ball(f,u(k)+rand(-.12,.12),.1+rand(0,.06),rand(-.13,.13),.07,c[(k+i)%5],1,.8,1)}
          if(i%2===0){box(f,0,1.25,0,L-.1,.035,.035,'#6f5233','wood');for(let k=0;k<n;k++)for(let j=0;j<9;j++)ball(f,u(k),1.18-j*.07,0,.04,c[(k+j)%3],1,1.3,1)}
        }else if(cat==='vegetables'||cat==='fruit'){
          for(let k=0;k<n;k++){box(f,u(k),.07,0,.36,.14,Math.min(S-.06,.42),'#8d6c43','wood');const col=c[(k+i)%5];
            for(let j=0;j<6;j++){const x=u(k)+rand(-.11,.11),z=rand(-.12,.12);
              if(cat==='fruit'&&col==='#e1c53e')put('sphere',f,x,.2,z,.035,.035,.12,col,'plain',0,rand(0,PI),PI/2);
              else ball(f,x,.19+rand(0,.05),z,cat==='vegetables'&&k%3===2?.05:.065,col,1,col==='#61516f'?1.6:1,1)}}
          if(cat==='fruit'&&i%3===0)for(let k=0;k<3;k++){cyl(f,u(k*2%n),.9,0,.012,.6,'#6f5233');for(let j=0;j<8;j++)put('sphere',f,u(k*2%n)+Math.cos(j)*.07,.75-j*.04,Math.sin(j)*.07,.03,.11,.03,'#d9c13c','plain',.3,0,0)}
        }else if(cat==='puja'){
          for(let k=0;k<n;k++){const x=u(k);if(k%3===0){cyl(f,x,.12,0,.035,.22,'#cfa64e','metal');put('bowl',f,x,.22,0,.09,.05,.09,'#cfa64e','metal')}
            else if(k%3===1){put('cone',f,x-.07,.07,0,.08,.13,.08,'#c0392b');put('cone',f,x+.08,.07,0,.08,.13,.08,'#e0b04c')}
            else{ball(f,x,.09,0,.09,'#8a5a3c',1,1.1,1);for(let j=0;j<5;j++)cyl(f,x+.12,.14,-.08+j*.04,.006,.26,'#5b3a24')}}
        }else if(cat==='dryfruit'){
          for(let k=0;k<n;k++){const x=u(k);put('bowl',f,x,0,0,.16,.1,.16,'#b5bcb5','metal');for(let j=0;j<6;j++)ball(f,x+rand(-.08,.08),.1,rand(-.08,.08),.03,c[k%5],1.3,.7,1)}
        }else if(cat==='spices'){
          for(let k=0;k<n;k++){const x=u(k);put('bowl',f,x,0,0,.17,.08,.17,'#c9ae78','woven');put('cone',f,x,.15,0,.15,.16,.15,c[(k+i)%5])}
          if(i%2===0)for(const s of [-1,1])cyl(identity,t.x+(long?s*(L/2+.25):0),t.top-.62,t.z+(long?0:s*(L/2+.25)),.2,.5,'#c9ae78','woven');
        }else if(cat==='seafood'){
          box(f,0,.03,0,L-.08,.06,S-.06,'#e8f1f4');
          for(let k=0;k<n;k++){const x=u(k);for(let j=0;j<2;j++){const z=(j-.5)*Math.min(.22,S*.4);
            put('sphere',f,x,.09,z,.15,.045,.055,c[(k+j)%2],'metal');put('cone',f,x+.17,.09,z,.04,.07,.04,c[(k+j)%2],'metal',0,0,PI/2)}
            if(k%2)for(let j=0;j<5;j++)put('sphere',f,x+rand(-.1,.1),.13,rand(-.1,.1),.03,.02,.05,'#e58a5c');
            if(k%3===2)ball(f,x,.12,0,.08,'#c0392b',1.2,.4,1)}
        }else if(cat==='meat'){
          box(f,0,.02,0,L-.08,.04,S-.06,'#e8d5c0');cyl(f,-L/2+.3,.1,0,.18,.16,'#8a5a3c','wood');
          box(f,L/2-.3,.06,0,.2,.1,.2,'#b5bcb5','metal');put('bowl',f,L/2-.3,.14,0,.12,.04,.12,'#cfa64e','metal');
          box(f,0,1.35,0,L-.1,.03,.03,'#b5bcb5','metal');
          for(let k=0;k<n;k++){const x=u(k);cyl(f,x,1.25,0,.006,.18,'#b5bcb5','metal');put('sphere',f,x,1.0,0,.08,.17,.06,c[k%2])}
        }
      }
      const floorDefs=MarketData.floors;
      for(let storey=0;storey<4;storey++){
        const def=floorDefs[storey],list=nav.header.tables.filter(t=>t.floor===storey).sort((a,b)=>a.z-b.z||a.x-b.x);
        const zone=k=>Math.min(def.cats.length-1,Math.floor(k*def.cats.length/list.length));
        list.forEach((t,k)=>{
          const cat=def.cats[zone(k)];goodsOn(t,cat,k);indoorStalls++;
          // A stall keeper at every counter, preferably behind it inside the booth.
          {const long=t.w>=t.d,off=Math.min(t.w,t.d)/2+.45;
            // Keepers stand behind the counter (the booth side, narrower than the aisle), never in the aisle.
            const sides=[-1,1].map(s=>{const vx=t.x+(long?0:s*off),vz=t.z+(long?s*off:0),fy=nav.stand(vx,vz,t.top-.9,.15);
              return {s,vx,vz,fy,ok:fy!==null&&Math.abs(fy-(t.top-.9))<.2,aisle:nav.stand(vx,vz,t.top-.9,.8)!==null}}).filter(v=>v.ok).sort((a,b)=>a.aisle-b.aisle);
            if(sides.length){const v=sides[0];vendor(frame(v.vx,v.fy,v.vz,long?(v.s>0?PI:0):(v.s>0?-PI/2:PI/2)),0,0,k,false)}}
          const item={inside:true,storey,cat,name:C[cat].name,telugu:C[cat].telugu,desc:C[cat].desc,stall:k+1,floor:def.name,x:t.x,z:t.z,y:t.top+.6};
          const el=document.createElement('a-box');el.id=`stall-${storey}-${k}`;el.classList.add('clickable','stall-hit');el.dataset.cat=cat;el.dataset.storey=storey;
          el.setAttribute('position',`${t.x} ${t.top-.25} ${t.z}`);el.setAttribute('width',t.w+.15);el.setAttribute('height',1.3);el.setAttribute('depth',t.d+.15);
          el.setAttribute('material','opacity:0;transparent:true;depthWrite:false');el.addEventListener('click',()=>onShop(item));world.appendChild(el);
        });
        // One tour stop and one hanging bilingual sign per trade zone.
        def.cats.forEach((cat,zi)=>{
          const zoneList=list.filter((_,k)=>zone(k)===zi);if(!zoneList.length)return;
          const t=zoneList[Math.floor(zoneList.length/2)],spot=nav.findClear(t.x,t.z,storey,7,.9)||nav.findClear(t.x,t.z,storey,7,.5);
          for(const yaw of [PI/2,-PI/2])sign(frame(t.x,t.top-.9,t.z,yaw),C[cat].name,C[cat].telugu,2.6,2.75,.02);
          put('sphere',identity,t.x,t.top+2.35,t.z,.12,.12,.12,'#e3c98a','lamp');
          if(spot)floorStops[storey].push({...spot,lookX:t.x,lookZ:t.z,item:{inside:true,storey,cat,name:C[cat].name,telugu:C[cat].telugu,desc:C[cat].desc,floor:def.name,x:t.x,z:t.z,y:t.top+.6,zone:true}});
        });
      }
      world.dataset.indoorStalls=indoorStalls;world.dataset.floorStops=floorStops.map(s=>s.length).join(',');
    }catch(error){console.warn('Indoor walk unavailable',error);world.dataset.nav='unavailable'}
    // A small fixed light budget keeps evening mode practical on mobile.
    const eveningLights=[new T.PointLight('#ffcf91',0,38,1.5),new T.PointLight('#ffcf91',0,38,1.5)];
    eveningLights[0].position.set(0,5,-6);eveningLights[1].position.set(0,5,-47);eveningLights.forEach(light=>root.add(light));
    const lampFill=new T.DirectionalLight('#ffd4a0',0);lampFill.position.set(0,7,15);root.add(lampFill);

    for(const batch of batches.values()){
      const mesh=new T.InstancedMesh(batch.geometry,batch.material,batch.items.length);
      batch.items.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
      if(batch.colors){const c=new T.Color();batch.colors.forEach((hex,i)=>mesh.setColorAt(i,c.set(hex)));mesh.instanceColor.needsUpdate=true}
      // Thin illuminated faces must not self-shadow against their surrounding frames.
      mesh.castShadow=batch.geometry===geos.box&&!batch.material.userData.selfLitSurface;
      mesh.receiveShadow=!batch.material.transparent&&!batch.material.userData.selfLitSurface;root.add(mesh);
    }
    world.setObject3D('market',root);
    const renderer=world.sceneEl.renderer;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
    world.dataset.shopCount=MarketData.shops.length;world.dataset.threeStoreyCount=MarketData.shops.filter(s=>s.tall).length;
    world.dataset.flowerBorders='18';world.dataset.petalCarpets=carpets.length;
    world.dataset.hawkerCount=document.querySelectorAll('.hawker-hit').length;world.dataset.sakuraTrees=sakuraZ.length;
    if(model){world.dataset.modelNodes=model.userData.nodes;world.dataset.modelVertices=model.userData.drawnVertices}
    world.dataset.neighborhoodBuildings=neighborhood.buildings;world.dataset.connectingRoads=neighborhood.roads;
    world.dataset.instanceCount=[...batches.values()].reduce((n,b)=>n+b.items.length,0);
    function setTimeOfDay(mode){
      const evening=mode==='evening';world.dataset.timeOfDay=evening?'evening':'day';
      sky.material.map=evening?eveningTex:skyTex;sky.material.needsUpdate=true;
      hemisphere.color.set(evening?'#a5b4dd':'#e7eff3');hemisphere.groundColor.set(evening?'#775a4a':'#8b7050');hemisphere.intensity=evening?.85:1.65;
      sunlight.color.set(evening?'#efb07d':'#ffdfb2');sunlight.intensity=evening?.28:2.1;
      sunlight.position.set(evening?-35:-12,evening?12:22,evening?16:9);
      sun.position.set(evening?-110:-65,evening?10:42,evening?-90:-110);sun.material.color.set(evening?'#f6ba89':'#fff0cc');moon.visible=evening;
      lampFill.intensity=evening?.65:0;eveningLights.forEach(light=>{light.intensity=evening?14:0});
      for(const [key,material] of materials){if(key.endsWith('window'))material.emissiveIntensity=evening?.5:0;if(key.endsWith('lamp'))material.emissiveIntensity=evening?2.3:0}
      world.sceneEl.setAttribute('fog','color',evening?'#796b7c':'#ded4bd');
      renderer.shadowMap.needsUpdate=true;
    }
    return {ground,root,setTimeOfDay,floorStops,dispose(){
      world.removeObject3D('market');for(const g of Object.values(geos))g.dispose();model?.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.dispose?.()}});for(const m of materials.values())m.dispose();
      for(const tex of textures)tex.dispose();for(const p of signs)p.material.dispose();sky.geometry.dispose();sky.material.dispose();sun.material.dispose();moon.material.dispose();
    }};
  }
  return {build};
})();
