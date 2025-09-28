/**
 * Models.js - 3D Model Loading and Management
 * Handles loading and animation of 3D models (Goku, Spaghetti Monster, etc.)
 */

export class Models {
    constructor(scene) {
        this.scene = scene;
        
        // Model references
        this.gokuModel = null;
        this.gokuEntranceTime = 0;
        this.gokuEntranceComplete = false;
        this.gokuEnergyParticles = [];
        
        this.spaghettiModel = null;
        this.spaghettiArrow = null;
        
        // Model states
        this.gokuVisible = false;
        this.spaghettiVisible = false;
    }

    /**
     * Initialize models
     */
    init() {
        this.loadGokuModel();
        this.loadSpaghettiModel();
        console.log('✅ Models initialized');
        return this;
    }

    /**
     * Load Goku Super Saiyan 3D model
     */
    loadGokuModel() {
        const loader = new THREE.GLTFLoader();
        loader.load(
            'assets/goku_super_saiyan.glb',
            (gltf) => {
                this.gokuModel = gltf.scene;
                
                // Scale and position the model
                this.gokuModel.scale.setScalar(0.4);
                this.gokuModel.position.set(0, -4, -15);
                
                // Add lighting for the model
                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
                directionalLight.position.set(5, 5, 5);
                directionalLight.visible = false;
                this.scene.add(directionalLight);
                this.gokuModel.userData.directionalLight = directionalLight;
                
                // Add the model to the scene but start hidden
                this.gokuModel.visible = false;
                this.gokuModel.scale.setScalar(0.1);
                this.scene.add(this.gokuModel);
                
                // Create energy particles
                this.gokuEnergyParticles = this.createGokuEnergyParticles();
                
                console.log('✅ Goku Super Saiyan model loaded');
            },
            (progress) => {
                console.log('Loading Goku model:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading Goku model:', error);
            }
        );
    }

