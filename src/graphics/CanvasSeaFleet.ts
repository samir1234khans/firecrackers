import { SEA_FLEET, SEA_WAVE_GAINS, SeaWakePool } from './SeaFleetState';
import { SeaAudienceSession } from './SeaAudienceSession';
import { PASSENGERS_BY_BOAT, SEA_PASSENGERS } from './SeaPassengers';
import type { WaterFrame } from './WaterWaves';

/** Cached original fallback art, projected from the same persistent world routes. */
export class CanvasSeaFleet {
  private readonly sprites = SEA_FLEET.map((boat, index) => {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 144;
    const c = canvas.getContext('2d')!;
    const wood = c.createLinearGradient(0, 78, 0, 115); wood.addColorStop(0, index === 3 ? '#446474' : index === 5 ? '#b8b5a0' : index === 7 ? '#a8755e' : index === 8 ? '#526470' : '#917553'); wood.addColorStop(1, index === 5 ? '#384f50' : '#211d1c');
    c.fillStyle = wood; c.beginPath(); c.moveTo(8, 84); c.quadraticCurveTo(131, 94, 247, 81); c.lineTo(224, 112); c.quadraticCurveTo(131, 131, 33, 109); c.closePath(); c.fill();
    c.strokeStyle = '#bc9870'; c.lineWidth = 2; c.beginPath(); c.moveTo(10, 84); c.quadraticCurveTo(137, 96, 247, 81); c.stroke();
    c.strokeStyle = '#594935'; c.lineWidth = 1;
    for (let plank = 0; plank < 4; plank++) { c.beginPath(); c.moveTo(25 + plank * 3, 92 + plank * 5); c.quadraticCurveTo(134, 105 + plank * 5, 231 - plank * 4, 91 + plank * 5); c.stroke(); }
    if (index === 1) {
      c.fillStyle = '#706043'; c.beginPath(); c.moveTo(61, 80); c.bezierCurveTo(59, 18, 191, 17, 207, 76); c.lineTo(195, 81); c.bezierCurveTo(176, 35, 86, 32, 74, 84); c.fill();
      c.strokeStyle = '#ad9368'; for (let rib = 0; rib < 7; rib++) { c.beginPath(); c.moveTo(72 + rib * 19, 76); c.lineTo(68 + rib * 20, 38 + Math.abs(rib - 3) * 6); c.stroke(); }
    }
    if (index === 3) { c.fillStyle = '#365361'; c.fillRect(78, 52, 83, 35); c.fillStyle = '#d8a062'; c.fillRect(83, 47, 72, 9); c.fillStyle = '#101c25'; c.fillRect(88, 61, 61, 20); c.fillStyle = '#567481'; c.fillRect(71, 44, 96, 7); }
    if (index === 2) { c.fillStyle = '#314951'; c.beginPath(); c.ellipse(191, 81, 20, 6, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#937a51'; c.beginPath(); c.ellipse(167, 79, 10, 4, 0, 0, Math.PI * 2); c.stroke(); }
    if (index === 5) { c.strokeStyle = '#5e8c8e'; c.lineWidth = 5; c.beginPath(); c.moveTo(18, 85); c.lineTo(236, 82); c.stroke(); c.fillStyle = '#b8b5a0'; c.fillRect(49, 61, 14, 24); }
    if (index === 6) { c.fillStyle = '#7b684a'; c.beginPath(); c.ellipse(55, 48, 25, 30, 0, Math.PI, Math.PI * 2); c.ellipse(209, 48, 25, 30, 0, Math.PI, Math.PI * 2); c.fill(); for (const x of [34, 76, 188, 230]) { c.fillRect(x, 49, 3, 37); } }
    if (index === 7) { c.fillStyle = '#a8755e'; c.fillRect(29, 93, 196, 5); c.fillStyle = '#78888b'; c.fillRect(173, 74, 40, 7); }
    if (index === 8) { c.fillStyle = '#7e6c50'; c.fillRect(167, 67, 19, 17); c.fillRect(194, 68, 18, 16); }
    if (index === 9) { c.strokeStyle = '#b3986e'; c.lineWidth = 6; c.beginPath(); c.moveTo(17, 95); c.lineTo(239, 95); c.moveTo(37, 114); c.lineTo(215, 114); c.stroke(); }
    for (let lamp = 0; lamp < boat.lamps; lamp++) { const x = index === 1 ? 87 + lamp * 87 : 176; c.fillStyle = '#e8ac60'; c.fillRect(x - 3, 69, 6, 10); c.strokeStyle = '#725439'; c.strokeRect(x - 5, 67, 10, 14); }
    return canvas;
  });
  private session = new SeaAudienceSession();
  private readonly wakes = new SeaWakePool();
  private sceneClock = 0;
  private readonly screen = { x: 0, y: 0 };
  private positions: { id: string; x: number; y: number; yaw: number }[] = [];
  setSession(session: SeaAudienceSession) { this.session = session; }
  update(clock: number, _moving: boolean) { this.sceneClock = clock; }
  draw(c: CanvasRenderingContext2D, width: number, height: number, horizon: number, frame: Readonly<WaterFrame>, moving: boolean,
    projectBurst: (x: number, y: number, z: number) => { x: number; y: number }) {
    const phone = width < 680, span = phone ? 144 : 670, waterHeight = height * .92 - horizon;
    this.session.advance(this.sceneClock, moving, phone, frame);
    const sizes = [.20, .20, .09, .075, .025, .16, .16, .035, .027, .04];
    const focus = this.session.focus, focused = focus === null ? null : this.session.poses[focus];
    const zoom = focus === null ? 1 : .74 / sizes[focus];
    const baseX = focused ? width * (.5 + .42 * focused.x / (phone ? 46 : 165)) : 0;
    const baseY = focused ? horizon + waterHeight * (.83 - .77 * (-focused.z - 25) / span) : 0;
    const project = (x: number, z: number) => {
      const v = (-z - 25) / span;
      this.screen.x = width * (.5 + .42 * x / (phone ? 46 : 165));
      this.screen.y = horizon + waterHeight * (.83 - .77 * v);
      if (focused) { this.screen.x = width * .5 + (this.screen.x - baseX) * zoom; this.screen.y = height * .78 + (this.screen.y - baseY) * zoom; }
      return this.screen;
    };
    c.save(); this.positions = [];
    for (let i = 0; i < SEA_FLEET.length; i++) {
      const pose = this.session.poses[i];
      if (moving) this.wakes.emit(i, this.session.clock.time, pose);
    }
    // World-space wakes are painted first and never drag along with the boats.
    for (const wake of this.wakes.marks) {
      const age = this.session.clock.time - wake.born; if (age < 0 || age > wake.life) continue;
      const point = project(wake.x, wake.z); c.strokeStyle = '#7194aa'; c.lineWidth = .65;
      c.globalAlpha = (1 - age / wake.life) ** 2 * wake.power * .22;
      const spread = wake.width * (.5 + age * .12) / (phone ? 46 : 165) * width * .42 * zoom;
      c.beginPath(); c.moveTo(point.x - spread, point.y + age * .15); c.lineTo(point.x, point.y); c.lineTo(point.x + spread, point.y + age * .15); c.stroke();
    }
    const ordered = SEA_FLEET.map((_, index) => index).sort((a, b) => this.session.poses[a].z - this.session.poses[b].z);
    for (const i of ordered) {
      const pose = this.session.poses[i], point = project(pose.x, pose.z), x = point.x, baseY = point.y;
      const sample = this.session.floats[i];
      const y = baseY - sample.height * (3 + (1 - SEA_FLEET[i].v) * 9);
      const apparent = Math.max(.40, Math.abs(Math.cos(pose.yaw))), hullWidth = Math.min(width, phone ? width : 850) * sizes[i] * zoom;
      const scale = hullWidth / 256, roll = sample.roll * Math.cos(pose.yaw) + sample.pitch * Math.sin(pose.yaw);
      this.positions.push({ id: SEA_FLEET[i].id, x, y, yaw: pose.yaw });
      c.save(); c.translate(x, y); c.rotate(roll);
      c.globalAlpha = .6; c.fillStyle = '#030b12'; c.beginPath(); c.ellipse(0, 1, hullWidth * apparent * .43, Math.max(1, hullWidth * .017), 0, 0, Math.PI * 2); c.fill();
      c.scale(apparent, 1);
      // A narrow broken hull reflection follows the current pose.
      c.globalAlpha = .11; c.save(); c.scale(1, -1); c.drawImage(this.sprites[i], -hullWidth / 2, -116 * scale - 2, hullWidth, 144 * scale); c.restore();
      c.globalAlpha = i === 4 ? .70 : 1; c.drawImage(this.sprites[i], -hullWidth / 2, -116 * scale, hullWidth, 144 * scale);
      for (const spec of PASSENGERS_BY_BOAT[i]) {
        const state = this.session.audience.poses[SEA_PASSENGERS.indexOf(spec)];
        const size = hullWidth / 6 * spec.size, px = spec.x / 6 * hullWidth + spec.z * hullWidth * .03, py = -hullWidth * .105 + spec.z * hullWidth * .06;
        const attended = this.session.audience.feed.targets.find(event => event.id === state.target);
        const glance = attended && !['notice', 'share', 'recover'].includes(state.stage) ? projectBurst(attended.x, attended.y, attended.z) : null;
        const eyeSide = glance ? Math.sign(glance.x - x - px * apparent) : Math.sin(pose.yaw + spec.facing + state.bodyYaw + state.headYaw);
        c.save(); c.translate(px, py);
        c.strokeStyle = spec.trousers; c.lineWidth = Math.max(.8, size * .10); c.lineCap = 'round';
        for (const side of [-1, 1]) { c.beginPath(); c.moveTo(side * size * .06, -size * .17); c.lineTo(side * size * .16, -size * .06); c.lineTo(side * size * .17, size * .07); c.stroke(); }
        c.fillStyle = spec.cloth; c.beginPath(); c.moveTo(-size * .09, -size * .66); c.quadraticCurveTo(-size * .22, -size * .57, -size * .15, -size * .20); c.lineTo(size * .15, -size * .20); c.quadraticCurveTo(size * .22, -size * .57, size * .09, -size * .66); c.closePath(); c.fill();
        if (spec.outfit === 'tunic') { c.fillRect(-size * .17, -size * .26, size * .34, size * .12); }
        if (spec.outfit === 'waistcoat') { c.fillStyle = spec.layer; c.fillRect(-size * .145, -size * .56, size * .12, size * .32); c.fillRect(size * .025, -size * .56, size * .12, size * .32); }
        if (spec.outfit === 'pullover') { c.fillStyle = spec.trim; c.fillRect(-size * .15, -size * .48, size * .30, size * .055); }
        if (focus === i) {
          c.strokeStyle = spec.trim; c.lineWidth = Math.max(.45, size * .014); c.beginPath(); c.moveTo(-size * .07, -size * .66); c.lineTo(0, -size * .60); c.lineTo(size * .07, -size * .66); c.moveTo(0, -size * .60); c.lineTo(0, -size * .27); c.stroke();
          c.fillStyle = spec.trim; for (const by of [.53, .44, .35]) { c.beginPath(); c.arc(0, -size * by, Math.max(.3, size * .013), 0, Math.PI * 2); c.fill(); }
        }
        c.fillStyle = spec.skin; c.beginPath(); c.ellipse(Math.sin(state.headYaw) * size * .035, -size * .86, size * .12, size * .16, -state.headPitch * .25, 0, Math.PI * 2); c.fill();
        c.fillStyle = spec.age === 'older' ? '#b2aa99' : '#302c2b'; c.beginPath(); c.ellipse(0, -size * .96, size * .12, size * .065, 0, Math.PI, Math.PI * 2); c.fill();
        c.strokeStyle = spec.cloth; c.lineWidth = Math.max(.6, size * .09);
        for (const side of [-1, 1]) {
          let hx = side * size * .13, hy = -size * .17;
          if (state.performance === 'clap' && state.stage === 'react') { hx = side * size * (.03 + (1 - state.clap) * .16); hy -= size * .30 * state.gesture; }
          if (state.performance === 'raised-arm' && state.stage === 'react') { hx += side * size * .10 * state.gesture; hy -= size * .72 * state.gesture; }
          const target = this.session.audience.feed.targets.find(event => event.id === state.target);
          if (state.performance === 'point' && side === 1 && target) {
            const burst = projectBurst(target.x, target.y, target.z), dx = (burst.x - x) / apparent - px, dy = burst.y - y - py + size * .52, length = Math.hypot(dx, dy) || 1;
            hx = (hx * (1 - state.gesture)) + dx / length * size * .53 * state.gesture; hy = -size * .52 + dy / length * size * .53 * state.gesture;
          }
          if (spec.rower) { hx = -hullWidth * .24 + (moving ? pose.row : 0) * hullWidth * .02 - px; hy = -hullWidth * .11 + side * hullWidth * .025 - py; }
          c.beginPath(); c.moveTo(side * size * .13, -size * .56); c.lineTo(side * size * .20, (hy - size * .56) * .5); c.lineTo(hx, hy); c.stroke();
          c.fillStyle = spec.skin; c.beginPath(); c.arc(hx, hy, Math.max(.5, size * .035), 0, Math.PI * 2); c.fill();
        }
        c.fillStyle = '#332d2b'; c.beginPath(); c.arc(eyeSide * size * .09, -size * (.88 + state.headPitch * .025), Math.max(.3, size * .014), 0, Math.PI * 2); c.fill(); c.restore();
      }
      if (i === 0 || i === 7) {
        c.strokeStyle = '#ad8960'; c.lineWidth = 1.1;
        for (const side of [-1, 1]) {
          const row = moving ? pose.row : 0, endX = -hullWidth * .18 + row * hullWidth * .09, endY = side * hullWidth * .09 + 1;
          c.beginPath(); c.moveTo(-hullWidth * .24 + row * hullWidth * .02, -hullWidth * .11 + side * hullWidth * .025); c.lineTo(endX, endY); c.stroke();
          if (moving && row < -.2) { c.strokeStyle = '#829dac'; c.beginPath(); c.ellipse(endX, endY, hullWidth * .035, 1, 0, 0, Math.PI * 2); c.stroke(); }
        }
      }
      for (let lamp = 0; lamp < SEA_FLEET[i].lamps; lamp++) {
        const lx = (i === 1 ? 87 + lamp * 87 : 176) * scale - hullWidth / 2, ly = -42 * scale;
        c.globalAlpha = .55; c.fillStyle = '#edbf82'; c.beginPath(); c.ellipse(lx, ly, Math.max(.6, hullWidth * .012), Math.max(.8, hullWidth * .014), 0, 0, Math.PI * 2); c.fill();
        for (let fragment = 0; fragment < 7; fragment++) {
          c.globalAlpha = .23 * (1 - fragment / 7); c.fillStyle = '#bd8c4e';
          c.fillRect(lx + Math.sin(this.session.clock.time * .6 + fragment * 2.39) * (1 + fragment * .15), 2 + fragment * 2, 1.5 + fragment * .25, .65);
        }
      }
      c.restore();
    }
    c.restore();
  }
  diagnostics() { return { seaFleet: 'spark-ten-boat-audience-v002', riverBoats: 10, riverLampAnchors: 13, riverSeatedFigures: 33, seaFleetTime: this.session.clock.time, seaWakeCount: this.wakes.active(this.session.clock.time), seaWakeCapacity: 384, seaPositions: this.positions, riverHullSampleCount: 40, riverPositions: this.positions, riverMotionTime: this.session.clock.time, riverHullSamples: this.session.floats.map(f => ({ height: f.height, pitch: f.pitch, roll: f.roll, centerDeviation: 0 })), waterGains: SEA_WAVE_GAINS, ...this.session.diagnostics() }; }
  dispose() { for (const sprite of this.sprites) sprite.width = sprite.height = 1; this.wakes.reset(); }
}
