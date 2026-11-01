/* The surrounding blocks are scenic context; the sixteen-shop walk stays clear. */
window.MarketNeighborhood = {
  build({T,root,identity,frame,box,cyl,ball,put,rand}) {
    let buildings=0;
    const road='#777b79',kerb='#b7b09f',marking='#ddd6bb';
    // Connected side roads and cross streets wrap the market block.
    for(const x of [-19,19]){
      box(identity,x,-.025,-39,8,.08,154,road);
      for(const edge of [-1,1])box(identity,x+edge*5.1,.06,-39,2.2,.18,154,kerb);
      for(let z=34;z>-115;z-=8)box(identity,x,.025,z,.1,.012,3.5,marking);
    }
    for(const z of [27,-99]){
      box(identity,0,-.018,z,146,.08,9,road);
      for(const edge of [-1,1])box(identity,0,.06,z+edge*5.7,146,.18,2.4,kerb);
      for(let x=-70;x<72;x+=8)box(identity,x,.03,z,3.5,.012,.1,marking);
      for(const side of [-1,1])for(let k=0;k<6;k++)box(identity,side*(15.6+k*1.15),.04,z, .7,.015,5.5,'#e7dfca');
    }
    // Paved forecourt joins the entrance to the front cross street.
    put('plane',identity,0,.018,15.5,29,14,1,'#ffffff','apron',-Math.PI/2);
    box(identity,0,.035,21,11,.035,.16,'#a99b80');
    function block(x,z,width,depth,floors,yaw,index){
      const f=frame(x,0,z,yaw),h=floors*3.05;
      const facade=['#cdbfac','#c4cdc1','#d4b9aa','#c4c7c3','#d7ccad'][index%5];
      box(f,0,h/2,0,width,h,depth,facade,'plaster');
      box(f,0,.32,depth/2+.04,width,.64,.2,'#958c7a');
      box(f,0,h+.12,0,width+.25,.24,depth+.25,'#b7ad96');
      box(f,0,h+.42,depth/2-.08,width,.42,.18,facade,'plaster');
      const columns=Math.max(2,Math.floor(width/2.8));
      for(let floor=0;floor<floors;floor++){
        const y=1.7+floor*3.05;
        for(let column=0;column<columns;column++){
          const wx=(column-(columns-1)/2)*(width/(columns+.4));
          box(f,wx,y,depth/2+.04,1.4,1.65,.12,'#666d62');
          box(f,wx,y,depth/2+.115,1.17,1.42,.06,'#567373','window');
          box(f,wx,y,depth/2+.16,.045,1.45,.04,'#b5b3a3');
          box(f,wx,y+.94,depth/2+.33,1.7,.12,.7,'#b6aa92');
          if(floor>0&&index%2===0){
            box(f,wx,y-.8,depth/2+.48,1.85,.12,.95,'#aaa38f');
            box(f,wx,y-.27,depth/2+.93,1.85,.055,.055,'#535e56','metal');
            for(let k=0;k<6;k++)box(f,wx-.82+k*.33,y-.5,depth/2+.93,.035,.55,.04,'#535e56','metal');
          }
        }
        if(floor===0){
          box(f,0,.98,depth/2+.15,.82,1.9,.1,'#675849','wood');
          box(f,0,2.1,depth/2+.6,Math.min(width-1,5.6),.12,1.3,['#8c6d58','#64766a','#977e55'][index%3]);
        }
      }
      if(index%3===0)cyl(f,-width*.27,h+.65,-depth*.17,.44,.95,'#666f66');
      if(index%4===0)box(f,width*.2,h+.32,-depth*.2,1.8,.06,1.1,'#415a66','metal',-.17);
      // Side windows give oblique views depth instead of blank box ends.
      for(const side of [-1,1])for(let level=1;level<floors;level++)for(const dz of [-depth*.23,depth*.23]){
        box(f,side*(width/2+.03),1.7+level*3.05,dz,.1,1.45,1.2,'#666d62');
        box(f,side*(width/2+.09),1.7+level*3.05,dz,.04,1.24,1,'#567373','window');
      }
      buildings++;
    }
    let index=0;
    // Near blocks face the side roads; a second tier supplies a continuous skyline.
    for(const side of [-1,1])for(let row=0;row<6;row++){
      block(side*30,-80+row*20,12,8,2+row%3,-side*Math.PI/2,index++);
      block(side*52,-85+row*21,13,10,2+(row+1)%3,-side*Math.PI/2,index++);
    }
    for(const x of [-63,-49,-35,-21,-7,7,21,35,49,63]){
      block(x,43,11.5,9,2+index%3,Math.PI,index++);
      block(x,-115,11.5,9,2+index%3,0,index++);
    }
    // Return elevations on the first market buildings complete the entrance corner.
    for(const side of [-1,1])for(const y of [5.3,8.3])for(const x of [-1.4,1.4]){
      box(identity,side*8.8+x,y,-4.53,1.35,1.8,.12,'#646b60');
      box(identity,side*8.8+x,y,-4.45,1.13,1.57,.06,'#567373','window');
      box(identity,side*8.8+x,y+1,-4.15,1.65,.12,.75,'#c8bba2');
    }
    // Footpath trees, planted verges, bins and lamps anchor the adjoining streets.
    for(const side of [-1,1])for(let row=0;row<8;row++){
      const x=side*24,z=20-row*17;
      box(identity,x,.12,z,1.5,.24,1.5,'#9f9c82');cyl(identity,x,1.55,z,.1,3.1,'#77684f');
      for(let k=0;k<9;k++)ball(identity,x+rand(-.6,.6),3.25+rand(-.25,.65),z+rand(-.6,.6),rand(.45,.7),k%2?'#65825a':'#80936a',1,.85,1);
      const lx=side*14,zl=z-6;
      cyl(identity,lx,2.65,zl,.055,5.3,'#535e56','metal');box(identity,lx-side*.42,5.25,zl,.85,.075,.08,'#535e56','metal');
      box(identity,lx-side*.78,5.2,zl,.55,.08,.28,'#e3c98a','lamp');
      if(row%3===0)box(identity,side*13.6,.4,z+.7,.45,.8,.45,'#627267');
    }
    // Two foreground corner trees break up the approach without hiding the arch.
    for(const side of [-1,1]){
      const x=side*11,z=17;cyl(identity,x,1.8,z,.13,3.6,'#77684f');
      for(let k=0;k<12;k++)ball(identity,x+rand(-1,1),3.7+rand(-.2,1),z+rand(-.8,.8),rand(.5,.9),'#65825a',1,.8,1);
      box(identity,x,.18,z,2,.36,2,'#a99b80');
    }
    root.userData.neighborhoodBuildings=buildings;
    return {buildings,roads:4};
  }
};
