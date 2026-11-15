window.MarketState={motion:!matchMedia('(prefers-reduced-motion: reduce)').matches,entered:false};
if(window.AFRAME){
  const T=AFRAME.THREE;
  /* Walking: the street keeps its box; on the hawker verge and inside the market building the walk map
     (MarketNav) supplies floor and ramp heights and stops movement at walls, railings, counters and edges. */
  AFRAME.registerComponent('bounds',{
    init(){this.v=new T.Vector3();this.last=new T.Vector3();this.feet=0;this.hasLast=false;MarketState.storey=null},
    place(x,z){const p=this.v,o=this.el.object3D;o.getWorldPosition(p);p.x=x;p.z=z;o.parent.worldToLocal(p);o.position.x=p.x;o.position.z=p.z},
    // Teleport (floor buttons, floor tour): put the camera at x,z standing on height y.
    teleport(x,z,y){const rig=this.el.parentEl;rig.removeAttribute('animation__mv');this.feet=y;rig.object3D.position.y=y;
      const o=this.el.object3D;rig.object3D.position.x=x-o.position.x;rig.object3D.position.z=z-o.position.z;this.last.set(x,0,z);this.hasLast=true;this.report()},
    report(){
      const nav=MarketNav.current,inside=nav&&this.last.x<MarketData.model.wallX-.05&&nav.inGrid(this.last.x,this.last.z);
      const storey=inside?nav.storeyOf(this.feet):null;
      if(storey!==MarketState.storey){MarketState.storey=storey;this.el.sceneEl.emit('storeychange',{storey})}
    },
    tick(){
      const p=this.v,o=this.el.object3D,rig=this.el.parentEl,b=MarketData.bounds,nav=MarketNav.current;o.getWorldPosition(p);
      if(rig.getAttribute('animation__mv')){this.last.set(p.x,0,p.z);this.hasLast=true;this.feet=rig.object3D.position.y;return} // street glide
      if(!nav||!nav.inGrid(p.x,p.z)){
        const x=Math.max(b.minX,Math.min(b.maxX,p.x)),z=Math.max(b.minZ,Math.min(b.maxZ,p.z));
        if(x!==p.x||z!==p.z)this.place(x,z);
        this.feet=0;rig.object3D.position.y=0;this.last.set(x,0,z);this.hasLast=true;this.report();return;
      }
      // Check the path in 10 cm sub-steps so a fast step (or a slow frame) cannot pass through a thin wall.
      let y=null,x=p.x,z=p.z;
      const fromGrid=this.hasLast&&nav.inGrid(this.last.x,this.last.z);
      const sweep=(tx,tz)=>{
        if(!fromGrid)return nav.stand(tx,tz,this.feet);
        const dx=tx-this.last.x,dz=tz-this.last.z,n=Math.min(40,Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1)));let feet=this.feet;
        for(let k=1;k<=n;k++){const s=nav.stand(this.last.x+dx*k/n,this.last.z+dz*k/n,feet);if(s===null)return null;feet=s}
        return feet;
      };
      y=sweep(p.x,p.z);
      if(y===null&&this.hasLast){
        // Slide along whichever axis is still free (also swept), otherwise stay put.
        if((y=sweep(p.x,this.last.z))!==null)z=this.last.z;
        else if((y=sweep(this.last.x,p.z))!==null)x=this.last.x;
        else{x=this.last.x;z=this.last.z;y=this.feet}
        this.place(x,z);
      }else if(y===null)y=this.feet;
      this.feet=y;rig.object3D.position.y+=(y-rig.object3D.position.y)*.35;
      if(Math.abs(rig.object3D.position.y-y)<.005)rig.object3D.position.y=y;
      this.last.set(x,0,z);this.hasLast=true;this.report();
    }
  });
  // Pink sakura petals drift down along the whole street, from the market wall to the right-hand shops.
  AFRAME.registerComponent('petals',{
    schema:{count:{default:650},minX:{default:-11.2},maxX:{default:9},minZ:{default:-84},maxZ:{default:14},top:{default:8}},
    init(){
      const d=this.data;this.dummy=new T.Object3D();this.items=[];
      this.geometry=new T.CircleGeometry(.03,6);this.geometry.scale(1,.62,1);
      this.material=new T.MeshBasicMaterial({side:T.DoubleSide});
      this.mesh=new T.InstancedMesh(this.geometry,this.material,d.count);
      const colors=['#f7c6d5','#f2a9c0','#fbd9e3','#ea93b2','#ffe4ec'];
      for(let i=0;i<d.count;i++){this.items.push(this.spawn({},Math.random()*d.top));this.mesh.setColorAt(i,new T.Color(colors[i%colors.length]))}
      this.el.setObject3D('mesh',this.mesh);this.mesh.frustumCulled=false;
    },
    spawn(p,y){const d=this.data;return Object.assign(p,{x:d.minX+Math.random()*(d.maxX-d.minX),y,z:d.minZ+Math.random()*(d.maxZ-d.minZ),
      speed:.28+Math.random()*.32,sway:.25+Math.random()*.45,phase:Math.random()*6.3,spin:.6+Math.random()*1.4})},
    tick(time,delta){
      const active=MarketState.motion&&MarketState.entered;this.mesh.visible=active;if(!active)return;
      const d=this.data,dt=Math.min(delta,80)/1000,t=time/1000,breeze=.35+Math.sin(t*.21)*.2;
      this.items.forEach((p,i)=>{
        p.y-=p.speed*dt;p.z-=breeze*dt;p.x+=Math.sin(t*.7+p.phase)*.12*dt;
        if(p.y<.06||p.z<d.minZ)this.spawn(p,d.top-Math.random()*.6);
        this.dummy.position.set(p.x+Math.sin(t*1.3+p.phase)*p.sway,p.y,p.z+Math.cos(t*.9+p.phase)*p.sway*.5);
        this.dummy.rotation.set(t*p.spin+p.phase,t*p.spin*.7,Math.sin(t+p.phase));this.dummy.updateMatrix();this.mesh.setMatrixAt(i,this.dummy.matrix)});
      this.mesh.instanceMatrix.needsUpdate=true;
    },
    remove(){this.el.removeObject3D('mesh');this.geometry.dispose();this.material.dispose()}
  });
}
