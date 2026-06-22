import * as THREE from 'three';
import {
  step, normalWorldGeometry, output, texture, vec3, vec4,
  normalize, positionWorld, bumpMap, cameraPosition, color,
  uniform, mix, uv, max
} from 'three/tsl';

export class EarthGlobe {
  constructor(canvas, { autoRotateSpeed = 0.025 } = {}) {
    this._cv    = canvas;
    this._speed = autoRotateSpeed;
    this._tiltX = 0;
    this._tiltZ = 0;
    this.supported = false;
  }

  async init() {
    const w = this._cv.clientWidth  || 800;
    const h = this._cv.clientHeight || 600;

    this._renderer = new THREE.WebGPURenderer({ canvas: this._cv, antialias: true, alpha: true });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(w, h, false);

    try { await this._renderer.init(); }
    catch { return this; }

    this.supported  = true;
    this._scene     = new THREE.Scene();
    this._camera    = new THREE.PerspectiveCamera(25, w / h, 0.1, 100);
    this._camera.position.set(0, 0, 4.5);

    const sun = new THREE.DirectionalLight('#ffffff', 2);
    sun.position.set(0, 0, 3);
    this._scene.add(sun);

    const atmDay      = uniform(color('#4db2ff'));
    const atmTwilight = uniform(color('#bc490b'));
    const roughLow    = uniform(0.25);
    const roughHigh   = uniform(0.35);

    const loader = new THREE.TextureLoader();
    const [dayTex, nightTex, bumpTex] = await Promise.all([
      this._loadTex(loader, '/textures/earth_day_4096.jpg',                   true),
      this._loadTex(loader, '/textures/earth_night_4096.jpg',                 true),
      this._loadTex(loader, '/textures/earth_bump_roughness_clouds_4096.jpg', false),
    ]);

    const viewDir   = positionWorld.sub(cameraPosition).normalize();
    const fresnel   = viewDir.dot(normalWorldGeometry).abs().oneMinus().toVar();
    const sunOrient = normalWorldGeometry.dot(normalize(sun.position)).toVar();
    const atmColor  = mix(atmTwilight, atmDay, sunOrient.smoothstep(-0.25, 0.75));

    const mat       = new THREE.MeshStandardNodeMaterial();
    const cloudsStr = texture(bumpTex, uv()).b.smoothstep(0.2, 1);
    mat.colorNode   = mix(texture(dayTex), vec3(1), cloudsStr.mul(2));
    const rough     = max(texture(bumpTex).g, step(0.01, cloudsStr));
    mat.roughnessNode = rough.remap(0, 1, roughLow, roughHigh);

    const night      = texture(nightTex);
    const dayStr     = sunOrient.smoothstep(-0.25, 0.5);
    const atmDayStr  = sunOrient.smoothstep(-0.5, 1);
    const atmMix     = atmDayStr.mul(fresnel.pow(2)).clamp(0, 1);
    let   finalOut   = mix(night.rgb, output.rgb, dayStr);
    finalOut         = mix(finalOut, atmColor, atmMix);
    mat.outputNode   = vec4(finalOut, output.a);
    mat.normalNode   = bumpMap(max(texture(bumpTex).r, cloudsStr));

    const geo    = new THREE.SphereGeometry(1, 64, 64);
    this._globe  = new THREE.Mesh(geo, mat);

    const atmMat  = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, transparent: true });
    const alpha   = fresnel.remap(0.73, 1, 1, 0).pow(3).mul(sunOrient.smoothstep(-0.5, 1));
    atmMat.outputNode = vec4(atmColor, alpha);
    const atm = new THREE.Mesh(geo, atmMat);
    atm.scale.setScalar(1.04);

    // Tilt group separates parallax rotation from auto-rotation
    this._tiltGroup = new THREE.Group();
    this._tiltGroup.add(this._globe, atm);
    this._scene.add(this._tiltGroup);

    this._timer = new THREE.Timer();
    return this;
  }

  _loadTex(loader, url, srgb) {
    return new Promise((resolve, reject) => {
      loader.load(url, t => {
        if (srgb) t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        resolve(t);
      }, undefined, reject);
    });
  }

  start() {
    if (!this.supported) return this;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._autoRotate = !reduced;
    this._renderer.setAnimationLoop(() => this._tick());
    return this;
  }

  stop() {
    this._renderer?.setAnimationLoop(null);
    return this;
  }

  // relX/relY in -0.5..0.5 (cursor offset from element center)
  setParallax(relX, relY) {
    this._tiltX =  relY * 0.3;
    this._tiltZ = -relX * 0.3;
  }

  resetParallax() {
    this._tiltX = 0;
    this._tiltZ = 0;
  }

  resize() {
    if (!this._renderer || !this._camera) return;
    const w = this._cv.clientWidth, h = this._cv.clientHeight;
    if (!w || !h) return;
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(w, h, false);
  }

  dispose() {
    this.stop();
    this._renderer?.dispose();
  }

  _tick() {
    this._timer.update();
    const d = this._timer.getDelta();
    if (this._autoRotate) this._globe.rotation.y += d * this._speed;
    this._tiltGroup.rotation.x += (this._tiltX - this._tiltGroup.rotation.x) * 0.08;
    this._tiltGroup.rotation.z += (this._tiltZ - this._tiltGroup.rotation.z) * 0.08;
    this._renderer.render(this._scene, this._camera);
  }
}
