/**
 * experience-main.js - Experience Page Main
 * Handles the experience page with its own Three.js scene
 */

// Import Three.js modules
import * as THREE from 'https://esm.sh/three@0.159.0';
import { EffectComposer } from 'https://esm.sh/three@0.159.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.159.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.159.0/examples/jsm/postprocessing/UnrealBloomPass.js';

/**
 * Experience Page Application
 */
class ExperienceApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        this.composer = null;
        this.bloomPass = null;
        this.particles = null;
        this.particleSystem = null;
        this.particleCount = 0;
        this.particlePositions = null;
        this.particleVelocities = null;
        this.pointer = { x: 0, y: 0 };
        this.targetRotX = 0;
        this.targetRotY = 0;
        this.scrollProgress = 0;
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.isAnimating = false;
        this.clock = new THREE.Clock();
    }

    /**
     * Initialize the experience page
     */
    init() {
        console.log('🚀 Starting experience page...');
        
        if (!this.isWebGLAvailable()) {
            this.showFallback();
            return;
        }
        
        this.createScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLighting();
        this.createParticles();
        this.setupPostprocessing();
        this.setupInteractions();
        this.setupScrollHandling();
        this.createFloatingParticles();
        this.startAnimation();
        
        console.log('✅ Experience page ready!');
    }

    /**
     * Create Three.js scene
     */
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a0b12, 0.045);
        console.log('✅ Scene created');
    }

    /**
     * Setup camera
     */
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 300);
        this.camera.position.set(0, 0, 10);
        console.log('✅ Camera setup complete');
    }

    /**
     * Setup WebGL renderer
     */
    setupRenderer() {
        this.canvas = document.getElementById('webgl-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true, 
            powerPreference: 'high-performance' 
        });
        const pixelRatio = Math.min(window.devicePixelRatio, 1.6);
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 1);
        console.log('✅ Renderer setup complete');
    }

    /**
     * Setup lighting
     */
    setupLighting() {
        const ambient = new THREE.AmbientLight(0x8e96bf, 0.30);
        this.scene.add(ambient);
        
        const dir = new THREE.DirectionalLight(0x9fa7e8, 0.85);
        dir.position.set(-2.2, 3.8, 2.6);
        this.scene.add(dir);
        
        const rim = new THREE.DirectionalLight(0x73fbd3, 0.25);
        rim.position.set(2.5, -1.5, -2.8);
        this.scene.add(rim);
        console.log('✅ Lighting setup complete');
    }

    /**
     * Create floating particles
     */
    createParticles() {
        this.particleCount = this.prefersReducedMotion ? 50 : 200;
        this.particles = new THREE.BufferGeometry();
        this.particlePositions = new Float32Array(this.particleCount * 3);
        this.particleVelocities = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            this.particlePositions[i3] = (Math.random() - 0.5) * 20;
            this.particlePositions[i3 + 1] = (Math.random() - 0.5) * 20;
            this.particlePositions[i3 + 2] = (Math.random() - 0.5) * 20;
            this.particleVelocities[i3] = (Math.random() - 0.5) * 0.02;
            this.particleVelocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
            this.particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
        }

        this.particles.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            color: 0x73fbd3,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        this.particleSystem = new THREE.Points(this.particles, particleMaterial);
        this.scene.add(this.particleSystem);
        console.log('✅ Particles created');
    }

    /**
     * Setup post-processing
     */
    setupPostprocessing() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.0, 0.8, 0.85
        );
        this.bloomPass.threshold = 0.0;
        this.bloomPass.strength = 0.3;
        this.bloomPass.radius = 0.45;
        this.composer.addPass(this.bloomPass);
        console.log('✅ Postprocessing setup complete');
    }

    /**
     * Setup interactions
     */
    setupInteractions() {
        window.addEventListener('pointermove', (e) => {
            this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.targetRotX = this.pointer.y * 0.1;
            this.targetRotY = this.pointer.x * 0.1;
        });
        console.log('✅ Interactions setup complete');
    }

    /**
     * Setup scroll handling
     */
    setupScrollHandling() {
        const updateScrollProgress = () => {
            const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            this.scrollProgress = Math.min(1, Math.max(0, (window.scrollY || window.pageYOffset) / maxScroll));
        };
        
        window.addEventListener('scroll', updateScrollProgress);
        updateScrollProgress();
        
        // Intersection Observer for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.experience-section, .stats-section').forEach(section => {
            observer.observe(section);
        });
        
        console.log('✅ Scroll handling setup complete');
    }

    /**
     * Create floating particles for overlay
     */
    createFloatingParticles() {
        const overlay = document.getElementById('particles-overlay');
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (6 + Math.random() * 4) + 's';
            overlay.appendChild(particle);
        }
        console.log('✅ Floating particles created');
    }

    /**
     * Start animation loop
     */
    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.canvas.classList.add('loaded');
        
        const animate = () => {
            if (!this.isAnimating) return;
            
            const t = this.clock.getElapsedTime();

            // Rotate particle system
            if (!this.prefersReducedMotion) {
                this.particleSystem.rotation.y += 0.001;
                this.particleSystem.rotation.x += (this.targetRotX - this.particleSystem.rotation.x) * 0.02;
                this.particleSystem.rotation.y += (this.targetRotY - this.particleSystem.rotation.y) * 0.02;
            }

            // Update particles
            if (!this.prefersReducedMotion) {
                const positions = this.particles.attributes.position.array;
                for (let i = 0; i < this.particleCount; i++) {
                    const i3 = i * 3;
                    positions[i3] += this.particleVelocities[i3];
                    positions[i3 + 1] += this.particleVelocities[i3 + 1];
                    positions[i3 + 2] += this.particleVelocities[i3 + 2];

                    // Wrap around
                    if (positions[i3] > 10) positions[i3] = -10;
                    if (positions[i3] < -10) positions[i3] = 10;
                    if (positions[i3 + 1] > 10) positions[i3 + 1] = -10;
                    if (positions[i3 + 1] < -10) positions[i3 + 1] = 10;
                    if (positions[i3 + 2] > 10) positions[i3 + 2] = -10;
                    if (positions[i3 + 2] < -10) positions[i3 + 2] = 10;
                }
                this.particles.attributes.position.needsUpdate = true;
            }

            // Update camera based on scroll
            this.camera.position.z = 10 - this.scrollProgress * 3;
            this.camera.position.y = this.scrollProgress * 2;

            // Update bloom based on scroll
            this.bloomPass.strength = 0.2 + this.scrollProgress * 0.3;

            this.composer.render();
            requestAnimationFrame(animate);
        };
        
        animate();
        console.log('✅ Animation loop started');
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Check WebGL availability
     */
    isWebGLAvailable() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    /**
     * Show fallback background
     */
    showFallback() {
        document.body.style.background = '#000000';
        this.canvas.style.display = 'none';
        console.log('⚠️ WebGL not available, showing fallback');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new ExperienceApp();
    app.init();
    
    // Handle resize
    window.addEventListener('resize', () => {
        app.handleResize();
    });
    
    // Make app globally available for debugging
    window.experienceApp = app;
});
