/**
 * main.js - Main Application Orchestrator
 * Coordinates all modules and manages the overall application flow
 */

// Import core modules
import { SceneManager } from './core/SceneManager.js';
import { AudioManager } from './core/AudioManager.js';
import { ScrollManager } from './core/ScrollManager.js';

// Import component modules
import { VideoPlayer } from './components/VideoPlayer.js';
import { TypewriterEffect } from './components/TypewriterEffect.js';
import { HamburgerMenu } from './components/HamburgerMenu.js';
import { IntroModal } from './components/IntroModal.js';

// Import Three.js modules
import { Models } from './three/Models.js';
import { Effects } from './three/Effects.js';

/**
 * Main Application Class
 */
class App {
    constructor() {
        // Core managers
        this.sceneManager = null;
        this.audioManager = null;
        this.scrollManager = null;
        
        // Components
        this.videoPlayer = null;
        this.typewriterEffect = null;
        this.hamburgerMenu = null;
        this.introModal = null;
        
        // Three.js modules
        this.models = null;
        this.effects = null;
        
        // Additional video elements
        this.a1VideoElement = null;
        this.emVideoElement = null;
        
        // Animation state
        this.isAnimating = false;
        this.clock = new THREE.Clock();
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 Starting modular AI experience...');
        
        try {
            // Initialize core managers
            this.sceneManager = new SceneManager().init();
            this.audioManager = new AudioManager().init();
            this.scrollManager = new ScrollManager().init();
            
            // Initialize components
            this.videoPlayer = new VideoPlayer(this.sceneManager.getScene(), this.audioManager).init();
            this.typewriterEffect = new TypewriterEffect().init();
            this.hamburgerMenu = new HamburgerMenu().init();
            this.introModal = new IntroModal(this.audioManager, () => {
                // Show video immediately when user hits Enter (like desktop)
                this.videoPlayer.showImmediately();
            }).init();
            
            // Initialize Three.js modules
            this.models = new Models(this.sceneManager.getScene()).init();
            this.effects = new Effects(this.sceneManager.getScene()).init();
            
            // Setup additional video elements
            this.setupAdditionalVideos();
            
            // Setup scroll callbacks
            this.setupScrollCallbacks();
            
            // Setup window resize handler
            this.setupResizeHandler();
            
            // Setup click handler for shockwaves
            this.setupClickHandler();
            
            // Start animation loop
            this.startAnimation();
            
            console.log('✅ Modular AI experience ready!');
            
        } catch (error) {
            console.error('❌ Error initializing application:', error);
        }
    }

    /**
     * Setup additional video elements (A1 and EM videos)
     */
    setupAdditionalVideos() {
        // Create A1 video element
        this.a1VideoElement = document.createElement('video');
        this.a1VideoElement.src = 'assets/a1.mp4';
        this.a1VideoElement.crossOrigin = 'anonymous';
        this.a1VideoElement.loop = true;
        this.a1VideoElement.muted = false;
        this.a1VideoElement.volume = 0.8;
        this.a1VideoElement.playsInline = true;

        // Video styling for mobile
        this.a1VideoElement.style.position = 'fixed';
        this.a1VideoElement.style.top = '50%';
        this.a1VideoElement.style.left = '50%';
        this.a1VideoElement.style.transform = 'translate(-50%, -50%)';
        this.a1VideoElement.style.width = 'min(80vw, 400px)';
        this.a1VideoElement.style.height = 'auto';
        this.a1VideoElement.style.zIndex = '1002';
        this.a1VideoElement.style.borderRadius = '20px';
        this.a1VideoElement.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
        this.a1VideoElement.style.opacity = '0';
        this.a1VideoElement.style.transition = 'opacity 1s ease-in-out';
        this.a1VideoElement.style.pointerEvents = 'none';

        document.body.appendChild(this.a1VideoElement);

        // Create EM video element
        this.emVideoElement = document.createElement('video');
        this.emVideoElement.src = 'assets/em.mp4';
        this.emVideoElement.crossOrigin = 'anonymous';
        this.emVideoElement.loop = true;
        this.emVideoElement.muted = true;
        this.emVideoElement.volume = 0.8;
        this.emVideoElement.playsInline = true;

        // Video styling
        this.emVideoElement.style.position = 'relative';
        this.emVideoElement.style.width = '100%';
        this.emVideoElement.style.maxWidth = window.innerWidth <= 768 ? '400px' : '500px';
        this.emVideoElement.style.height = 'auto';
        this.emVideoElement.style.margin = '0 auto';
        this.emVideoElement.style.display = 'block';
        this.emVideoElement.style.borderRadius = '15px';
        this.emVideoElement.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
        this.emVideoElement.style.opacity = '0';
        this.emVideoElement.style.transition = 'opacity 1s ease-in-out';
        this.emVideoElement.style.pointerEvents = 'none';
        
        // Add to mobile container
        const mobileContainer = document.getElementById('mobile-video-container');
        if (mobileContainer) {
            mobileContainer.appendChild(this.emVideoElement);
        } else {
            document.body.appendChild(this.emVideoElement);
        }

        // Set video elements in audio manager
        this.audioManager.setVideoElements(
            this.videoPlayer.getVideo(),
            this.a1VideoElement,
            this.emVideoElement,
            this.videoPlayer.getMobileVideo()
        );

        console.log('✅ Additional video elements created');
    }

