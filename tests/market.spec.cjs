const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

async function load(page) {
  await page.goto('/');
  await expect(page.locator('#enter')).toBeEnabled({ timeout: 20000 }); // the market model and walk map take ~4-5 s headless
}
async function position(page) {
  return page.evaluate(() => {
    const p = new AFRAME.THREE.Vector3();
    document.querySelector('#cam').object3D.getWorldPosition(p);
    return { x: p.x, y: p.y, z: p.z };
  });
}

test('short intro scrolls to every action and keeps native VR controls clear',async({page})=>{
  await page.setViewportSize({width:320,height:256});await page.emulateMedia({reducedMotion:'reduce'});await load(page);
  await page.evaluate(()=>{MarketAudio.start=()=>{}});
  expect(await page.locator('#intro').evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
  await expect(page.locator('.a-enter-vr button')).toBeHidden();
  await page.locator('#intro h1').scrollIntoViewIfNeeded();
  expect((await page.locator('#intro h1').boundingBox()).y).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Tab');await expect(page.locator('#enter')).toBeFocused();
  await page.keyboard.press('Tab');await expect(page.locator('#guided')).toBeFocused();
  const action=await page.locator('#guided').boundingBox();expect(action.y).toBeGreaterThanOrEqual(0);expect(action.y+action.height).toBeLessThanOrEqual(256);
  await page.locator('#intro small').scrollIntoViewIfNeeded();
  const note=await page.locator('#intro small').boundingBox();expect(note.y).toBeGreaterThanOrEqual(0);expect(note.y+note.height).toBeLessThanOrEqual(256);
  await page.locator('#guided').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/fixed-intro-320x256.png'});
  await page.locator('#guided').click();await expect(page.locator('#counter')).toContainText('1 / 8');
  await expect(page.locator('.a-enter-vr button')).toBeVisible();
});

test('intro stays centered on desktop and recovery is reachable on short screens',async({page})=>{
  await load(page);
  const position=await page.locator('#intro>div').boundingBox();expect(position.y).toBeGreaterThan(0);
  expect(await page.locator('#intro').evaluate(el=>el.scrollHeight<=el.clientHeight)).toBe(true);
  await page.screenshot({path:'artifacts/fixed-intro-desktop.png'});
  await page.route('**/vendor/aframe-1.5.0.min.js',route=>route.abort());
  await page.setViewportSize({width:320,height:256});await page.reload();await expect(page.locator('#retry')).toBeVisible();
  await page.locator('#retry').scrollIntoViewIfNeeded();const retry=await page.locator('#retry').boundingBox();
  expect(retry.y).toBeGreaterThanOrEqual(0);expect(retry.y+retry.height).toBeLessThanOrEqual(256);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('renders locally without CDN requests and tours all 8 right-hand shops', async ({ page }) => {
  const errors = [], external = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https:\/\//, route => { external.push(route.request().url()); return route.abort(); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await load(page);
  expect(await page.evaluate(() => document.querySelector('a-scene').renderer.info.render.calls)).toBeGreaterThan(0);
  expect((await position(page)).y).toBeCloseTo(1.6);
  await page.locator('#guided').click();
  for (let i = 0; i < 8; i++) {
    await expect(page.locator('#counter')).toContainText(`${i + 1} / 8`);
    await expect(page.locator('#cd')).not.toBeEmpty();
    const p = await position(page);
    expect(p.z).toBeCloseTo(-7 - i * 10);
    expect(p.x).toBeCloseTo(-1.4);
    await page.locator('#next').click();
  }
  await expect(page.locator('#counter')).toContainText('1 / 8');
  await page.locator('#prev').click();
  await expect(page.locator('#counter')).toContainText('8 / 8');
  await expect.poll(() => page.evaluate(() => MarketAudio.state().duration)).toBeGreaterThan(0);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('walking, repeated glides, ground clicks, and stall raycasting work', async ({ page }) => {
  await load(page);
  await page.locator('#enter').click();
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(500);
  await page.keyboard.up('KeyW');
  expect((await position(page)).z).toBeLessThan(19);
  await page.locator('#next').click();
  await page.waitForTimeout(1100);
  expect((await position(page)).z).toBeCloseTo(-7, 1);
  await page.locator('#next').click();
  await page.locator('#prev').click();
  await page.waitForTimeout(1100);
  expect((await position(page)).x).toBeCloseTo(-1.4, 1);
  // A real canvas click toward the ground clears the story and glides.
  await page.locator('#cam').evaluate(el => { el.components['look-controls'].pitchObject.rotation.x = -.8; });
  await page.mouse.move(720, 450);
  await page.waitForTimeout(100);
  await page.mouse.click(720, 450);
  await expect(page.locator('#card')).not.toHaveClass(/show/);
  await page.waitForTimeout(1100);
  const p = await position(page);
  expect(p.x).toBeLessThanOrEqual(3.11);expect(p.x).toBeGreaterThanOrEqual(-7.41);
  expect(p.z).toBeGreaterThanOrEqual(-80);
  // Aim at a physical stall, then click through A-Frame's mouse raycaster.
  await page.evaluate(() => {
    const cam = document.querySelector('#cam');
    const p = new AFRAME.THREE.Vector3(); cam.object3D.getWorldPosition(p);
    const dx = 5.2 - p.x, dz = -7 - p.z;
    cam.components['look-controls'].yawObject.rotation.y = Math.atan2(-dx, -dz);
    cam.components['look-controls'].pitchObject.rotation.x = 0;
  });
  await page.waitForTimeout(200);
  await page.mouse.move(720, 450);
  await page.waitForTimeout(100);
  await page.mouse.click(720, 450);
  await expect(page.locator('#card')).toHaveClass(/show/);
  await expect(page.locator('#ct')).toHaveText('Jasmine Strings');
});

test('help traps focus, closes with Escape, pauses movement, and exposes motion and sound controls', async ({ page }) => {
  await load(page);
  await page.locator('#enter').click();
  await page.locator('#hlp').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const before = await position(page);
  await page.keyboard.down('KeyW'); await page.waitForTimeout(200); await page.keyboard.up('KeyW');
  expect(await position(page)).toEqual(before);
  await page.locator('#motion').uncheck();
  expect(await page.locator('#petals').evaluate(el => el.object3D.visible)).toBe(false);
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement.closest('#help'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('#hlp')).toBeFocused();
  await page.locator('#snd').click();
  await expect(page.locator('#snd')).toHaveAttribute('aria-label', 'Unmute sound');
  await expect(page.locator('#snd')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#snd').click();
  await expect(page.locator('#snd')).toHaveAttribute('aria-label', 'Mute sound');
});

test('missing engine has a recoverable error instead of broken entry buttons', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/vendor/aframe-1.5.0.min.js', route => route.abort());
  await page.goto('/');
  await expect(page.locator('#status')).toContainText('3D engine could not load');
  await expect(page.locator('#retry')).toBeVisible();
  await expect(page.locator('#enter')).toBeDisabled();
  expect(errors).toEqual([]);
});

test('audio failure does not block exploration', async ({ page }) => {
  await page.addInitScript(() => { window.AudioContext = class { constructor() { throw new Error('Audio unavailable'); } }; });
  await load(page);
  await page.locator('#enter').click();
  await expect(page.locator('#hud')).toBeVisible();
  await expect(page.locator('#snd')).toHaveAttribute('aria-label', 'Retry music');
  await page.locator('#next').click();
  await expect(page.locator('#ct')).toHaveText('Jasmine Strings');
});

test('desktop and mobile layout, touch drag and tap, and reduced motion', async ({ browser }) => {
  fs.mkdirSync('artifacts', { recursive: true });
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, hasTouch: mobile, isMobile: mobile });
    const page = await context.newPage();
    await load(page);
    await page.screenshot({ path: `artifacts/${mobile ? 'mobile' : 'desktop'}-intro.png` });
    await page.locator('#enter').click();
    await page.waitForTimeout(1100);
    await page.screenshot({ path: `artifacts/${mobile ? 'mobile' : 'desktop'}-street.png` });
    await page.locator('#next').click();
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const id of ['lighting', 'snd', 'hlp', 'prev', 'next']) {
      const box = await page.locator(`#${id}`).boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(mobile ? 390 : 1440);
    }
    await page.screenshot({ path: `artifacts/${mobile ? 'mobile' : 'desktop'}-market.png` });
    if (mobile) {
      const initial = await page.locator('#cam').evaluate(el => el.components['look-controls'].yawObject.rotation.y);
      const cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 180, y: 320 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 280, y: 320 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      expect(await page.locator('#cam').evaluate(el => el.components['look-controls'].yawObject.rotation.y)).not.toBe(initial);
      await page.locator('#next').tap();
      await expect(page.locator('#counter')).toContainText('2 / 8');
      await page.locator('#hlp').tap();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.screenshot({ path: 'artifacts/mobile-help.png' });
      await page.locator('#hx').tap();
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.locator('#petals').evaluate(el => el.object3D.visible)).toBe(false);
    await page.locator('#next').click();
    expect(await page.locator('#rig').getAttribute('animation__mv')).toBeNull();
    await context.close();
  }
});


test('architecture, local signage, flower walkways and category displays are present', async ({page}) => {
  await load(page);
  await expect(page.locator('.shop-hit')).toHaveCount(8);
  await expect(page.locator('[data-storeys="3"]')).toHaveCount(3);
  await expect(page.locator('#world')).toHaveAttribute('data-flower-borders', '18');
  await expect(page.locator('#world')).toHaveAttribute('data-petal-carpets', '3');
  expect(await page.evaluate(() => document.fonts.check('24px "Market Telugu"'))).toBe(true);
  expect(await page.evaluate(() => new Set(MarketData.shops.map(s=>s.type)).size)).toBe(7);
  const render = await page.evaluate(() => ({calls:document.querySelector('a-scene').renderer.info.render.calls,triangles:document.querySelector('a-scene').renderer.info.render.triangles}));
  console.log('Scene render budget:',render);
  // Budget includes ~34 baked draw calls for the supplied market model and the hawker/sakura batches.
  expect(render.calls).toBeLessThan(360);
});

test('music loads locally, loops, changes volume, mutes and pauses when hidden', async ({page}) => {
  await load(page);
  expect(await page.evaluate(() => MarketAudio.state().started)).toBe(false);
  await page.locator('#enter').click();
  await expect.poll(() => page.evaluate(() => MarketAudio.state().playing), { timeout: 15000 }).toBe(true); // decode shares the main thread with the heavier scene
  expect(await page.evaluate(() => MarketAudio.state().duration)).toBeCloseTo(178.7, 1);
  await page.locator('#hlp').click();
  await page.locator('#volume').fill('18');
  await expect(page.locator('#volume-value')).toHaveText('18%');
  expect(await page.evaluate(() => MarketAudio.state().volume)).toBeCloseTo(.18);
  await page.keyboard.press('Escape');
  await page.locator('#snd').click();
  expect(await page.evaluate(() => MarketAudio.state().on)).toBe(false);
  await page.evaluate(() => { Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(() => page.evaluate(() => MarketAudio.state().contextState)).toBe('suspended');
  await page.evaluate(() => { Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(() => page.evaluate(() => MarketAudio.state().contextState)).toBe('running');
  await page.locator('#snd').click();
  expect(await page.evaluate(() => MarketAudio.state().on)).toBe(true);
  await page.reload(); await expect(page.locator('#enter')).toBeEnabled({ timeout: 20000 });
  await page.locator('#enter').click();await page.locator('#hlp').click();
  await expect(page.locator('#volume')).toHaveValue('18');
});

test('failed music request can be retried without blocking the tour', async ({page}) => {
  await page.route('**/krishna-flute-theme.mp3', route=>route.abort());
  await load(page);await page.locator('#enter').click();
  await expect(page.locator('#snd')).toHaveAttribute('aria-label','Retry music');
  await page.locator('#next').click();await expect(page.locator('#ct')).toHaveText('Jasmine Strings');
  await page.unroute('**/krishna-flute-theme.mp3');await page.locator('#snd').click();
  await expect.poll(()=>page.evaluate(()=>MarketAudio.state().playing),{timeout:15000}).toBe(true);
});


test('captures representative crafts, produce and local shops for visual review', async ({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await load(page);await page.locator('#guided').click();
  for(let i=0;i<8;i++){
    {
      await page.screenshot({path:`artifacts/shop-${i+1}.png`});
    }
    if(i<7)await page.locator('#next').click();
  }
});


test('evening toggle changes actual lighting and persists without disturbing the tour',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await load(page);await expect(page.locator('#world')).toHaveAttribute('data-time-of-day','day');
  await page.locator('#guided').click();const before=await position(page);
  await page.getByRole('button',{name:'Evening lighting',exact:true}).click();
  await expect(page.locator('#lighting')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#world')).toHaveAttribute('data-time-of-day','evening');
  expect(await position(page)).toEqual(before);await expect(page.locator('#counter')).toContainText('1 / 8');
  const light=await page.evaluate(()=>{
    const root=document.querySelector('#world').getObject3D('market');
    const lamps=[];root.traverse(o=>{if(o.isInstancedMesh&&o.material.emissiveIntensity>1)lamps.push(o)});
    return {hemisphere:root.children.find(o=>o.isHemisphereLight).intensity,lamps:lamps.length,points:root.children.filter(o=>o.isPointLight&&o.intensity>0).length};
  });
  expect(light.hemisphere).toBeLessThan(1);expect(light.lamps).toBeGreaterThan(0);expect(light.points).toBe(2);
  await page.reload();await expect(page.locator('#enter')).toBeEnabled({ timeout: 20000 });
  await expect(page.locator('#world')).toHaveAttribute('data-time-of-day','evening');await page.locator('#enter').click();
  await page.locator('#lighting').focus();await page.keyboard.press('Space');
  await expect(page.locator('#lighting')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#world')).toHaveAttribute('data-time-of-day','day');
});

test('surrounding neighborhood and day/evening views on desktop and mobile',async({browser})=>{
  test.setTimeout(90000); // Two browser contexts and thirteen GPU-rendered captures.
  for(const mobile of [false,true]){
    const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
    const page=await context.newPage();await load(page);
    // Audio has dedicated decode/retry tests; keep screenshot teardown independent of audio devices.
    await page.evaluate(()=>{MarketAudio.start=()=>{}});
    await expect(page.locator('#world')).toHaveAttribute('data-neighborhood-buildings','33');
    await expect(page.locator('#world')).toHaveAttribute('data-connecting-roads','3');
    await page.locator('#enter').click();await page.waitForTimeout(250);
    const prefix=`artifacts/neighborhood-${mobile?'mobile':'desktop'}`;
    await page.screenshot({path:`${prefix}-day.png`});
    await page.locator('#cam').evaluate(el=>{el.components['look-controls'].yawObject.rotation.y=Math.PI/2});await page.waitForTimeout(150);
    await page.screenshot({path:`${prefix}-side-day.png`});
    await page.locator('#cam').evaluate(el=>{el.components['look-controls'].yawObject.rotation.y=Math.PI});await page.waitForTimeout(150);
    await page.screenshot({path:`${prefix}-back-day.png`});
    if(mobile)await page.locator('#lighting').tap();else await page.locator('#lighting').click();
    await page.waitForTimeout(250);await page.screenshot({path:`${prefix}-back-evening.png`});
    await page.locator('#cam').evaluate(el=>{el.components['look-controls'].yawObject.rotation.y=0});await page.waitForTimeout(150);
    await page.screenshot({path:`${prefix}-evening.png`});
    await page.locator('#next').click();await page.waitForTimeout(150);await page.screenshot({path:`${prefix}-shop-evening.png`});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(mobile){await page.setViewportSize({width:320,height:640});await page.waitForTimeout(150);
      const brand=await page.locator('.brand').boundingBox(), tools=await page.locator('.tools').boundingBox();
      expect(brand.x+brand.width).toBeLessThanOrEqual(tools.x);await page.screenshot({path:'artifacts/neighborhood-small-evening.png'});}
    await context.close();
  }
});


test('building light faces retain depth separation and steady evening emission',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await load(page);
  await page.evaluate(()=>{MarketAudio.start=()=>{}});await page.locator('#enter').click();await page.locator('#lighting').click();
  const samples=await page.evaluate(async()=>{
    const cam=document.querySelector('#cam'),camera=cam.getObject3D('camera'),root=document.querySelector('#world').getObject3D('market');
    const faces=[];root.traverse(o=>{if(o.isInstancedMesh&&o.material.userData.selfLitSurface)faces.push(o)});
    const depth=d=>new AFRAME.THREE.Vector3(0,0,-d).applyMatrix4(camera.projectionMatrix).z*.5+.5;
    const separation=[30,70,130,150].map(d=>(depth(d+.035)-depth(d))*2**24);
    const intensities=[];
    for(let frame=0;frame<12;frame++){
      cam.components['look-controls'].yawObject.rotation.y=Math.PI+Math.sin(frame)*.002;
      await new Promise(resolve=>requestAnimationFrame(resolve));
      intensities.push(faces.map(o=>o.material.emissiveIntensity));
    }
    return {separation,intensities,count:faces.length,shadowed:faces.some(o=>o.castShadow||o.receiveShadow),far:camera.far};
  });
  expect(samples.count).toBeGreaterThan(0);expect(Math.min(...samples.separation)).toBeGreaterThan(4);
  expect(samples.far).toBeGreaterThan(260);expect(samples.shadowed).toBe(false);
  for(const frame of samples.intensities)expect(frame).toEqual(samples.intensities[0]);
  await page.screenshot({path:'artifacts/stable-building-lights.png'});
});

test('supplied market model fills the left side; hawkers clear the gates and tell stories; sakura petals fall',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await load(page);
  const w=page.locator('#world');
  await expect(w).toHaveAttribute('data-model','loaded');await expect(w).toHaveAttribute('data-model-nodes','89724');
  await expect(w).toHaveAttribute('data-hawker-count','10');await expect(w).toHaveAttribute('data-sakura-trees','9');
  // Every hawker sits between the kerb and the wall, at least 4.8 m from a gate centre.
  const layout=await page.evaluate(()=>({gates:MarketData.model.gates.map(g=>g.z),wall:MarketData.model.wallX,
    hawkers:[...document.querySelectorAll('.hawker-hit')].map(el=>el.object3D.position).map(p=>({x:p.x,z:p.z}))}));
  for(const h of layout.hawkers){expect(h.x).toBeLessThan(-5.9);expect(h.x).toBeGreaterThan(layout.wall+1.5);
    for(const g of layout.gates)expect(Math.abs(h.z-g)).toBeGreaterThanOrEqual(4.8)}
  // The model geometry really sits on the left of the street, behind the wall line.
  const box=await page.evaluate(()=>{const root=document.querySelector('#world').getObject3D('market');const T=AFRAME.THREE;
    const model=root.children.find(o=>o.isGroup&&o.userData.nodes);const b=new T.Box3().setFromObject(model);return {max:b.max.x,minZ:b.min.z,maxZ:b.max.z,calls:model.userData.drawCalls}});
  expect(box.max).toBeLessThan(-10.9);expect(box.maxZ).toBeLessThan(4);expect(box.minZ).toBeGreaterThan(-90);
  await page.locator('#enter').click();
  // Clicking a hawker opens its story without moving the shop tour.
  await page.evaluate(()=>document.querySelector('#hawker-h-tea').emit('click'));
  await expect(page.locator('#ct')).toHaveText('Roadside Chai');await expect(page.locator('#counter')).toContainText('Street hawker');
  await page.locator('#next').click();await expect(page.locator('#counter')).toContainText('1 / 8');
  // Petals are pink and spread along the whole street.
  const petals=await page.evaluate(()=>{const m=document.querySelector('#petals').getObject3D('mesh'),c=new AFRAME.THREE.Color(),zs=[];
    let pink=0;for(let i=0;i<m.count;i++){m.getColorAt(i,c);if(c.r>c.g&&c.r>=c.b)pink++}
    const p=document.querySelector('#petals').components.petals.items;return {count:m.count,pink,visible:m.visible,minZ:Math.min(...p.map(i=>i.z)),maxZ:Math.max(...p.map(i=>i.z))}});
  expect(petals.pink).toBe(petals.count);expect(petals.visible).toBe(true);expect(petals.maxZ-petals.minZ).toBeGreaterThan(80);
  await page.screenshot({path:'artifacts/model-street.png'});
});

// Walks the camera in small steps (as WASD would) and lets the walker run between steps.
async function walk(page, points) {
  return page.evaluate(async pts => {
    const cam = document.querySelector('#cam'), w = cam.components.bounds, p = new AFRAME.THREE.Vector3();
    const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    let heights = [];
    for (let i = 1; i < pts.length; i++) {
      cam.object3D.getWorldPosition(p);
      const [tx, tz] = pts[i], n = Math.ceil(Math.hypot(tx - p.x, tz - p.z) / .15);
      const sx = p.x, sz = p.z;
      for (let k = 1; k <= n; k++) { w.place(sx + (tx - sx) * k / n, sz + (tz - sz) * k / n); await frame(); heights.push(w.feet); }
    }
    for (let k = 0; k < 20; k++) await frame();
    cam.object3D.getWorldPosition(p);
    return { x: p.x, z: p.z, feet: w.feet, rigY: document.querySelector('#rig').object3D.position.y, storey: MarketState.storey, max: Math.max(...heights) };
  }, points);
}

test('market building: walls block, gates admit, ramps climb to the next floor', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await load(page);
  await expect(page.locator('#world')).toHaveAttribute('data-nav', 'loaded');
  await page.locator('#enter').click();
  const teleport = (x, z, y) => page.evaluate(([x, z, y]) => document.querySelector('#cam').components.bounds.teleport(x, z, y), [x, z, y]);
  // The street wall stops you between gates.
  await teleport(-9, -35, 0);
  let r = await walk(page, [[-9, -35], [-16, -35]]);
  expect(r.x).toBeGreaterThan(-11.9); expect(r.storey).toBeNull();
  // The Main Gate lets you in, onto the ground floor.
  await teleport(-9, -45.55, 0);
  r = await walk(page, [[-9, -45.55], [-15, -45.55]]);
  expect(r.x).toBeLessThan(-13.5); expect(r.storey).toBe(0);
  await expect(page.locator('#floors button[data-floor="0"]')).toHaveAttribute('aria-pressed', 'true');
  // Up the switchback ramp by the South Gate: ground floor (0.6 m) → landing (2.48 m) → first floor (4.35 m).
  await teleport(-28.1, -71.4, .6);
  r = await walk(page, [[-28.1, -71.4], [-28.1, -79.4], [-25.6, -79.4], [-25.6, -71.2], [-25.6, -69.5]]);
  expect(r.max).toBeGreaterThan(4.2); expect(r.feet).toBeCloseTo(4.35, 1); expect(r.storey).toBe(1);
  await expect(page.locator('#floor-label')).toContainText('First Floor');
  await page.screenshot({ path: 'artifacts/building-ramp-first-floor.png' });
});

test('G+3 buttons jump to each floor; the floor tour shows that floor\'s trades', async ({ page }) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: 'reduce' }); await load(page);
  await expect(page.locator('#world')).toHaveAttribute('data-indoor-stalls', '303');
  await page.locator('#enter').click();
  const expected = [['Flower Stalls', 'Vegetable Stalls', 'Fruit Stalls'], ['Flower Stalls', 'Vegetable Stalls', 'Fruit Stalls'], ['Pooja Stalls', 'Dry Fruit Stalls', 'Spice Stalls'], ['Sea Food', 'Meat Stalls']];
  for (const storey of [0, 1, 2, 3]) {
    await page.locator(`#floors button[data-floor="${storey}"]`).click();
    await expect.poll(() => page.evaluate(() => MarketState.storey)).toBe(storey);
    await expect(page.locator(`#floors button[data-floor="${storey}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#minimap')).toBeVisible();
    const seen = [];
    for (let i = 0; i < expected[storey].length; i++) {
      await page.locator('#next').click({ timeout: 8000 });
      await expect(page.locator('#card')).toHaveClass(/show/);
      seen.push((await page.locator('#ct').textContent()).split(' · ')[0]);
      expect(await page.evaluate(() => MarketState.storey)).toBe(storey);
      await page.waitForTimeout(150);
      await page.screenshot({ path: `artifacts/floor-${storey}-stop-${i + 1}.png` });
    }
    expect(seen).toEqual(expected[storey]);
  }
  // Clicking a stall gives its floor and stall number.
  await page.evaluate(() => document.querySelector('.stall-hit[data-storey="3"][data-cat="seafood"]').emit('click'));
  await expect(page.locator('#counter')).toContainText('Third Floor · Stall');
  // Leaving through the street returns the street tour.
  await page.evaluate(() => document.querySelector('#cam').components.bounds.teleport(0, -20, 0));
  await expect.poll(() => page.evaluate(() => MarketState.storey)).toBeNull();
  await page.locator('#next').click(); await expect(page.locator('#counter')).toContainText('/ 8');
});
