/**
 * VideoPlayer.js - Video Management and WebGL Integration
 * Handles video creation, WebGL texture mapping, and mobile fallbacks
 */

export class VideoPlayer {
    constructor(scene, audioManager) {
        this.scene = scene;
        this.audioManager = audioManager;
        
        // Video elements
        this.video = null;
        this.videoTexture = null;
        this.videoPlane = null;
        this.mobileVideoElement = null;
        
        // Configuration
        this.config = {
            videoPath: 'assets/videoplayback.mp4',
            videoVolume: 0.7
        };
    }

    /**
     * Initialize video player
     */
    init() {
        this.createVideo();
        return this;
    }

    /**
     * Create video element and WebGL texture
     */
    createVideo() {
        // Check if mobile - use simple HTML5 video like em/a1 videos
        if (this.isMobile()) {
            this.createMobileVideo();
        } else {
            this.createWebGLVideo();
        }
    }

    /**
     * Check if device is mobile
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    }

    /**
     * Create WebGL video with texture
     */
    createWebGLVideo() {
        this.video = document.createElement('video');
        this.video.src = this.config.videoPath;
        this.video.crossOrigin = 'anonymous';
        this.video.loop = true;
        this.video.muted = true; // Start muted for autoplay
        this.video.volume = 0; // Start with no volume until permission granted
        
        // Try to play immediately
        this.video.play().catch(() => {});
        
        // Create video texture
        this.videoTexture = new THREE.VideoTexture(this.video);
        this.videoTexture.minFilter = THREE.LinearFilter;
        this.videoTexture.magFilter = THREE.LinearFilter;
        
        // Create curved geometry for cinematic effect
        const geometry = new THREE.PlaneGeometry(8, 4.5, 32, 32);
        
        // Add slight curve to the video plane
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            positions[i + 2] += Math.sin(x * 0.1) * 0.3 + Math.sin(y * 0.1) * 0.2;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        // Create material with glow effect
        const material = new THREE.MeshLambertMaterial({
            map: this.videoTexture,
            emissive: new THREE.Color(0x111111),
            emissiveMap: this.videoTexture,
            transparent: true,
            opacity: 1
        });
        
        this.videoPlane = new THREE.Mesh(geometry, material);
        this.videoPlane.position.set(0, 0, 0);
        this.scene.add(this.videoPlane);
        
    }

    /**
     * Create mobile video fallback
     */
    createMobileVideo() {
        this.mobileVideoElement = document.createElement('video');
        this.mobileVideoElement.src = this.config.videoPath;
        this.mobileVideoElement.crossOrigin = 'anonymous';
        this.mobileVideoElement.loop = true;
        this.mobileVideoElement.muted = true;
        this.mobileVideoElement.volume = 0;
        this.mobileVideoElement.playsInline = true;
        
        // Video styling
        this.mobileVideoElement.style.position = 'fixed';
        this.mobileVideoElement.style.top = '50%';
        this.mobileVideoElement.style.left = '50%';
        this.mobileVideoElement.style.transform = 'translate(-50%, -50%)';
        this.mobileVideoElement.style.width = 'min(80vw, 400px)';
        this.mobileVideoElement.style.height = 'auto';
        this.mobileVideoElement.style.zIndex = '1002';
        this.mobileVideoElement.style.borderRadius = '20px';
        this.mobileVideoElement.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
        this.mobileVideoElement.style.opacity = '1'; // Start visible like desktop
        this.mobileVideoElement.style.transition = 'opacity 1s ease-in-out';
        this.mobileVideoElement.style.pointerEvents = 'none';
        
        document.body.appendChild(this.mobileVideoElement);
        
        // Try to play immediately like desktop
        this.mobileVideoElement.play().catch(() => {});
        
    }



    /**
     * Update video visibility based on scroll
     */
    updateVisibility(visible) {
        if (this.videoPlane && this.videoPlane.material) {
            this.videoPlane.material.opacity = visible ? 1 : 0;
        }
        
        if (this.mobileVideoElement) {
            // Ensure video is not hidden by CSS when it should be visible
            if (visible) {
                this.mobileVideoElement.style.display = 'block';
                this.mobileVideoElement.style.opacity = '1';
            } else {
                this.mobileVideoElement.style.opacity = '0';
            }
        }
        
        // Handle video playback and audio based on visibility
        if (visible) {
            this.play();
        } else {
            this.pause();
            this.reset();
        }
        
        // Apply audio state
        if (this.audioManager) {
            this.audioManager.applyAudioState();
        }
    }

    /**
     * Pause video
     */
    pause() {
        if (this.video) {
            this.video.pause();
            // Mute audio when pausing
            this.video.muted = true;
            this.video.volume = 0;
        }
        if (this.mobileVideoElement) {
            this.mobileVideoElement.pause();
            // Mute audio when pausing
            this.mobileVideoElement.muted = true;
            this.mobileVideoElement.volume = 0;
        }
    }

    /**
     * Play video
     */
    play() {
        if (this.video) {
            this.video.play().catch(() => {});
        }
        if (this.mobileVideoElement) {
            this.mobileVideoElement.play().catch(() => {});
        }
        
        // Apply audio state after playing
        if (this.audioManager) {
            this.audioManager.applyAudioState();
        }
    }

    /**
     * Reset video to beginning
     */
    reset() {
        if (this.video) {
            this.video.currentTime = 0;
            // Ensure video is muted when reset
            this.video.muted = true;
            this.video.volume = 0;
        }
        if (this.mobileVideoElement) {
            this.mobileVideoElement.currentTime = 0;
            // Ensure video is muted when reset
            this.mobileVideoElement.muted = true;
            this.mobileVideoElement.volume = 0;
        }
    }

    /**
     * Animate video plane
     */
    animate(time) {
        if (this.videoPlane) {
            this.videoPlane.rotation.z = Math.sin(time * 0.1) * 0.005;
            this.videoPlane.position.y = Math.sin(time * 0.3) * 0.1;
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (this.mobileVideoElement) {
            // DON'T move the main video - keep it fixed on screen
            // Only update max width if needed
            this.mobileVideoElement.style.maxWidth = window.innerWidth <= 768 ? '400px' : '500px';
        }
    }

    /**
     * Get video element
     */
    getVideo() {
        return this.video;
    }

    /**
     * Get mobile video element
     */
    getMobileVideo() {
        return this.mobileVideoElement;
    }

    /**
     * Get video plane
     */
    getVideoPlane() {
        return this.videoPlane;
    }

    /**
     * Check if mobile
     */
    isMobileDevice() {
        return this.isMobile();
    }
}
