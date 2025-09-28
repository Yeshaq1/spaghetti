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
            onTypewriterStateChange: [],
            onA1VideoStateChange: [],
            onGokuStateChange: [],
            onSpaghettiStateChange: []
        };
    }

    /**
     * Initialize scroll manager
     */
    init() {
        this.setupSections();
        this.setupScrollListener();
        console.log('✅ ScrollManager initialized');
        return this;
    }

    /**
     * Setup story sections
     */
    setupSections() {
        this.sections = Array.from(document.querySelectorAll('.story-section'));
        console.log(`📄 Found ${this.sections.length} story sections`);
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
            this.handleTypewriterState(scrollY);
            this.handleA1VideoState(scrollY);
            this.handleGokuState(scrollY);
            this.handleSpaghettiState(scrollY);
            
            // Notify callbacks
            this.notifyCallbacks('onScrollProgress', this.currentScrollProgress);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('scroll', handleScroll, { passive: true });
        
        // Initial call
        handleScroll();
        
        console.log('✅ Scroll listener setup complete');
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
                console.log(`✨ Section ${index + 1} visible`);
                
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
        // Animate vibe coding image when section 3 becomes visible
        if (index === 2) {
            const vibeImage = section.querySelector('img');
            if (vibeImage) {
                vibeImage.style.opacity = '1';
                vibeImage.style.transform = 'translateY(0)';
                console.log('🎨 Vibe Coding image appears!');
            }
        }
        
        // Animate company logos when credentials section becomes visible
        if (index === 4) {
            const logoItems = section.querySelectorAll('.logo-item');
            logoItems.forEach((item, logoIndex) => {
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0) scale(1)';
                }, logoIndex * 150);
            });
            console.log('🏢 Company logos animating!');
        }
    }

    /**
     * Handle video states (main video and mobile fallback)
     */
    handleVideoStates(scrollY) {
        const firstSection = this.sections[0];
        if (!firstSection) return;

        const firstSectionBottom = firstSection.offsetTop + firstSection.offsetHeight;
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
     * Handle typewriter effect state
     */
    handleTypewriterState(scrollY) {
        const firstSection = this.sections[0];
        if (!firstSection) return;

        const firstSectionBottom = firstSection.offsetTop + firstSection.offsetHeight;
        const typewriterStart = firstSectionBottom - window.innerHeight * 0.8;
        const a1VideoStart = firstSectionBottom + window.innerHeight * 0.2;
        const typewriterEnd = a1VideoStart;

        const typewriterVisible = scrollY >= typewriterStart && scrollY <= typewriterEnd;
        
        // Notify callbacks about typewriter state
        this.notifyCallbacks('onTypewriterStateChange', { 
            visible: typewriterVisible, 
            scrollY, 
            typewriterStart, 
            typewriterEnd 
        });
    }

    /**
     * Handle A1 video state
     */
    handleA1VideoState(scrollY) {
        const firstSection = this.sections[0];
        const secondSection = this.sections[1];
        
        if (!firstSection) return;

        const firstSectionBottom = firstSection.offsetTop + firstSection.offsetHeight;
        const a1VideoStart = firstSectionBottom + window.innerHeight * 0.2;
        const a1VideoEnd = secondSection ? 
            secondSection.offsetTop - window.innerHeight * 0.1 : 
            firstSectionBottom + window.innerHeight * 4;

        const a1VideoVisible = scrollY >= a1VideoStart && scrollY <= a1VideoEnd;
        
        // Notify callbacks about A1 video state
        this.notifyCallbacks('onA1VideoStateChange', { 
            visible: a1VideoVisible, 
            scrollY, 
            a1VideoStart, 
            a1VideoEnd 
        });
    }

    /**
     * Handle Goku model state
     */
    handleGokuState(scrollY) {
        const section2 = this.sections[1];
        const section3 = this.sections[2];
        
        let gokuShouldBeVisible = false;
        
        if (section2 && section3) {
            const section2Middle = section2.offsetTop + (section2.offsetHeight * 0.6);
            const section3Top = section3.offsetTop;
            gokuShouldBeVisible = scrollY > section2Middle && scrollY < section3Top;
        }
        
        // Notify callbacks about Goku state
        this.notifyCallbacks('onGokuStateChange', { 
            visible: gokuShouldBeVisible, 
            scrollY 
        });
    }

    /**
     * Handle Spaghetti Monster and EM video state
     */
    handleSpaghettiState(scrollY) {
        const section4 = this.sections[3];
        const section5 = this.sections[4];
        
        let spaghettiShouldBeVisible = false;
        
        if (section4 && section5) {
            const section4Middle = section4.offsetTop + (section4.offsetHeight * 0.2);
            const section5Top = section5.offsetTop;
            spaghettiShouldBeVisible = scrollY > section4Middle && scrollY < section5Top;
        }
        
        // Handle news image visibility
        const newsImage = document.querySelector('img[alt="Real world example of vibe coding gone wrong"]');
        if (newsImage && section4) {
            const section4Visible = scrollY + window.innerHeight > section4.offsetTop + 100;
            
            if (section4Visible && newsImage.style.opacity === '0') {
                newsImage.style.opacity = '1';
                newsImage.style.transform = 'translateY(0)';
                console.log('📰 News image appears!');
            } else if (!section4Visible && newsImage.style.opacity === '1') {
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
