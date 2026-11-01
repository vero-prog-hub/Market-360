window.MarketState={motion:!matchMedia('(prefers-reduced-motion: reduce)').matches,entered:false};
if(window.AFRAME){
  const T=AFRAME.THREE;
  AFRAME.registerComponent('bounds',{
    init(){this.v=new T.Vector3()},
    tick(){const p=this.v,o=this.el.object3D,b=MarketData.bounds;o.getWorldPosition(p);
      const x=Math.max(b.minX,Math.min(b.maxX,p.x)),z=Math.max(b.minZ,Math.min(b.maxZ,p.z));
      if(x!==p.x||z!==p.z){p.x=x;p.z=z;o.parent.worldToLocal(p);o.position.copy(p)}}
  });
  AFRAME.registerComponent('petals',{
    init(){
      this.v=new T.Vector3();this.dummy=new T.Object3D();this.items=[];
      this.geometry=new T.CircleGeometry(.025,5);this.material=new T.MeshBasicMaterial({side:T.DoubleSide});
      this.mesh=new T.InstancedMesh(this.geometry,this.material,40);
      const colors=['#d6a65a','#e4c7b7','#eacb86','#c18a8f'];
      for(let i=0;i<40;i++){this.items.push({x:Math.random()*12-6,y:Math.random()*6,z:Math.random()*18-13,speed:.15+Math.random()*.18,phase:Math.random()*6});this.mesh.setColorAt(i,new T.Color(colors[i%4]))}
      this.el.setObject3D('mesh',this.mesh);this.mesh.frustumCulled=false;
    },
    tick(time,delta){
      const active=MarketState.motion&&MarketState.entered;this.mesh.visible=active;if(!active)return;
      const cam=document.querySelector('#cam');if(!cam)return;cam.object3D.getWorldPosition(this.v);
      const dt=Math.min(delta,80)/1000;
      this.items.forEach((p,i)=>{p.y-=p.speed*dt;if(p.y<.1)p.y=6;
        this.dummy.position.set(this.v.x+p.x+Math.sin(time/3000+p.phase)*.25,p.y,this.v.z+p.z);
        this.dummy.rotation.set(time/2500+p.phase,time/3300,0);this.dummy.updateMatrix();this.mesh.setMatrixAt(i,this.dummy.matrix)});
      this.mesh.instanceMatrix.needsUpdate=true;
    },
    remove(){this.el.removeObject3D('mesh');this.geometry.dispose();this.material.dispose()}
  });
}