    /**
     * Create energy particles around Goku
     */
    createGokuEnergyParticles() {
        const particleCount = 50;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setHSL(0.1, 1, 1),
                    transparent: true,
                    opacity: 0.9
                })
            );
            
            // Random position around Goku
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 2 + Math.random() * 3;
            particle.position.set(
                Math.cos(angle) * radius,
                -4 + (Math.random() - 0.5) * 2,
                -15 + (Math.random() - 0.5) * 2
            );
            
            particle.userData = {
                originalY: particle.position.y,
                angle: angle,
                radius: radius,
                speed: 0.5 + Math.random() * 1.0
            };
            
            particle.visible = false;
            this.scene.add(particle);
            particles.push(particle);
        }
        
        return particles;
    }

    /**
     * Load Flying Spaghetti Monster 3D model
     */
    loadSpaghettiModel() {
        const loader = new THREE.GLTFLoader();
        loader.load(
            'assets/the_flying_spaghetti_monster.glb',
            (gltf) => {
                this.spaghettiModel = gltf.scene;
                
                // Scale and position the model
                this.spaghettiModel.scale.setScalar(1.2);
                this.spaghettiModel.position.set(0, -2, -10);
                
                // Add lighting for the model
                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
                directionalLight.position.set(-5, 5, 5);
                directionalLight.visible = false;
                this.scene.add(directionalLight);
                this.spaghettiModel.userData.directionalLight = directionalLight;
                
                // Add the model to the scene but start hidden
                this.spaghettiModel.visible = false;
                this.scene.add(this.spaghettiModel);
                
                // Create funny arrow
                this.createSpaghettiArrow();
                
                console.log('✅ Flying Spaghetti Monster model loaded');
            },
            (progress) => {
                console.log('Loading Spaghetti Monster:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading Spaghetti Monster:', error);
            }
        );
    }

    /**
     * Create funny arrow pointing at spaghetti monster
     */
    createSpaghettiArrow() {
        // Create canvas for the arrow and text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;
        
        // Draw funny arrow pointing to spaghetti monster
        context.fillStyle = '#ff6b6b';
        context.strokeStyle = '#ffffff';
        context.lineWidth = 6;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        
        // Draw arrow pointing left
        const arrowX = 50;
        const arrowY = 128;
        const arrowLength = 200;
        const arrowHeadSize = 30;
        
        const shaftY = arrowY + 6;
        context.beginPath();
        context.moveTo(arrowX + arrowLength, shaftY);
        context.lineTo(arrowX, shaftY);
        context.stroke();
        
        // Arrow head
        context.beginPath();
        context.moveTo(arrowX, shaftY);
        context.lineTo(arrowX + arrowHeadSize, shaftY - arrowHeadSize/2);
        context.lineTo(arrowX + arrowHeadSize, shaftY + arrowHeadSize/2);
        context.closePath();
        context.fill();
        context.stroke();
        
        // Add shadow for depth
        context.shadowColor = 'rgba(0, 0, 0, 0.5)';
        context.shadowBlur = 8;
        context.shadowOffsetX = 4;
        context.shadowOffsetY = 4;
        
        // Draw text
        context.fillStyle = '#ffffff';
        context.font = 'bold 34px "Arial", sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        const textLine1Y = arrowY - 78;
        const textLine2Y = arrowY - 44;
        context.fillText('Vibe Code', arrowX + arrowLength/2, textLine1Y);
        context.fillText('Spaghetti!', arrowX + arrowLength/2, textLine2Y);
        
        // Reset shadow
        context.shadowColor = 'transparent';
        context.shadowBlur = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        
        // Create texture from canvas
        const arrowTexture = new THREE.CanvasTexture(canvas);
        arrowTexture.needsUpdate = true;
        
        // Create 3D plane for the arrow
        const arrowGeometry = new THREE.PlaneGeometry(4, 2);
        const arrowMaterial = new THREE.MeshBasicMaterial({
            map: arrowTexture,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        this.spaghettiArrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        this.spaghettiArrow.position.set(3, 0, -8);
        this.spaghettiArrow.visible = false;
        this.scene.add(this.spaghettiArrow);
        
        console.log('✅ Spaghetti arrow created');
    }

    /**
     * Show Goku model
     */
    showGoku() {
        if (this.gokuModel && !this.gokuVisible) {
            this.gokuModel.visible = true;
            this.gokuEntranceTime = 0;
            this.gokuEntranceComplete = false;
            
            if (this.gokuModel.userData.directionalLight) {
                this.gokuModel.userData.directionalLight.visible = true;
            }
            
            // Show energy particles
            this.gokuEnergyParticles.forEach(particle => {
                particle.visible = true;
            });
            
            this.gokuVisible = true;
            console.log('🥋 Goku Super Saiyan appears!');
        }
    }

    /**
     * Hide Goku model
     */
    hideGoku() {
        if (this.gokuModel && this.gokuVisible) {
            this.gokuModel.visible = false;
            this.gokuEntranceComplete = false;
            
            if (this.gokuModel.userData.directionalLight) {
                this.gokuModel.userData.directionalLight.visible = false;
            }
            
            // Hide energy particles
            this.gokuEnergyParticles.forEach(particle => {
                particle.visible = false;
            });
            
            this.gokuVisible = false;
            console.log('🥋 Goku Super Saiyan disappears!');
        }
    }

    /**
     * Show Spaghetti Monster and arrow
     */
    showSpaghetti() {
        if (this.spaghettiModel && !this.spaghettiVisible) {
            this.spaghettiModel.visible = true;
            if (this.spaghettiModel.userData.directionalLight) {
                this.spaghettiModel.userData.directionalLight.visible = true;
            }
            console.log('🍝 Flying Spaghetti Monster appears!');
        }
        
        if (this.spaghettiArrow && !this.spaghettiVisible) {
            this.spaghettiArrow.visible = true;
            console.log('🏹 Spaghetti arrow appears!');
        }
        
        this.spaghettiVisible = true;
    }

    /**
     * Hide Spaghetti Monster and arrow
     */
    hideSpaghetti() {
        if (this.spaghettiModel && this.spaghettiVisible) {
            this.spaghettiModel.visible = false;
            if (this.spaghettiModel.userData.directionalLight) {
                this.spaghettiModel.userData.directionalLight.visible = false;
            }
            console.log('🍝 Flying Spaghetti Monster disappears!');
        }
        
        if (this.spaghettiArrow && this.spaghettiVisible) {
            this.spaghettiArrow.visible = false;
            console.log('🏹 Spaghetti arrow disappears!');
        }
        
        this.spaghettiVisible = false;
    }

    /**
     * Animate models
     */
    animate(time) {
        this.animateGoku(time);
        this.animateSpaghetti(time);
    }

    /**
     * Animate Goku model
     */
    animateGoku(time) {
        if (this.gokuModel && this.gokuVisible) {
            if (!this.gokuEntranceComplete) {
                this.gokuEntranceTime += 0.016;
                
                // Super-powered entrance animation
                if (this.gokuEntranceTime < 1.0) {
                    const scaleProgress = this.gokuEntranceTime / 1.0;
                    const easeOut = 1 - Math.pow(1 - scaleProgress, 3);
                    const currentScale = 0.1 + (0.4 - 0.1) * easeOut;
                    this.gokuModel.scale.setScalar(currentScale);
                    
                    // Add dramatic rotation during entrance
                    this.gokuModel.rotation.y = Math.sin(this.gokuEntranceTime * 10) * 0.2 * (1 - scaleProgress);
                    
                    // Add vertical bounce effect
                    const bounceHeight = Math.sin(this.gokuEntranceTime * Math.PI) * 0.5;
                    this.gokuModel.position.y = -4 + bounceHeight;
                } else {
                    // Entrance complete - normal floating
                    this.gokuModel.scale.setScalar(0.4);
                    this.gokuModel.rotation.y = 0;
                    this.gokuModel.position.y = -4 + Math.sin(time * 0.5) * 0.1;
                    this.gokuEntranceComplete = true;
                }
            } else {
                // Normal floating motion after entrance
                this.gokuModel.position.y = -4 + Math.sin(time * 0.5) * 0.1;
            }
            
            // Animate energy particles
            this.gokuEnergyParticles.forEach((particle, index) => {
                if (particle.visible) {
                    const userData = particle.userData;
                    
                    // Orbital motion around Goku
                    userData.angle += userData.speed * 0.02;
                    particle.position.x = Math.cos(userData.angle) * userData.radius;
                    particle.position.z = -15 + Math.sin(userData.angle) * userData.radius;
                    
                    // Floating motion
                    particle.position.y = userData.originalY + Math.sin(time * 3 + index * 0.5) * 0.8;
                    
                    // Pulsing opacity
                    particle.material.opacity = 0.7 + Math.sin(time * 4 + index * 0.3) * 0.3;
                    
                    // Color shifting
                    const hue = (0.1 + Math.sin(time * 3 + index * 0.2) * 0.1) % 1;
                    particle.material.color.setHSL(hue, 1, 1);
                    
                    // Scaling
                    const scale = 1 + Math.sin(time * 5 + index * 0.4) * 0.3;
                    particle.scale.setScalar(scale);
                }
            });
        }
    }

    /**
     * Animate Spaghetti Monster
     */
    animateSpaghetti(time) {
        if (this.spaghettiModel && this.spaghettiVisible) {
            // Gentle floating motion
            this.spaghettiModel.position.y = -2 + Math.sin(time * 0.4) * 0.2;
            // Slight rotation for movement
            this.spaghettiModel.rotation.y += 0.01;
            // Scale pulsing effect
            const scale = 1.2 + Math.sin(time * 0.6) * 0.05;
            this.spaghettiModel.scale.setScalar(scale);
        }

        if (this.spaghettiArrow && this.spaghettiVisible) {
            // Gentle floating motion
            this.spaghettiArrow.position.y = Math.sin(time * 0.3) * 0.1;
            // Slight rotation for movement
            this.spaghettiArrow.rotation.z = Math.sin(time * 0.2) * 0.05;
            // Scale pulsing effect
            const scale = 1 + Math.sin(time * 0.8) * 0.1;
            this.spaghettiArrow.scale.setScalar(scale);
        }
    }

    /**
     * Get Goku model
     */
    getGokuModel() {
        return this.gokuModel;
    }

    /**
     * Get Spaghetti model
     */
    getSpaghettiModel() {
        return this.spaghettiModel;
    }

    /**
     * Check if Goku is visible
     */
    isGokuVisible() {
        return this.gokuVisible;
    }

    /**
     * Check if Spaghetti is visible
     */
    isSpaghettiVisible() {
        return this.spaghettiVisible;
    }
}
