/**
 * TypewriterEffect.js - Typewriter Animation Component
 * Handles typewriter text effects and terminal-style animations
 */

export class TypewriterEffect {
    constructor() {
        this.typewriterElement = null;
        this.isVisible = false;
        this.currentText = '';
        this.isTyping = false;
    }

    /**
     * Initialize typewriter effect
     */
    init() {
        this.createTypewriterElement();
        return this;
    }

    /**
     * Create typewriter element with terminal styling
     */
    createTypewriterElement() {
        // Create typewriter container
        this.typewriterElement = document.createElement('div');
        this.typewriterElement.style.position = 'fixed';
        this.typewriterElement.style.top = '50%';
        this.typewriterElement.style.left = '50%';
        this.typewriterElement.style.transform = 'translate(-50%, -50%)';
        this.typewriterElement.style.zIndex = '1001';
        this.typewriterElement.style.opacity = '0';
        this.typewriterElement.style.transition = 'opacity 0.5s ease-in-out';
        this.typewriterElement.style.pointerEvents = 'none';
        this.typewriterElement.style.maxWidth = '90vw';
        this.typewriterElement.style.textAlign = 'center';
        
        // Create futuristic terminal container
        const terminal = document.createElement('div');
        terminal.style.background = 'linear-gradient(135deg, rgba(5, 5, 8, 0.95), rgba(10, 10, 14, 0.98))';
        terminal.style.border = '1px solid rgba(115, 251, 211, 0.12)';
        terminal.style.borderRadius = '15px';
        terminal.style.padding = '2.5rem 3rem';
        terminal.style.boxShadow = '0 20px 80px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(115, 251, 211, 0.08)';
        terminal.style.position = 'relative';
        terminal.style.overflow = 'hidden';
        terminal.style.backdropFilter = 'blur(20px)';
        
        // Add animated border glow
        const borderGlow = document.createElement('div');
        borderGlow.style.position = 'absolute';
        borderGlow.style.top = '0';
        borderGlow.style.left = '0';
        borderGlow.style.right = '0';
        borderGlow.style.bottom = '0';
        borderGlow.style.borderRadius = '15px';
        borderGlow.style.background = 'linear-gradient(45deg, rgba(115, 251, 211, 0.35), rgba(138, 126, 252, 0.25), rgba(115, 251, 211, 0.35))';
        borderGlow.style.backgroundSize = '200% 200%';
        borderGlow.style.animation = 'terminalGlow 6s ease-in-out infinite';
        borderGlow.style.zIndex = '-1';
        borderGlow.style.opacity = '0.18';
        terminal.appendChild(borderGlow);
        
        // Add scanline effect
        const scanlines = document.createElement('div');
        scanlines.style.position = 'absolute';
        scanlines.style.top = '0';
        scanlines.style.left = '0';
        scanlines.style.right = '0';
        scanlines.style.bottom = '0';
        scanlines.style.background = 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(115, 251, 211, 0.02) 2px, rgba(115, 251, 211, 0.02) 4px)';
        scanlines.style.pointerEvents = 'none';
        scanlines.style.animation = 'scanlines 0.12s linear infinite';
        terminal.appendChild(scanlines);
        
        // Create terminal header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.marginBottom = '2rem';
        header.style.paddingBottom = '1rem';
        header.style.borderBottom = '1px solid rgba(115, 251, 211, 0.12)';
        
        // Terminal dots
        const dots = document.createElement('div');
        dots.style.display = 'flex';
        dots.style.gap = '0.5rem';
        dots.style.marginRight = '1rem';
        
        ['#ff5f56', '#ffbd2e', '#27ca3f'].forEach(color => {
            const dot = document.createElement('div');
            dot.style.width = '12px';
            dot.style.height = '12px';
            dot.style.borderRadius = '50%';
            dot.style.background = color;
            dot.style.boxShadow = `0 0 10px ${color}`;
            dots.appendChild(dot);
        });
        
        // Terminal title
        const title = document.createElement('div');
        title.textContent = 'AI_TERMINAL.exe';
        title.style.color = 'rgba(115, 251, 211, 0.9)';
        title.style.fontFamily = '"Courier New", monospace';
        title.style.fontSize = '0.9rem';
        title.style.fontWeight = '600';
        title.style.letterSpacing = '0.1em';
        title.style.textShadow = '0 0 8px rgba(115, 251, 211, 0.35)';
        
        header.appendChild(dots);
        header.appendChild(title);
        terminal.appendChild(header);
        
        // Create text container
        const textContainer = document.createElement('div');
        textContainer.style.position = 'relative';
        textContainer.style.zIndex = '2';
        textContainer.style.textAlign = 'center';
        
        // Create typewriter text
        const textSpan = document.createElement('span');
        textSpan.id = 'typewriter-text';
        textSpan.style.fontFamily = '"Courier New", "Monaco", monospace';
        textSpan.style.fontSize = 'clamp(1.4rem, 4vw, 2.2rem)';
        textSpan.style.fontWeight = '400';
        textSpan.style.color = 'rgba(115, 251, 211, 0.92)';
        textSpan.style.lineHeight = '1.4';
        textSpan.style.letterSpacing = '0.05em';
        textSpan.style.textShadow = '0 0 14px rgba(115, 251, 211, 0.35)';
        
        // Create blinking cursor
        const cursor = document.createElement('span');
        cursor.id = 'typewriter-cursor';
        cursor.textContent = '_';
        cursor.style.color = 'rgba(115, 251, 211, 0.9)';
        cursor.style.fontSize = 'clamp(1.4rem, 4vw, 2.2rem)';
        cursor.style.fontWeight = '400';
        cursor.style.animation = 'terminalBlink 1s infinite';
        cursor.style.marginLeft = '4px';
        cursor.style.textShadow = '0 0 12px rgba(115, 251, 211, 0.35)';
        
