/**
 * SceneManager.js - Three.js Scene Setup and Management
 * Handles scene initialization, camera, renderer, and basic lighting
 */

export class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        this.composer = null;
        this.bloomPass = null;
        this.fxaaPass = null;
        this.filmPass = null;
        this.scanlinePass = null;
        this.renderPass = null;
        
        // Interaction state
        this.pointer = { x: 0, y: 0 };
        this.pointerTarget = { x: 0, y: 0 };
        this.currentScrollProgress = 0;
        
        // Performance settings
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Initialize the Three.js scene
     */
    init() {
        this.createScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLighting();
        this.setupPostprocessing();
        this.setupInteractions();
        
        console.log('✅ SceneManager initialized');
        return this;
    }

    /**
     * Create the Three.js scene
     */
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        console.log('✅ Scene created');
    }

    /**
     * Setup camera
     */
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 8);
        console.log('✅ Camera setup complete');
    }

    /**
     * Setup WebGL renderer
     */
    setupRenderer() {
        this.canvas = document.getElementById('three-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        console.log('✅ Renderer setup complete');
    }

    /**
     * Setup basic lighting
     */
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Point light for video glow
        const pointLight = new THREE.PointLight(0x73fbd3, 0.5, 100);
        pointLight.position.set(0, 0, 5);
        this.scene.add(pointLight);
        
        console.log('✅ Lighting setup complete');
    }

    /**
     * Setup post-processing effects
     */
    setupPostprocessing() {
        try {
            this.composer = new THREE.EffectComposer(this.renderer);
            this.renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.composer.addPass(this.renderPass);

            this.bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight), 
                0.8, 0.8, 0.85
            );
            this.composer.addPass(this.bloomPass);

            // Film grain effect
            this.filmPass = new THREE.FilmPass(0.18, 0.35, 512, false);
            this.filmPass.renderToScreen = false;
            this.composer.addPass(this.filmPass);

            // Scanlines effect
            const ScanlineShader = {
                uniforms: { 
                    tDiffuse: { value: null }, 
                    opacity: { value: 0.07 }, 
                    density: { value: 2.0 } 
                },
                vertexShader: `
                    varying vec2 vUv; 
                    void main(){ 
                        vUv=uv; 
                        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); 
                    }
                `,
                fragmentShader: `
                    uniform sampler2D tDiffuse; 
                    uniform float opacity; 
                    uniform float density; 
                    varying vec2 vUv; 
                    void main(){ 
                        vec4 c = texture2D(tDiffuse, vUv); 
                        float s = sin(vUv.y * 3.14159 * 100.0 * density) * 0.5 + 0.5; 
                        c.rgb *= mix(1.0, 0.96, s*opacity); 
                        gl_FragColor = c; 
                    }
                `
            };
            this.scanlinePass = new THREE.ShaderPass(ScanlineShader);
            this.composer.addPass(this.scanlinePass);

            // FXAA anti-aliasing
            this.fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
            this.fxaaPass.material.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
            this.composer.addPass(this.fxaaPass);
            
            console.log('✅ Postprocessing setup complete');
        } catch (error) {
            console.warn('Postprocessing setup failed, falling back to basic rendering:', error);
            this.composer = null;
        }
    }

    /**
     * Setup mouse interactions
     */
    setupInteractions() {
        window.addEventListener('mousemove', (e) => {
            const nx = (e.clientX / window.innerWidth) * 2 - 1;
            const ny = (e.clientY / window.innerHeight) * 2 - 1;
            this.pointerTarget.x = nx;
            this.pointerTarget.y = ny;
        });

        // Prepare/resume audio context on user gesture
        window.addEventListener('click', () => {
            // This will be handled by AudioManager
        });
    }

    /**
     * Update camera based on scroll and mouse
     */
    updateCamera(time) {
        // Easing for pointer parallax
        this.pointer.x += (this.pointerTarget.x - this.pointer.x) * 0.07;
        this.pointer.y += (this.pointerTarget.y - this.pointer.y) * 0.07;
        
        // Parallax camera tilt
        this.camera.rotation.x = THREE.MathUtils.degToRad(this.pointer.y * -3);
        this.camera.rotation.y = THREE.MathUtils.degToRad(this.pointer.x * 3);
        this.camera.position.x = Math.sin(time * 0.1) * 0.1 + this.pointer.x * 0.25;
        this.camera.position.y = Math.cos(time * 0.15) * 0.05 + this.pointer.y * 0.15;
        
        // Scroll-driven dolly
        this.camera.position.z = 8 - this.currentScrollProgress * 10;
    }

    /**
     * Update scroll progress
     */
    updateScrollProgress(scrollProgress) {
        this.currentScrollProgress = scrollProgress;
    }

    /**
     * Render the scene
     */
    render() {
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            
            if (this.composer) {
                this.composer.setSize(window.innerWidth, window.innerHeight);
            }
            
            if (this.fxaaPass) {
                this.fxaaPass.material.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
            }
        }
    }

    /**
     * Get scene reference
     */
    getScene() {
        return this.scene;
    }

    /**
     * Get camera reference
     */
    getCamera() {
        return this.camera;
    }

    /**
     * Get renderer reference
     */
    getRenderer() {
        return this.renderer;
    }

    /**
     * Get composer reference
     */
    getComposer() {
        return this.composer;
    }

    /**
     * Get bloom pass for audio reactivity
     */
    getBloomPass() {
        return this.bloomPass;
    }
}
