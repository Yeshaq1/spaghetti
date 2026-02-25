/**
 * ScrollManager.js - Scroll Handling and Section Management
 * Handles scroll-based animations, section visibility, and scroll-triggered effects
 */

export class ScrollManager {
    constructor() {
        this.sections = [];
        this.currentScrollProgress = 0;
        this.callbacks = {
            onSectionVisible: [],
            onScrollProgress: [],
            onVideoStateChange: [],
            onSpaghettiStateChange: []
        };
    }

    /**
     * Initialize scroll manager
     */
    init() {
        this.setupSections();
        this.setupScrollListener();
        return this;
    }

    /**
     * Setup story sections
     */
    setupSections() {
        this.sections = Array.from(document.querySelectorAll('.story-section'));
    }

    /**
     * Setup scroll event listener
     */
    setupScrollListener() {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            this.currentScrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
            
            this.updateSectionVisibility(scrollY);
            this.handleVideoStates(scrollY);
            this.handleSpaghettiState(scrollY);
            
            // Notify callbacks
            this.notifyCallbacks('onScrollProgress', this.currentScrollProgress);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('scroll', handleScroll, { passive: true });
        
        // Initial call
        handleScroll();
        
    }

    /**
     * Update section visibility based on scroll
     */
    updateSectionVisibility(scrollY) {
        this.sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionVisible = scrollY + window.innerHeight > sectionTop + 100;
            
            if (sectionVisible && !section.classList.contains('visible')) {
                section.classList.add('visible');
                
                // Handle specific section animations
                this.handleSectionAnimations(section, index);
                
                // Notify callbacks
                this.notifyCallbacks('onSectionVisible', { section, index });
            }
        });
    }

    /**
     * Handle specific section animations
     */
    handleSectionAnimations(section, index) {
        // Animate automation image when its section becomes visible
        const automationImage = section.querySelector('img[alt="AI workflow automation"]');
        if (automationImage) {
            automationImage.style.opacity = '1';
            automationImage.style.transform = 'translateY(0)';
        }

        // Animate company logos when credentials section becomes visible
        if (section.querySelector('.company-logos')) {
            const logoItems = section.querySelectorAll('.logo-item');
            logoItems.forEach((item, logoIndex) => {
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0) scale(1)';
                }, logoIndex * 150);
            });
        }
    }

    /**
     * Handle video states (main video and mobile fallback)
     */
    handleVideoStates(scrollY) {
        const firstSection = this.sections[0];
        if (!firstSection) return;

        const firstSectionBottom = firstSection.offsetTop + firstSection.offsetHeight;
        // Restore original working value - both desktop and mobile should use 0.8
        const typewriterStart = firstSectionBottom - window.innerHeight * 0.8;
        const videoDisappearPoint = typewriterStart;

        const videoVisible = scrollY < videoDisappearPoint;
        
        
        // Notify callbacks about video state
        this.notifyCallbacks('onVideoStateChange', { 
            visible: videoVisible, 
            scrollY, 
            videoDisappearPoint 
        });
    }

    /**
     * Handle Spaghetti Monster and EM video state
     */
    handleSpaghettiState(scrollY) {
        const newsImage = document.querySelector('img[alt="Real world example of AI rollout problems"]');
        const newsSection = newsImage ? newsImage.closest('.story-section') : null;
        let spaghettiShouldBeVisible = false;

        // Keep monster/video bound to the "On the surface..." section only.
        if (newsSection) {
            const viewportEnterOffset = window.innerHeight * 0.45;
            const viewportExitOffset = window.innerHeight * 0.2;
            const sectionStart = newsSection.offsetTop - viewportEnterOffset;
            const sectionEnd = newsSection.offsetTop + newsSection.offsetHeight - viewportExitOffset;
            spaghettiShouldBeVisible = scrollY > sectionStart && scrollY < sectionEnd;
        }

        // Handle news image visibility
        if (newsImage && newsSection) {
            const newsSectionVisible = scrollY + window.innerHeight > newsSection.offsetTop + 100;

            if (newsSectionVisible && newsImage.style.opacity === '0') {
                newsImage.style.opacity = '1';
                newsImage.style.transform = 'translateY(0)';
            } else if (!newsSectionVisible && newsImage.style.opacity === '1') {
                newsImage.style.opacity = '0';
                newsImage.style.transform = 'translateY(30px)';
            }
        }
        
        // Notify callbacks about Spaghetti state
        this.notifyCallbacks('onSpaghettiStateChange', { 
            visible: spaghettiShouldBeVisible, 
            scrollY 
        });
    }

    /**
     * Add callback for scroll events
     */
    on(eventType, callback) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType].push(callback);
        }
    }

    /**
     * Remove callback
     */
    off(eventType, callback) {
        if (this.callbacks[eventType]) {
            const index = this.callbacks[eventType].indexOf(callback);
            if (index > -1) {
                this.callbacks[eventType].splice(index, 1);
            }
        }
    }

    /**
     * Notify callbacks
     */
    notifyCallbacks(eventType, data) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${eventType} callback:`, error);
                }
            });
        }
    }

    /**
     * Get current scroll progress (0-1)
     */
    getScrollProgress() {
        return this.currentScrollProgress;
    }

    /**
     * Get all sections
     */
    getSections() {
        return this.sections;
    }

    /**
     * Get section by index
     */
    getSection(index) {
        return this.sections[index];
    }

    /**
     * Scroll to section
     */
    scrollToSection(index) {
        const section = this.sections[index];
        if (section) {
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    /**
     * Check if section is visible
     */
    isSectionVisible(index) {
        const section = this.sections[index];
        if (!section) return false;
        
        const rect = section.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
    }
}