    /**
     * Setup scroll callbacks
     */
    setupScrollCallbacks() {
        // Video state changes
        this.scrollManager.on('onVideoStateChange', (data) => {
            this.videoPlayer.updateVisibility(data.visible);
        });

        // Typewriter state changes
        this.scrollManager.on('onTypewriterStateChange', (data) => {
            if (data.visible && !this.typewriterEffect.isTypewriterVisible()) {
                this.typewriterEffect.showGlitchText('and the occasional A1...');
            } else if (!data.visible && this.typewriterEffect.isTypewriterVisible()) {
                this.typewriterEffect.hide();
            }
        });

        // A1 video state changes
        this.scrollManager.on('onA1VideoStateChange', (data) => {
            if (data.visible && this.a1VideoElement.style.opacity === '0') {
                this.a1VideoElement.style.opacity = '1';
                this.a1VideoElement.style.transition = 'none';
                this.audioManager.applyAudioState();
                this.a1VideoElement.play().catch(console.log);
                console.log('Starting A1 video!');
            } else if (!data.visible && this.a1VideoElement.style.opacity === '1') {
                this.a1VideoElement.style.transition = 'none';
                this.a1VideoElement.style.opacity = '0';
                this.a1VideoElement.pause();
                this.a1VideoElement.currentTime = 0;
                // Mute audio when hiding
                this.a1VideoElement.muted = true;
                this.a1VideoElement.volume = 0;
            }
        });

        // Goku state changes
        this.scrollManager.on('onGokuStateChange', (data) => {
            if (data.visible) {
                this.models.showGoku();
            } else {
                this.models.hideGoku();
            }
        });

        // Spaghetti state changes
        this.scrollManager.on('onSpaghettiStateChange', (data) => {
            if (data.visible) {
                this.models.showSpaghetti();
                if (this.emVideoElement.style.opacity === '0') {
                    this.emVideoElement.style.opacity = '1';
                    this.audioManager.applyAudioState();
                    this.emVideoElement.play().catch(console.log);
                    console.log('🎬 EM video appears!');
                }
            } else {
                this.models.hideSpaghetti();
                if (this.emVideoElement.style.opacity === '1') {
                    this.emVideoElement.style.opacity = '0';
                    this.emVideoElement.pause();
                    this.emVideoElement.currentTime = 0;
                    // Mute audio when hiding
                    this.emVideoElement.muted = true;
                    this.emVideoElement.volume = 0;
                }
            }
        });

        // Scroll progress updates
        this.scrollManager.on('onScrollProgress', (progress) => {
            this.sceneManager.updateScrollProgress(progress);
        });
    }

    /**
     * Setup window resize handler
     */
    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.sceneManager.handleResize();
            this.videoPlayer.handleResize();
        });
    }

    /**
     * Setup click handler for shockwaves
     */
    setupClickHandler() {
        window.addEventListener('click', () => {
            // Resume audio context
            if (this.audioManager.audioContext && this.audioManager.audioContext.state === 'suspended') {
                this.audioManager.audioContext.resume();
            }
            
            // Create shockwave
            this.effects.createClickShockwave();
        });
    }

    /**
     * Start animation loop
     */
    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        const animate = () => {
            if (!this.isAnimating) return;
            
            const time = this.clock.getElapsedTime();
            
            // Update scene manager
            this.sceneManager.updateCamera(time);
            
            // Animate video player
            this.videoPlayer.animate(time);
            
            // Animate models
            this.models.animate(time);
            
            // Animate effects
            this.effects.animate(time, this.sceneManager.pointer);
            
            // Audio reactive bloom
            this.updateAudioReactiveBloom();
            
            // Render scene
            this.sceneManager.render();
            
            requestAnimationFrame(animate);
        };
        
        animate();
        console.log('✅ Animation loop started');
    }

    /**
     * Update audio reactive bloom
     */
    updateAudioReactiveBloom() {
        const bloomPass = this.sceneManager.getBloomPass();
        if (bloomPass && this.audioManager.isReady()) {
            const audioLevel = this.audioManager.getAverageAudioLevel();
            const intensity = 0.7 + (audioLevel / 255) * 0.9;
            bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, intensity, 0.15);
        }
    }

    /**
     * Stop animation loop
     */
    stopAnimation() {
        this.isAnimating = false;
        console.log('⏹️ Animation loop stopped');
    }

    /**
     * Get scene manager
     */
    getSceneManager() {
        return this.sceneManager;
    }

    /**
     * Get audio manager
     */
    getAudioManager() {
        return this.audioManager;
    }

    /**
     * Get scroll manager
     */
    getScrollManager() {
        return this.scrollManager;
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Prevent browser from restoring scroll position
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    
    // Reset scroll position to top on page load/refresh
    window.scrollTo(0, 0);
    
    const app = new App();
    app.init();
    
    // Make app globally available for debugging
    window.app = app;
});
