/**
 * AudioManager.js - Audio Management and Control
 * Handles all audio-related functionality including permissions, controls, and audio-reactive effects
 */

export class AudioManager {
    constructor() {
        // Audio context and analysis
        this.audioContext = null;
        this.analyserNode = null;
        this.audioDataArray = null;
        this.audioReady = false;
        
        // Permission and control state
        this.audioPermissionGranted = false;
        this.isAudioMuted = false;
        this.audioControlButton = null;
        this.audioPermissionPrompt = null;
        
        // Video elements
        this.video = null;
        this.a1VideoElement = null;
        this.emVideoElement = null;
        this.mobileVideoElement = null;
        
        // Configuration
        this.config = {
            videoVolume: 0.7
        };
    }

    /**
     * Initialize audio manager
     */
    init() {
        this.setupAudioContext();
        this.createAudioControlButton();
        console.log('✅ AudioManager initialized');
        return this;
    }

    /**
     * Setup Web Audio API context
     */
    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 256;
            this.audioDataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
            this.audioReady = true;
            console.log('✅ Audio context ready');
        } catch (e) {
            console.log('Audio context not available:', e);
        }
    }

    /**
     * Set video elements for audio control
     */
    setVideoElements(video, a1VideoElement, emVideoElement, mobileVideoElement) {
        this.video = video;
        this.a1VideoElement = a1VideoElement;
        this.emVideoElement = emVideoElement;
        this.mobileVideoElement = mobileVideoElement;
    }

    /**
     * Centralized audio helpers
     */
    setMediaAudio(element, shouldBeMuted, targetVolume) {
        if (!element) return;
        element.muted = !!shouldBeMuted;
        element.volume = shouldBeMuted ? 0 : targetVolume;
    }

    /**
     * Ensure audio context is resumed
     */
    async ensureAudioContextResumed() {
        try {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
        } catch (_) {}
    }

    /**
     * Apply current audio state to all media elements
     */
    applyAudioState() {
        const effectiveMuted = this.isAudioMuted || !this.audioPermissionGranted;
        this.setMediaAudio(this.video, effectiveMuted, this.config.videoVolume);
        this.setMediaAudio(this.a1VideoElement, effectiveMuted, 0.8);
        this.setMediaAudio(this.emVideoElement, effectiveMuted, 0.8);
        this.setMediaAudio(this.mobileVideoElement, effectiveMuted, this.config.videoVolume);

        this.updateAudioControlButton();
    }

    /**
     * Update audio control button appearance
     */
    updateAudioControlButton() {
        if (!this.audioControlButton) return;
        
        const effectiveMuted = this.isAudioMuted || !this.audioPermissionGranted;
        
        if (effectiveMuted) {
            this.audioControlButton.innerHTML = '<span>🔇</span>';
            this.audioControlButton.style.color = 'rgba(255, 255, 255, 0.6)';
            this.audioControlButton.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        } else {
            this.audioControlButton.innerHTML = '<span>🔊</span>';
            this.audioControlButton.style.color = '#73fbd3';
            this.audioControlButton.style.borderColor = 'rgba(115, 251, 211, 0.3)';
        }
    }

    /**
     * Create floating audio control button
     */
    createAudioControlButton() {
        this.audioControlButton = document.createElement('button');
        this.audioControlButton.id = 'audio-control';
        this.audioControlButton.innerHTML = '<span>🔊</span>';
        this.audioControlButton.style.position = 'fixed';
        this.audioControlButton.style.bottom = '30px';
        this.audioControlButton.style.right = '30px';
        this.audioControlButton.style.width = '60px';
        this.audioControlButton.style.height = '60px';
        this.audioControlButton.style.borderRadius = '50%';
        this.audioControlButton.style.border = 'none';
        this.audioControlButton.style.background = 'rgba(15, 15, 20, 0.9)';
        this.audioControlButton.style.border = '1px solid rgba(115, 251, 211, 0.3)';
        this.audioControlButton.style.color = '#73fbd3';
        this.audioControlButton.style.fontSize = '1.5rem';
        this.audioControlButton.style.cursor = 'pointer';
        this.audioControlButton.style.zIndex = '1000';
        this.audioControlButton.style.display = 'flex';
        this.audioControlButton.style.alignItems = 'center';
        this.audioControlButton.style.justifyContent = 'center';
        this.audioControlButton.style.transition = 'all 0.3s ease';
        this.audioControlButton.style.backdropFilter = 'blur(10px)';
        this.audioControlButton.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
        this.audioControlButton.style.opacity = '0';
        this.audioControlButton.style.transform = 'translateY(20px)';

        // Add hover effects
        this.audioControlButton.addEventListener('mouseenter', () => {
            this.audioControlButton.style.transform = 'translateY(-3px) scale(1.1)';
            this.audioControlButton.style.background = 'rgba(115, 251, 211, 0.1)';
            this.audioControlButton.style.borderColor = 'rgba(115, 251, 211, 0.5)';
            this.audioControlButton.style.boxShadow = '0 12px 35px rgba(115, 251, 211, 0.3)';
        });

        this.audioControlButton.addEventListener('mouseleave', () => {
            this.audioControlButton.style.transform = 'translateY(0) scale(1)';
            this.audioControlButton.style.background = 'rgba(15, 15, 20, 0.9)';
            this.audioControlButton.style.borderColor = 'rgba(115, 251, 211, 0.3)';
            this.audioControlButton.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
        });

        // Add click handler
        this.audioControlButton.addEventListener('click', () => {
            this.toggleAudio();
        });

        // Add to DOM
        document.body.appendChild(this.audioControlButton);
        this.applyAudioState();

        // Show button after delay
        setTimeout(() => {
            this.showAudioControl();
        }, 2000);
        
        console.log('✅ Audio control button created');
    }

    /**
     * Show audio control button
     */
    showAudioControl() {
        if (this.audioControlButton) {
            this.audioControlButton.style.opacity = '1';
            this.audioControlButton.style.transform = 'translateY(0)';
            this.audioControlButton.style.transition = 'all 0.5s ease';
        }
    }

    /**
     * Hide audio control button
     */
    hideAudioControl() {
        if (this.audioControlButton) {
            this.audioControlButton.style.opacity = '0';
            this.audioControlButton.style.transform = 'translateY(20px)';
            this.audioControlButton.style.transition = 'all 0.3s ease';
        }
    }

    /**
     * Toggle audio on/off
     */
    async toggleAudio() {
        this.isAudioMuted = !this.isAudioMuted;
        
        if (this.isAudioMuted) {
            this.applyAudioState();
            console.log('🔇 Audio muted');
        } else {
            this.audioPermissionGranted = true;
            await this.ensureAudioContextResumed();
            this.applyAudioState();
            console.log('🔊 Audio unmuted');
        }
    }

    /**
     * Enable all audio
     */
    enableAllAudio() {
        this.isAudioMuted = false;
        this.audioPermissionGranted = true;
        this.applyAudioState();
        console.log('🔊 All audio enabled');
    }

    /**
     * Disable all audio
     */
    disableAllAudio() {
        this.isAudioMuted = true;
        this.applyAudioState();
        console.log('🔇 All audio disabled');
    }

    /**
     * Grant audio permission
     */
    async grantPermission() {
        try {
            await this.ensureAudioContextResumed();
            this.audioPermissionGranted = true;
            this.applyAudioState();
            console.log('✅ Audio permission granted');
            return true;
        } catch (error) {
            console.log('❌ Audio permission denied:', error);
            this.audioPermissionGranted = false;
            this.applyAudioState();
            return false;
        }
    }

    /**
     * Get audio analysis data for reactive effects
     */
    getAudioData() {
        if (!this.audioReady || !this.analyserNode || !this.audioDataArray) {
            return null;
        }
        
        this.analyserNode.getByteFrequencyData(this.audioDataArray);
        return this.audioDataArray;
    }

    /**
     * Get average audio level for bloom effects
     */
    getAverageAudioLevel() {
        const audioData = this.getAudioData();
        if (!audioData) return 0;
        
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i];
        }
        return sum / audioData.length;
    }

    /**
     * Check if audio is ready
     */
    isReady() {
        return this.audioReady;
    }

    /**
     * Check if audio permission is granted
     */
    hasPermission() {
        return this.audioPermissionGranted;
    }

    /**
     * Check if audio is muted
     */
    isMuted() {
        return this.isAudioMuted;
    }
}
