/**
 * IntroModal.js - Introduction Modal Component
 * Handles the full-screen intro modal with audio permission
 */

export class IntroModal {
    constructor(audioManager) {
        this.audioManager = audioManager;
        this.introModal = null;
        this.enterButton = null;
        this.isVisible = false;
    }

    /**
     * Initialize intro modal
     */
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.preventScrolling();
        
        return this;
    }

    /**
     * Setup DOM elements
     */
    setupElements() {
        this.introModal = document.getElementById('introModal');
        this.enterButton = document.getElementById('enterButton');
        
        if (!this.introModal || !this.enterButton) {
            console.error('❌ Intro modal elements not found');
            return;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!this.enterButton) return;
        
        // Handle enter button click
        this.enterButton.addEventListener('click', async () => {
            await this.handleEnterClick();
        });
    }

    /**
     * Handle enter button click
     */
    async handleEnterClick() {
        try {
            // Grant audio permission
            const permissionGranted = await this.audioManager.grantPermission();
            
            // Re-enable scrolling on the body
            this.enableScrolling();
            
            // Hide intro modal with smooth transition
            this.hide();
            
        } catch (error) {
            // Still hide modal but without audio
            this.enableScrolling();
            this.hide();
        }
    }

    /**
     * Prevent scrolling when modal is active
     */
    preventScrolling() {
        document.body.classList.add('modal-active');
    }

    /**
     * Enable scrolling when modal is dismissed
     */
    enableScrolling() {
        document.body.classList.remove('modal-active');
    }

    /**
     * Show intro modal
     */
    show() {
        if (this.introModal) {
            this.introModal.style.opacity = '1';
            this.introModal.style.visibility = 'visible';
            this.introModal.classList.remove('hidden');
            document.body.classList.add('modal-visible');
            this.isVisible = true;
        }
    }

    /**
     * Hide intro modal
     */
    hide() {
        if (this.introModal) {
            this.introModal.classList.add('hidden');
            document.body.classList.remove('modal-visible');
            
            // Remove modal after transition completes
            setTimeout(() => {
                if (this.introModal && this.introModal.parentNode) {
                    this.introModal.remove();
                }
            }, 1000);
            
            this.isVisible = false;
        }
    }

    /**
     * Check if modal is visible
     */
    isModalVisible() {
        return this.isVisible;
    }

    /**
     * Get modal element
     */
    getModal() {
        return this.introModal;
    }

    /**
     * Get enter button element
     */
    getEnterButton() {
        return this.enterButton;
    }
}
