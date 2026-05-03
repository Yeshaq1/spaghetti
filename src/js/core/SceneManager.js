export class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        this.composer = null;
        this.renderPass = null;
        this.bloomPass = null;
        this.fxaaPass = null;
        this.pointer = { x: 0, y: 0 };
        this.pointerTarget = { x: 0, y: 0 };
        this.currentScrollProgress = 0;
        this.visualScrollProgress = 0;
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    init() {
        this.createScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLighting();
        this.setupPostprocessing();
        this.setupInteractions();
        return this;
    }

    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.FogExp2(0x050505, 0.0115);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 300);
        this.camera.position.set(0, 0, 10.5);
    }

    setupRenderer() {
        this.canvas = document.getElementById('three-canvas');
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.18;
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xfff1db, 0.58);
        this.scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffedd2, 1.18);
        keyLight.position.set(-4, 8, 7);
        this.scene.add(keyLight);

        const rimLight = new THREE.PointLight(0xffe7c5, 0.98, 82);
        rimLight.position.set(8, -3, 10);
        this.scene.add(rimLight);

        const coreLight = new THREE.PointLight(0xffebcb, 0.78, 32);
        coreLight.position.set(4.5, 0, 2);
        this.scene.add(coreLight);

        const fillLight = new THREE.PointLight(0xffe6bf, 0.52, 64);
        fillLight.position.set(-7, 1, 8);
        this.scene.add(fillLight);
    }

    setupPostprocessing() {
        if (this.prefersReducedMotion || !THREE.EffectComposer) {
            this.composer = null;
            return;
        }

        try {
            this.composer = new THREE.EffectComposer(this.renderer);
            this.renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.composer.addPass(this.renderPass);

            this.bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.16,
                0.3,
                0.94
            );
            this.composer.addPass(this.bloomPass);

            if (THREE.FXAAShader) {
                this.fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
                this.fxaaPass.material.uniforms.resolution.value.set(1 / window.innerWidth, 1 / window.innerHeight);
                this.composer.addPass(this.fxaaPass);
            }
        } catch (error) {
            console.warn('Postprocessing unavailable, using direct rendering.', error);
            this.composer = null;
        }
    }

    setupInteractions() {
        window.addEventListener('mousemove', (event) => {
            this.pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.pointerTarget.y = (event.clientY / window.innerHeight) * 2 - 1;
        });
    }

    updateCamera(time) {
        const pointerEase = this.prefersReducedMotion ? 0.02 : 0.06;
        this.pointer.x += (this.pointerTarget.x - this.pointer.x) * pointerEase;
        this.pointer.y += (this.pointerTarget.y - this.pointer.y) * pointerEase;
        this.visualScrollProgress += (this.currentScrollProgress - this.visualScrollProgress) * 0.045;

        const scroll = this.getNarrativeProgress(this.visualScrollProgress);
        const drift = this.prefersReducedMotion ? 0 : 1;
        const isMobile = window.innerWidth < 820;
        const isHeroMobile = window.innerWidth < 720;
        const baseCamX = isHeroMobile ? 0 : isMobile ? 0.08 : 0.12;

        this.camera.position.x = baseCamX - scroll * 0.42 + this.pointer.x * 0.26 + Math.sin(time * 0.12) * 0.08 * drift;
        this.camera.position.y = 0.02 - scroll * 0.08 + this.pointer.y * 0.18 + Math.cos(time * 0.1) * 0.05 * drift;
        this.camera.position.z = 10.7 - scroll * 1.3;
        this.camera.rotation.x = THREE.MathUtils.degToRad(this.pointer.y * -1.2 - scroll * 0.45);
        this.camera.rotation.y = THREE.MathUtils.degToRad(this.pointer.x * 1.35 - scroll * 1.05);
    }

    updateScrollProgress(scrollProgress) {
        this.currentScrollProgress = scrollProgress;
    }

    getNarrativeProgress(progress) {
        const clamped = THREE.MathUtils.clamp(progress, 0, 1);
        return clamped * clamped * (3 - 2 * clamped);
    }

    render() {
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    handleResize() {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }

        if (this.fxaaPass) {
            this.fxaaPass.material.uniforms.resolution.value.set(1 / window.innerWidth, 1 / window.innerHeight);
        }
    }

    getScene() {
        return this.scene;
    }
}
