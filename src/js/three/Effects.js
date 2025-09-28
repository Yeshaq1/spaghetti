/**
 * Effects.js - Visual Effects and Particle Systems
 * Handles starfield, aurora, shockwaves, and other visual effects
 */

export class Effects {
    constructor(scene) {
        this.scene = scene;
        
        // Effect references
        this.starfield = null;
        this.auroraMesh = null;
        this.shockwaves = [];
        
        // Performance settings
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Initialize visual effects
     */
    init() {
        this.createStarfield();
        this.createAurora();
        console.log('✅ Effects initialized');
        return this;
    }

    /**
     * Create starfield background
     */
    createStarfield() {
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            positions[i3 + 0] = (Math.random() - 0.5) * 400;
            positions[i3 + 1] = (Math.random() - 0.5) * 400;
            positions[i3 + 2] = -Math.random() * 600 - 50;
        }
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const mat = new THREE.PointsMaterial({
            color: 0x93c5fd,
            size: 0.6,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8,
            vertexColors: false,
            blending: THREE.AdditiveBlending
        });
        
        this.starfield = new THREE.Points(geo, mat);
        this.starfield.position.z = -50;
        this.scene.add(this.starfield);
        
        console.log('✅ Starfield created');
    }

    /**
     * Create aurora shader plane
     */
    createAurora() {
        const geo = new THREE.PlaneGeometry(100, 60, 1, 1);
        const mat = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
                time: { value: 0 },
                intensity: { value: 0.6 },
                colorA: { value: new THREE.Color(0x73fbd3) },
                colorB: { value: new THREE.Color(0x8a7efc) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;
                varying vec2 vUv;
                uniform float time; 
                uniform float intensity;
                uniform vec3 colorA;
                uniform vec3 colorB;
                
                float hash(vec2 p) {
                    return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
                } 
                
                float noise(vec2 p) {
                    vec2 i = floor(p); 
                    vec2 f = fract(p);
                    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
                    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
                }
                
                float fbm(vec2 p) {
                    float v = 0.0; 
                    float amp = 0.5; 
                    for(int i = 0; i < 5; i++) {
                        v += amp * noise(p); 
                        p *= 2.05; 
                        amp *= 0.5;
                    }
                    return v;
                }
                
                void main() {
                    vec2 uv = vUv * vec2(1.6, 1.0);
                    uv.x += sin(uv.y * 3.1415 + time * 0.25) * 0.08;
                    float n = fbm(uv * 2.0 + vec2(0.0, time * 0.12));
                    float band = smoothstep(0.35, 0.9, n) * intensity;
                    vec3 col = mix(colorA, colorB, n);
                    gl_FragColor = vec4(col * band, band * 0.6);
                }
            `
        });
        
        this.auroraMesh = new THREE.Mesh(geo, mat);
        this.auroraMesh.position.set(0, 0, -45);
        this.scene.add(this.auroraMesh);
        
        console.log('✅ Aurora plane created');
    }

    /**
     * Create a shockwave expanding ring
     */
    createShockwave(x, y, z) {
        const geo = new THREE.RingGeometry(0.01, 0.05, 64);
        const mat = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: { 
                time: { value: 0 }, 
                alpha: { value: 0.9 }, 
                color: { value: new THREE.Color(0x73fbd3) } 
            },
            vertexShader: `
                varying vec2 vUv; 
                void main() { 
                    vUv = uv; 
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
                }
            `,
            fragmentShader: `
                varying vec2 vUv; 
                uniform float time; 
                uniform float alpha; 
                uniform vec3 color; 
                void main() { 
                    float d = length(vUv - 0.5); 
                    float edge = smoothstep(0.5, 0.48, d); 
                    gl_FragColor = vec4(color, alpha * edge); 
                }
            `
        });
        
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.userData = { life: 0 };
        this.scene.add(mesh);
        this.shockwaves.push(mesh);
        
        console.log('💥 Shockwave created at', x, y, z);
    }

    /**
     * Animate all effects
     */
    animate(time, pointer) {
        this.animateStarfield(time, pointer);
        this.animateAurora(time);
        this.animateShockwaves();
    }

    /**
     * Animate starfield
     */
    animateStarfield(time, pointer) {
        if (this.starfield) {
            this.starfield.rotation.z += 0.0002;
            this.starfield.position.x = pointer.x * -5;
            this.starfield.position.y = pointer.y * -3;
        }
    }

    /**
     * Animate aurora
     */
    animateAurora(time) {
        if (this.auroraMesh) {
            this.auroraMesh.material.uniforms.time.value = time;
        }
    }

    /**
     * Animate shockwaves
     */
    animateShockwaves() {
        if (this.shockwaves.length === 0) return;
        
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const mesh = this.shockwaves[i];
            mesh.userData.life += 0.02;
            mesh.scale.x = mesh.scale.y = 1 + mesh.userData.life * 8;
            
            const mat = mesh.material;
            mat.uniforms.alpha.value = Math.max(0, 0.9 - mesh.userData.life * 0.9);
            
            if (mat.uniforms.alpha.value <= 0.01) {
                this.scene.remove(mesh);
                this.shockwaves.splice(i, 1);
            }
        }
    }

    /**
     * Get starfield reference
     */
    getStarfield() {
        return this.starfield;
    }

    /**
     * Get aurora mesh reference
     */
    getAurora() {
        return this.auroraMesh;
    }

    /**
     * Get shockwaves array
     */
    getShockwaves() {
        return this.shockwaves;
    }

    /**
     * Clear all shockwaves
     */
    clearShockwaves() {
        this.shockwaves.forEach(mesh => {
            this.scene.remove(mesh);
        });
        this.shockwaves = [];
    }

    /**
     * Create click shockwave at center
     */
    createClickShockwave() {
        this.createShockwave(0, 0, -6);
    }
}
