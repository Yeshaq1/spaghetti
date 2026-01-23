/**
 * Models.js - 3D Model Loading and Management
 * Handles loading and animation of 3D models (Spaghetti Monster, etc.)
 */

export class Models {
    constructor(scene) {
        this.scene = scene;
        
        // Model references
        this.spaghettiModel = null;
        this.spaghettiArrow = null;
        
        // Model states
        this.spaghettiVisible = false;
    }

    /**
     * Initialize models
     */
    init() {
        this.loadSpaghettiModel();
        return this;
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
                
            },
            (progress) => {
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
        }
        
        if (this.spaghettiArrow && !this.spaghettiVisible) {
            this.spaghettiArrow.visible = true;
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
        }
        
        if (this.spaghettiArrow && this.spaghettiVisible) {
            this.spaghettiArrow.visible = false;
        }
        
        this.spaghettiVisible = false;
    }

    /**
     * Animate models
     */
    animate(time) {
        this.animateSpaghetti(time);
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
     * Get Spaghetti model
     */
    getSpaghettiModel() {
        return this.spaghettiModel;
    }

    /**
     * Check if Spaghetti is visible
     */
    isSpaghettiVisible() {
        return this.spaghettiVisible;
    }
}
