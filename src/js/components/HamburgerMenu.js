/**
 * HamburgerMenu.js - Navigation Menu Component
 * Handles hamburger menu animation and navigation
 */

export class HamburgerMenu {
    constructor() {
        this.menuTrigger = null;
        this.menuOverlay = null;
        this.isMenuOpen = false;
        this.menuAnimationInProgress = false;
    }

    /**
     * Initialize hamburger menu
     */
    init() {
        this.setupElements();
        this.setupHamburgerIcon();
        this.setupMenuLetterAnimations();
        this.setupEventListeners();
        this.setInitialState();
        
        console.log('✅ HamburgerMenu initialized');
        return this;
    }

    /**
     * Setup DOM elements
     */
    setupElements() {
        this.menuTrigger = document.getElementById('menuTrigger');
        this.menuOverlay = document.getElementById('menuOverlay');
        
        if (!this.menuTrigger || !this.menuOverlay) {
            console.error('❌ Menu elements not found');
            return;
        }
    }

    /**
     * Setup hamburger icon animation on canvas
     */
    setupHamburgerIcon() {
        const canvas = this.menuTrigger.querySelector('.canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const size = 40;
        const lineHeight = 2;
        const lineSpacing = 8;
        
        const drawHamburger = (progress = 0) => {
            ctx.clearRect(0, 0, size, size);
            ctx.strokeStyle = '#73fbd3';
            ctx.lineWidth = lineHeight;
            ctx.lineCap = 'round';
            
            const centerY = size / 2;
            const lineWidth = 20;
            const startX = (size - lineWidth) / 2;
            const endX = startX + lineWidth;
            
            if (progress === 0) {
                // Hamburger state
                ctx.beginPath();
                ctx.moveTo(startX, centerY - lineSpacing);
                ctx.lineTo(endX, centerY - lineSpacing);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(startX, centerY);
                ctx.lineTo(endX, centerY);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(startX, centerY + lineSpacing);
                ctx.lineTo(endX, centerY + lineSpacing);
                ctx.stroke();
            } else if (progress === 1) {
                // X state
                const diagonal = lineWidth * 0.7;
                const offsetX = (lineWidth - diagonal) / 2;
                
                ctx.beginPath();
                ctx.moveTo(startX + offsetX, centerY - diagonal/2);
                ctx.lineTo(startX + offsetX + diagonal, centerY + diagonal/2);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(startX + offsetX, centerY + diagonal/2);
                ctx.lineTo(startX + offsetX + diagonal, centerY - diagonal/2);
                ctx.stroke();
            } else {
                // Animated state between hamburger and X
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                
                // Top line animates to first diagonal
                ctx.beginPath();
                const topStartY = centerY - lineSpacing + (lineSpacing - lineWidth*0.35) * easeProgress;
                const topEndY = centerY - lineSpacing + (lineSpacing + lineWidth*0.35) * easeProgress;
                const topStartX = startX + (lineWidth - lineWidth*0.7) / 2 * easeProgress;
                const topEndX = endX - (lineWidth - lineWidth*0.7) / 2 * easeProgress;
                ctx.moveTo(topStartX, topStartY);
                ctx.lineTo(topEndX, topEndY);
                ctx.stroke();
                
                // Middle line fades out
                ctx.globalAlpha = 1 - easeProgress;
                ctx.beginPath();
                ctx.moveTo(startX, centerY);
                ctx.lineTo(endX, centerY);
                ctx.stroke();
                ctx.globalAlpha = 1;
                
                // Bottom line animates to second diagonal
                ctx.beginPath();
                const bottomStartY = centerY + lineSpacing - (lineSpacing + lineWidth*0.35) * easeProgress;
                const bottomEndY = centerY + lineSpacing - (lineSpacing - lineWidth*0.35) * easeProgress;
                const bottomStartX = startX + (lineWidth - lineWidth*0.7) / 2 * easeProgress;
                const bottomEndX = endX - (lineWidth - lineWidth*0.7) / 2 * easeProgress;
                ctx.moveTo(bottomStartX, bottomStartY);
                ctx.lineTo(bottomEndX, bottomEndY);
                ctx.stroke();
            }
        };
        
        // Initial draw
        drawHamburger(0);
        
        // Store animation function
        canvas.drawHamburger = drawHamburger;
    }

    /**
     * Setup letter-by-letter animations for menu items
     */
    setupMenuLetterAnimations() {
        const menuLinks = this.menuOverlay.querySelectorAll('.main-link');
        
        menuLinks.forEach((link) => {
            const text = link.getAttribute('data-text') || '';
            const titleElement = link.querySelector('.title');
            
            if (!titleElement || !text) return;
            
            // Clear existing content
            titleElement.innerHTML = '';
            
            // Create letter elements
            text.split('').forEach((char, index) => {
                const letter = document.createElement('span');
                letter.className = `letter letter-in-${index}`;
                
                const letterInner = document.createElement('span');
                letterInner.className = 'letter-inner';
                letterInner.textContent = char === ' ' ? '\u00A0' : char;
                
                letter.appendChild(letterInner);
                titleElement.appendChild(letter);
            });
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add click handler
        this.menuTrigger.addEventListener('click', () => {
            this.toggleMenu();
        });
        
        // Close menu when clicking on overlay
        this.menuOverlay.addEventListener('click', (e) => {
            if (e.target === this.menuOverlay) {
                this.closeMenu();
            }
        });
        
        // Close menu with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMenu();
            }
        });
        
        // Add navigation handlers to menu links
        const menuLinks = this.menuOverlay.querySelectorAll('.main-link');
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                // Handle email links normally
                if (href && href.startsWith('mailto:')) {
                    this.closeMenu();
                    return;
                }
                
                // Handle anchor links with smooth scrolling
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    this.closeMenu();
                    
                    // Wait for menu to close, then scroll
                    setTimeout(() => {
                        const targetId = href.substring(1);
                        let targetElement = null;
                        
                        // Map menu items to actual sections
                        if (targetId === 'services') {
                            targetElement = document.querySelector('.story-section:nth-child(12)');
                        } else if (targetId === 'about') {
                            targetElement = document.querySelector('.story-section:nth-child(2)');
                        } else if (targetId === 'experience') {
                            targetElement = document.querySelector('.story-section:nth-child(10)');
                        }
                        
                        if (targetElement) {
                            targetElement.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center'
                            });
                        }
                    }, 800);
                }
            });
        });
    }

    /**
     * Set initial state
     */
    setInitialState() {
        this.menuTrigger.classList.add('is-default-out');
        
        // Show the header after initialization
        const header = document.querySelector('.header');
        if (header) {
            header.style.opacity = '1';
        }
        
        // Show the scroll hint
        const scrollHint = document.querySelector('.scroll-hint');
        if (scrollHint) {
            scrollHint.style.opacity = '1';
        }
        
        // Show the MENU text (since we're in default-out state)
        const menuText = this.menuTrigger.querySelector('.text.menu');
        if (menuText) {
            menuText.style.opacity = '1';
        }
    }

    /**
     * Toggle menu open/close
     */
    toggleMenu() {
        if (this.menuAnimationInProgress) return;
        
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    /**
     * Open menu with animation
     */
    openMenu() {
        if (this.isMenuOpen || this.menuAnimationInProgress) return;
        
        this.menuAnimationInProgress = true;
        this.isMenuOpen = true;
        
        // Update trigger state
        this.menuTrigger.classList.remove('is-default-out');
        this.menuTrigger.classList.add('is-menu-in');
        
        // Show CLOSE text and hide MENU text
        const menuText = this.menuTrigger.querySelector('.text.menu');
        const closeText = this.menuTrigger.querySelector('.text.close');
        if (menuText) menuText.style.opacity = '0';
        if (closeText) closeText.style.opacity = '1';
        
        // Animate hamburger to X
        this.animateHamburgerIcon(0, 1, 300);
        
        // Show overlay
        this.menuOverlay.classList.add('menu-open');
        this.menuOverlay.classList.add('menu-opening');
        
        // Animate letters in
        const letters = this.menuOverlay.querySelectorAll('.letter');
        letters.forEach((letter, index) => {
            letter.style.opacity = '0';
            letter.style.transform = 'translateX(-100px)';
            
            setTimeout(() => {
                letter.style.opacity = '1';
                letter.style.transform = 'translateX(0)';
            }, 500 + index * 20);
        });
        
        // Enable menu state after animation
        setTimeout(() => {
            this.menuAnimationInProgress = false;
            this.menuOverlay.classList.remove('menu-opening');
        }, 1000);
        
        console.log('🍔 Menu opened');
    }

    /**
     * Close menu with animation
     */
    closeMenu() {
        if (!this.isMenuOpen || this.menuAnimationInProgress) return;
        
        this.menuAnimationInProgress = true;
        this.isMenuOpen = false;
        
        // Update trigger state
        this.menuTrigger.classList.remove('is-menu-in');
        this.menuTrigger.classList.add('is-default-out');
        
        // Show MENU text and hide CLOSE text
        const menuText = this.menuTrigger.querySelector('.text.menu');
        const closeText = this.menuTrigger.querySelector('.text.close');
        if (menuText) menuText.style.opacity = '1';
        if (closeText) closeText.style.opacity = '0';
        
        // Animate X back to hamburger
        this.animateHamburgerIcon(1, 0, 300);
        
        // Add closing animation class
        this.menuOverlay.classList.add('menu-closing');
        
        // Animate letters out
        const letters = this.menuOverlay.querySelectorAll('.letter');
        letters.forEach((letter, index) => {
            setTimeout(() => {
                letter.style.opacity = '0';
                letter.style.transform = 'translateX(-100px)';
            }, index * 10);
        });
        
        // Hide overlay after animation
        setTimeout(() => {
            this.menuOverlay.classList.remove('menu-open');
            this.menuOverlay.classList.remove('menu-closing');
            this.menuAnimationInProgress = false;
        }, 800);
        
        console.log('🍔 Menu closed');
    }

    /**
     * Animate hamburger icon transformation
     */
    animateHamburgerIcon(startProgress, endProgress, duration) {
        const canvas = this.menuTrigger.querySelector('.canvas');
        if (!canvas || !canvas.drawHamburger) return;
        
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentProgress = startProgress + (endProgress - startProgress) * easedProgress;
            
            canvas.drawHamburger(currentProgress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    /**
     * Check if menu is open
     */
    isOpen() {
        return this.isMenuOpen;
    }

    /**
     * Check if menu animation is in progress
     */
    isAnimating() {
        return this.menuAnimationInProgress;
    }
}