        textContainer.appendChild(textSpan);
        textContainer.appendChild(cursor);
        terminal.appendChild(textContainer);
        this.typewriterElement.appendChild(terminal);
        
        // Add CSS animations
        this.addStyles();
        
        document.body.appendChild(this.typewriterElement);
        
    }

    /**
     * Add CSS styles for animations
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes terminalBlink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
            @keyframes terminalGlow {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            @keyframes scanlines {
                0% { transform: translateY(0); }
                100% { transform: translateY(4px); }
            }
            @keyframes glitchShift {
                0% { text-shadow: 0 0 0 #ff3b3b, 0 0 0 #00eaff; transform: translate(0, 0) skew(0deg); }
                10% { text-shadow: 2px 0 #ff3b3b, -2px 0 #00eaff; transform: translate(0.5px, -0.5px) skew(0.3deg); }
                20% { text-shadow: -2px 0 #ff3b3b, 2px 0 #00eaff; transform: translate(-0.5px, 0.5px) skew(-0.3deg); }
                30% { text-shadow: 3px 0 #ff3b3b, -3px 0 #00eaff; transform: translate(0.8px, -0.2px) skew(0.6deg); }
                40% { text-shadow: -3px 0 #ff3b3b, 3px 0 #00eaff; transform: translate(-0.8px, 0.2px) skew(-0.6deg); }
                50% { text-shadow: 1px 0 #ff3b3b, -1px 0 #00eaff; transform: translate(0.2px, 0.3px) skew(0.2deg); }
                60% { text-shadow: -1px 0 #ff3b3b, 1px 0 #00eaff; transform: translate(-0.2px, -0.3px) skew(-0.2deg); }
                70% { text-shadow: 4px 0 #ff3b3b, -4px 0 #00eaff; transform: translate(1px, -0.6px) skew(0.8deg); }
                80% { text-shadow: -4px 0 #ff3b3b, 4px 0 #00eaff; transform: translate(-1px, 0.6px) skew(-0.8deg); }
                90% { text-shadow: 2px 0 #ff3b3b, -2px 0 #00eaff; transform: translate(0.5px, -0.4px) skew(0.4deg); }
                100% { text-shadow: 0 0 0 #ff3b3b, 0 0 0 #00eaff; transform: translate(0, 0) skew(0deg); }
            }
            .glitch {
                position: relative;
                animation: glitchShift 1s steps(8, end) infinite;
            }
            .glitch::before, .glitch::after {
                content: attr(data-text);
                position: absolute;
                left: 0;
                top: 0;
                opacity: 0.75;
                pointer-events: none;
            }
            .glitch::before {
                color: #ff3b3b;
                transform: translate(2px, 0);
                mix-blend-mode: screen;
            }
            .glitch::after {
                color: #00eaff;
                transform: translate(-2px, 0);
                mix-blend-mode: screen;
            }
            .glitch-no-clone::before,
            .glitch-no-clone::after { display: none; }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show typewriter with glitch effect
     */
    showGlitchText(text) {
        if (!this.typewriterElement) return;

        const textElement = document.getElementById('typewriter-text');
        const cursorElement = document.getElementById('typewriter-cursor');
        if (!textElement || !cursorElement) return;

        this.typewriterElement.style.opacity = '1';
        cursorElement.style.opacity = '0';
        textElement.textContent = text;
        textElement.setAttribute('data-text', text);
        textElement.classList.remove('glitch');
        textElement.classList.add('glitch', 'glitch-no-clone');

        this.isVisible = true;
        this.currentText = text;
    }

    /**
     * Show typewriter with typing effect
     */
    showTypewriterText(text, speed = 80) {
        if (!this.typewriterElement || this.isTyping) return;
        
        const textElement = document.getElementById('typewriter-text');
        const cursorElement = document.getElementById('typewriter-cursor');
        if (!textElement || !cursorElement) return;
        
        // Ensure glitch effect is removed for normal typing
        textElement.classList.remove('glitch');
        textElement.removeAttribute('data-text');
        cursorElement.style.opacity = '1';
        
        this.typewriterElement.style.opacity = '1';
        textElement.textContent = '';
        
        // Add subtle glow effect to the paper
        const paper = this.typewriterElement.querySelector('div');
        if (paper) {
            paper.style.animation = 'typewriterGlow 2s ease-in-out infinite';
        }
        
        this.isVisible = true;
        this.currentText = text;
        this.isTyping = true;
        
        let i = 0;
        
        const typeNextChar = () => {
            if (i < text.length) {
                const char = text.charAt(i);
                textElement.textContent += char;
                i++;
                
                // Add slight delay for punctuation
                let delay = speed;
                if (char === '.' || char === '!' || char === '?' || char === ',') {
                    delay = speed * 2;
                }
                
                // Add random typing variation
                const variation = Math.random() * 20 - 10;
                delay += variation;
                
                setTimeout(typeNextChar, delay);
            } else {
                // Hide cursor after typing is complete
                setTimeout(() => {
                    if (cursorElement) {
                        cursorElement.style.opacity = '0';
                    }
                    this.isTyping = false;
                }, 2000);
            }
        };
        
        // Start typing
        typeNextChar();
        
    }

    /**
     * Hide typewriter
     */
    hide() {
        if (this.typewriterElement) {
            this.typewriterElement.style.opacity = '0';
            this.isVisible = false;
        }
    }

    /**
     * Check if typewriter is visible
     */
    isTypewriterVisible() {
        return this.isVisible;
    }

    /**
     * Get current text
     */
    getCurrentText() {
        return this.currentText;
    }

    /**
     * Check if currently typing
     */
    isCurrentlyTyping() {
        return this.isTyping;
    }
}
