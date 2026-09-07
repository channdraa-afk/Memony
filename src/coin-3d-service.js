/**
 * Memony 3D Royal Coin Engine (Three.js WebGL)
 * -------------------------------------------------------------
 * Terinspirasi dari estetika interaktif Charles Leclerc & luxury kinetic web.
 * Merender Koin Emas Kerajaan 3D secara prosedural dengan pencahayaan PBR,
 * interaksi parallax inersia kursor mouse, dan animasi lempar koin (flip on click).
 */

class Coin3DService {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.coinMesh = null;
    this.pointLight = null;

    // Mouse Tracking & Inertia
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetRotX = 0;
    this.targetRotY = 0;

    // Coin Flip Physics State
    this.isFlipping = false;
    this.flipProgress = 0;
    this.coinBaseY = 0;

    this.animationFrameId = null;
    this.isInitialized = false;
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container || typeof THREE === "undefined") {
      console.warn("Coin3DService: Container atau Three.js belum siap.");
      return;
    }

    const width = this.container.clientWidth || 260;
    const height = this.container.clientHeight || 260;

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 8.5);

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 3. Studio Lighting (Warm Studio Modern)
    this._setupLighting();

    // 4. Procedural 3D Coin Mesh
    this._createProceduralCoin();

    // 5. Event Listeners
    this._setupEvents();

    // 6. Start Render Loop
    this.isInitialized = true;
    this._animate();
  }

  _setupLighting() {
    // Ambient hangat dan merata
    const ambientLight = new THREE.AmbientLight(0xfffaed, 1.6);
    this.scene.add(ambientLight);

    // Key Light Studio lembut dari kiri atas
    const keyLight = new THREE.DirectionalLight(0xfff5dd, 1.4);
    keyLight.position.set(4, 6, 4);
    this.scene.add(keyLight);

    // Fill Light lembut dari kanan bawah untuk mengisi bayangan tanpa hotspot
    const fillLight = new THREE.DirectionalLight(0xe5d7b5, 1.0);
    fillLight.position.set(-4, -4, 3);
    this.scene.add(fillLight);

    // Rim Light Emas dari belakang untuk aksen kontur tepi koin
    const rimLight = new THREE.DirectionalLight(0xc99738, 1.2);
    rimLight.position.set(0, 5, -4);
    this.scene.add(rimLight);
  }

  _createProceduralCoin() {
    const frontTexture = this._generateFaceTexture("MEMONY", "🪙", "ROYAL VAULT");
    const backTexture = this._generateFaceTexture("1 COIN", "👑", "EST. 2026");
    const edgeTexture = this._generateEdgeTexture();

    // Material Emas Satin Mewah (Bebas Hotspot Silau)
    const goldMaterialProps = {
      color: 0xdeb043,
      metalness: 0.65,
      roughness: 0.45
    };

    const frontMaterial = new THREE.MeshStandardMaterial({
      ...goldMaterialProps,
      map: frontTexture
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      ...goldMaterialProps,
      map: backTexture
    });

    const edgeMaterial = new THREE.MeshStandardMaterial({
      ...goldMaterialProps,
      bumpMap: edgeTexture,
      bumpScale: 0.05
    });

    const coinGeometry = new THREE.CylinderGeometry(2.4, 2.4, 0.32, 64);
    this.coinMesh = new THREE.Mesh(coinGeometry, [edgeMaterial, frontMaterial, backMaterial]);
    
    this.coinMesh.rotation.x = Math.PI / 2;
    this.coinBaseY = 0;
    this.scene.add(this.coinMesh);
  }

  _generateFaceTexture(title, icon, subtitle) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 256);
    grad.addColorStop(0, "#ffe899");
    grad.addColorStop(0.7, "#d49b28");
    grad.addColorStop(1, "#8f620e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = "#ffeec2";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(256, 256, 230, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#7a5108";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 212, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#fff4d4";
    const totalDots = 36;
    for (let i = 0; i < totalDots; i++) {
      const angle = (i / totalDots) * Math.PI * 2;
      const x = 256 + Math.cos(angle) * 221;
      const y = 256 + Math.sin(angle) * 221;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = "88px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icon, 256, 210);

    ctx.fillStyle = "#4a3104";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText(title, 256, 310);

    ctx.fillStyle = "#69480a";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(subtitle, 256, 355);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    return texture;
  }

  _generateEdgeTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#b8861d";
    ctx.fillRect(0, 0, 512, 64);

    ctx.fillStyle = "#ffe599";
    for (let x = 0; x < 512; x += 8) {
      ctx.fillRect(x, 0, 4, 64);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 1);
    return texture;
  }

  _setupEvents() {
    window.addEventListener("mousemove", (e) => {
      const { innerWidth, innerHeight } = window;
      this.mouseX = (e.clientX / innerWidth) * 2 - 1;
      this.mouseY = -(e.clientY / innerHeight) * 2 + 1;

      this.targetRotY = this.mouseX * 0.75;
      this.targetRotX = (Math.PI / 2) - this.mouseY * 0.55;
    });

    this.container.addEventListener("click", () => {
      this.flipCoin();
    });

    this.container.addEventListener("touchstart", () => {
      this.flipCoin();
    }, { passive: true });

    window.addEventListener("resize", () => {
      this.resize();
    });
  }

  resize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || 260;
    const height = this.container.clientHeight || 260;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  flipCoin() {
    if (this.isFlipping) return;
    this.isFlipping = true;
    this.flipProgress = 0;

    if (window.audioService && window.audioService.playCoinChime) {
      window.audioService.playCoinChime();
    }
  }

  _animate() {
    this.animationFrameId = requestAnimationFrame(() => this._animate());

    if (!this.coinMesh) return;

    if (this.isFlipping) {
      this.flipProgress += 0.035;
      const t = this.flipProgress;

      this.coinMesh.position.y = Math.sin(t * Math.PI) * 2.4;
      this.coinMesh.rotation.x += 0.35;
      this.coinMesh.rotation.z += 0.08;

      if (t >= 1) {
        this.isFlipping = false;
        this.coinMesh.position.y = this.coinBaseY;
        if (window.audioService && window.audioService.playRegisterDing) {
          window.audioService.playRegisterDing();
        }
      }
    } else {
      this.coinMesh.rotation.x += (this.targetRotX - this.coinMesh.rotation.x) * 0.08;
      this.coinMesh.rotation.y += (this.targetRotY - this.coinMesh.rotation.y) * 0.08;
      
      const time = performance.now() * 0.0015;
      this.coinMesh.position.y = Math.sin(time) * 0.12;
      this.coinMesh.rotation.z = Math.sin(time * 0.8) * 0.04;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.coin3dService = new Coin3DService();
