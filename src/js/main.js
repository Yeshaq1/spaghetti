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
import { HamburgerMenu } from './components/HamburgerMenu.js';
import { IntroModal } from './components/IntroModal.js';
import { WebRTCCall } from './components/WebRTCCall.js';

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
        this.hamburgerMenu = null;
        this.introModal = null;
        this.webRTCCall = null;
        
        // Three.js modules
        this.models = null;
        this.effects = null;
        
        // Additional video elements
        this.emVideoElement = null;
        
        // Animation state
        this.isAnimating = false;
        this.clock = new THREE.Clock();
    }

    /**
     * Initialize the application
     */
    async init() {
        
        try {
            // Initialize core managers
            this.sceneManager = new SceneManager().init();
            this.audioManager = new AudioManager().init();
            this.scrollManager = new ScrollManager().init();
            
            // Initialize components
            this.videoPlayer = new VideoPlayer(this.sceneManager.getScene(), this.audioManager).init();
            this.hamburgerMenu = new HamburgerMenu().init();
            this.introModal = new IntroModal(this.audioManager).init();
            this.webRTCCall = new WebRTCCall().init();
            
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
            
            // Setup WebRTC call buttons
            this.setupWebRTCCallButtons();
            
            // Start animation loop
            this.startAnimation();
            
            
        } catch (error) {
            console.error('❌ Error initializing application:', error);
        }
    }

    /**
     * Setup additional video elements (EM video)
     */
    setupAdditionalVideos() {
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
            this.emVideoElement,
            this.videoPlayer.getMobileVideo()
        );

    }

    /**
     * Setup scroll callbacks
     */
    setupScrollCallbacks() {
        // Video state changes - use direct control like EM videos
        this.scrollManager.on('onVideoStateChange', (data) => {
            // Handle desktop WebGL video
            if (this.videoPlayer.videoPlane && this.videoPlayer.videoPlane.material) {
                this.videoPlayer.videoPlane.material.opacity = data.visible ? 1 : 0;
                
                // Also control the underlying video element's audio
                const desktopVideo = this.videoPlayer.getVideo();
                if (desktopVideo) {
                    if (data.visible) {
                        desktopVideo.play().catch(() => {});
                        this.audioManager.applyAudioState();
                    } else {
                        desktopVideo.pause();
                        desktopVideo.currentTime = 0;
                        desktopVideo.muted = true;
                        desktopVideo.volume = 0;
                    }
                }
            }
            
            // Handle mobile HTML5 video - same logic as EM video
            const mobileVideo = this.videoPlayer.getMobileVideo();
            if (mobileVideo) {
                if (data.visible && mobileVideo.style.opacity === '0') {
                    mobileVideo.style.opacity = '1';
                    mobileVideo.play().catch(() => {});
                    this.audioManager.applyAudioState();
                } else if (!data.visible && mobileVideo.style.opacity === '1') {
                    mobileVideo.style.opacity = '0';
                    mobileVideo.pause();
                    mobileVideo.currentTime = 0;
                    mobileVideo.muted = true;
                    mobileVideo.volume = 0;
                }
            }
        });

        // Spaghetti state changes
        this.scrollManager.on('onSpaghettiStateChange', (data) => {
            if (data.visible) {
                this.models.showSpaghetti();
                if (this.emVideoElement.style.opacity === '0') {
                    this.emVideoElement.style.opacity = '1';
                    this.audioManager.applyAudioState();
                    this.emVideoElement.play().catch(() => {});
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
     * Setup WebRTC call buttons
     */
    async setupWebRTCCallButtons() {
        try {
            // Check if WebRTC feature is enabled
            const response = await fetch('/api/features');
            const features = await response.json();
            
            if (!features.webrtcEnabled) {
                return;
            }
            
            const contactLinks = document.querySelectorAll('a[href*="mailto:yousef+ai@hey.com"]');
            
            contactLinks.forEach(link => {
                const container = document.createElement('div');
                container.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    margin: 20px 0;
                `;
                
                // Style the email link
                link.style.cssText = `
                    background: rgba(115, 251, 211, 0.1);
                    color: #73fbd3;
                    border: 1px solid rgba(115, 251, 211, 0.3);
                    padding: 12px 24px;
                    border-radius: 25px;
                    text-decoration: none;
                    font-size: 14px;
                `;
                
                // Insert after the link
                link.parentNode.insertBefore(container, link.nextSibling);
                container.appendChild(link);
                
                // Create call button (now appears first)
                this.webRTCCall.createCallButton(container);
            });
        } catch (error) {
            console.error('Error setting up WebRTC buttons:', error);
        }
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
