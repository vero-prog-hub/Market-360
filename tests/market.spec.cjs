const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

async function load(page) {
  await page.goto('/');
  await expect(page.locator('#enter')).toBeEnabled();
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
  await page.locator('#guided').click();await expect(page.locator('#counter')).toContainText('1 / 16');
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

test('renders locally without CDN requests and tours all 16 shops', async ({ page }) => {
  const errors = [], external = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https:\/\//, route => { external.push(route.request().url()); return route.abort(); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await load(page);
  expect(await page.evaluate(() => document.querySelector('a-scene').renderer.info.render.calls)).toBeGreaterThan(0);
  expect((await position(page)).y).toBeCloseTo(1.6);
  await page.locator('#guided').click();
  for (let i = 0; i < 16; i++) {
    await expect(page.locator('#counter')).toContainText(`${i + 1} / 16`);
    await expect(page.locator('#cd')).not.toBeEmpty();
    const p = await position(page);
    expect(p.z).toBeCloseTo(-8 - Math.floor(i / 2) * 9);
    expect(p.x).toBeCloseTo(i % 2 ? -1.4 : 1.4);
    await page.locator('#next').click();
  }
  await expect(page.locator('#counter')).toContainText('1 / 16');
  await page.locator('#prev').click();
  await expect(page.locator('#counter')).toContainText('16 / 16');
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
  expect((await position(page)).z).toBeCloseTo(-8, 1);
  await page.locator('#next').click();
  await page.locator('#prev').click();
  await page.waitForTimeout(1100);
  expect((await position(page)).x).toBeCloseTo(1.4, 1);
  // A real canvas click toward the ground clears the story and glides.
  await page.locator('#cam').evaluate(el => { el.components['look-controls'].pitchObject.rotation.x = -.8; });
  await page.mouse.move(720, 450);
  await page.waitForTimeout(100);
  await page.mouse.click(720, 450);
  await expect(page.locator('#card')).not.toHaveClass(/show/);
  await page.waitForTimeout(1100);
  const p = await position(page);
  expect(Math.abs(p.x)).toBeLessThanOrEqual(3.11);
  expect(p.z).toBeGreaterThanOrEqual(-80);
  // Aim at a physical stall, then click through A-Frame's mouse raycaster.
  await page.evaluate(() => {
    const cam = document.querySelector('#cam');
    const p = new AFRAME.THREE.Vector3(); cam.object3D.getWorldPosition(p);
    const dx = -4.2 - p.x, dz = -8 - p.z;
    cam.components['look-controls'].yawObject.rotation.y = Math.atan2(-dx, -dz);
    cam.components['look-controls'].pitchObject.rotation.x = 0;
  });
  await page.waitForTimeout(200);
  await page.mouse.move(720, 450);
  await page.waitForTimeout(100);
  await page.mouse.click(720, 450);
  await expect(page.locator('#card')).toHaveClass(/show/);
  await expect(page.locator('#ct')).toHaveText('Marigold Garlands');
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
  await expect(page.locator('#ct')).toHaveText('Marigold Garlands');
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
      await expect(page.locator('#counter')).toContainText('2 / 16');
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
  await expect(page.locator('.shop-hit')).toHaveCount(16);
  await expect(page.locator('[data-storeys="3"]')).toHaveCount(6);
  await expect(page.locator('#world')).toHaveAttribute('data-flower-borders', '18');
  await expect(page.locator('#world')).toHaveAttribute('data-petal-carpets', '3');
  expect(await page.evaluate(() => document.fonts.check('24px "Market Telugu"'))).toBe(true);
  expect(await page.evaluate(() => new Set(MarketData.shops.map(s=>s.type)).size)).toBe(13);
  const render = await page.evaluate(() => ({calls:document.querySelector('a-scene').renderer.info.render.calls,triangles:document.querySelector('a-scene').renderer.info.render.triangles}));
  console.log('Scene render budget:',render);
  expect(render.calls).toBeLessThan(300);
});

test('music loads locally, loops, changes volume, mutes and pauses when hidden', async ({page}) => {
  await load(page);
  expect(await page.evaluate(() => MarketAudio.state().started)).toBe(false);
  await page.locator('#enter').click();
  await expect.poll(() => page.evaluate(() => MarketAudio.state().playing)).toBe(true);
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
  await page.reload(); await expect(page.locator('#enter')).toBeEnabled();
  await page.locator('#enter').click();await page.locator('#hlp').click();
  await expect(page.locator('#volume')).toHaveValue('18');
});

test('failed music request can be retried without blocking the tour', async ({page}) => {
  await page.route('**/krishna-flute-theme.mp3', route=>route.abort());
  await load(page);await page.locator('#enter').click();
  await expect(page.locator('#snd')).toHaveAttribute('aria-label','Retry music');
  await page.locator('#next').click();await expect(page.locator('#ct')).toHaveText('Marigold Garlands');
  await page.unroute('**/krishna-flute-theme.mp3');await page.locator('#snd').click();
  await expect.poll(()=>page.evaluate(()=>MarketAudio.state().playing),{timeout:15000}).toBe(true);
});


test('captures representative crafts, produce and local shops for visual review', async ({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await load(page);await page.locator('#guided').click();
  for(let i=0;i<16;i++){
    if([4,6,7,10,12,13,14,15].includes(i)){
      await page.screenshot({path:`artifacts/shop-${i+1}.png`});
    }
    if(i<15)await page.locator('#next').click();
  }
});


test('evening toggle changes actual lighting and persists without disturbing the tour',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await load(page);await expect(page.locator('#world')).toHaveAttribute('data-time-of-day','day');
  await page.locator('#guided').click();const before=await position(page);
  await page.getByRole('button',{name:'Evening lighting',exact:true}).click();
  await expect(page.locator('#lighting')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#world')).toHaveAttribute('data-time-of-day','evening');
  expect(await position(page)).toEqual(before);await expect(page.locator('#counter')).toContainText('1 / 16');
  const light=await page.evaluate(()=>{
    const root=document.querySelector('#world').getObject3D('market');
    const lamps=[];root.traverse(o=>{if(o.isInstancedMesh&&o.material.emissiveIntensity>1)lamps.push(o)});
    return {hemisphere:root.children.find(o=>o.isHemisphereLight).intensity,lamps:lamps.length,points:root.children.filter(o=>o.isPointLight&&o.intensity>0).length};
  });
  expect(light.hemisphere).toBeLessThan(1);expect(light.lamps).toBeGreaterThan(0);expect(light.points).toBe(2);
  await page.reload();await expect(page.locator('#enter')).toBeEnabled();
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
    await expect(page.locator('#world')).toHaveAttribute('data-neighborhood-buildings','44');
    await expect(page.locator('#world')).toHaveAttribute('data-connecting-roads','4');
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
