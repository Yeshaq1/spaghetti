/**
 * AI AI AI - Clean & Simple Implementation
 * Focus: Video fade + Story sections on scroll
 */

// Simple global state
let scene, camera, renderer, video, videoTexture, videoPlane;
// Postprocessing
let composer, renderPass, bloomPass, fxaaPass, filmPass, scanlinePass;
// Immersive elements
let starfield = null;
// let neonRings = []; // Removed - user doesn't like this effect
let auroraMesh = null;
let shockwaves = [];
let gokuModel = null;
let gokuEntranceTime = 0;
let gokuEntranceComplete = false;
let gokuEnergyParticles = [];
let spaghettiArrow = null;
let emVideo = null;
let emVideoElement = null;
let spaghettiModel = null;
// Interaction state
let pointer = { x: 0, y: 0 };
let pointerTarget = { x: 0, y: 0 };
let currentScrollProgress = 0;
// Audio reactive
let audioContext = null, analyserNode = null, audioDataArray = null, audioReady = false;
let sections = [];
let speechBubbles = [];
let typewriterElement = null;
let a1VideoElement = null;
// Audio management
let audioPermissionGranted = false;
let audioPermissionPrompt = null;
let audioControlButton = null;
let isAudioMuted = false;
let introModal = null;
let enterButton = null;
// Hamburger menu
let menuTrigger = null;
let menuOverlay = null;
let isMenuOpen = false;
let menuAnimationInProgress = false;

// Centralized audio helpers
function setMediaAudio(element, shouldBeMuted, targetVolume) {
    if (!element) return;
    element.muted = !!shouldBeMuted;
    element.volume = shouldBeMuted ? 0 : targetVolume;
}

async function ensureAudioContextResumed() {
    try {
        if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
        }
    } catch (_) {}
}

function applyAudioState() {
    const effectiveMuted = isAudioMuted || !audioPermissionGranted;
    setMediaAudio(video, effectiveMuted, CONFIG.videoVolume);
    setMediaAudio(a1VideoElement, effectiveMuted, 0.8);
    setMediaAudio(emVideoElement, effectiveMuted, 0.8);

    if (audioControlButton) {
        if (effectiveMuted) {
            audioControlButton.innerHTML = '<span>🔇</span>';
            audioControlButton.style.color = 'rgba(255, 255, 255, 0.6)';
            audioControlButton.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        } else {
            audioControlButton.innerHTML = '<span>🔊</span>';
            audioControlButton.style.color = '#73fbd3';
            audioControlButton.style.borderColor = 'rgba(115, 251, 211, 0.3)';
        }
    }
}

// Simple configuration
const CONFIG = {
    videoPath: 'assets/videoplayback.mp4',
    videoVolume: 0.7,
    textContent: ['AI', 'AI', 'AI', 'AI', 'AI', 'AI'] // More AIs for a crowd effect
};

// Initialize everything
function init() {
    console.log('🚀 Starting clean AI experience...');
    
    createScene();
    createVideo();
	createStarfield();
	createAurora();
	// createNeonRings(); // Removed - user doesn't like this effect
	loadGokuModel();
	gokuEnergyParticles = createGokuEnergyParticles();
	loadSpaghettiModel();
	createEmVideo();
	setupPostprocessing();
    // createSpeechBubbles(); // Disabled - no more AI bubbles
    createTypewriterEffect();
    createA1Video();
    setupScrolling();
	setupInteractions();
    createIntroModal();
    createHamburgerMenu();
    // createAudioControlButton(); // Moved to after modal is dismissed
    startAnimation();
    
    console.log('✅ Clean experience ready!');
}

// Simple Three.js scene
function createScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 8); // Move camera back so we can see everything
    
    const canvas = document.getElementById('three-canvas');
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Simple lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    console.log('✅ Scene created');
}

// WebGL video with curve and effects
function createVideo() {
    video = document.createElement('video');
    video.src = CONFIG.videoPath;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true; // Start muted for autoplay
    video.volume = 0; // Start with no volume until permission granted
    
    // Try to play immediately
    video.play().catch(console.log);
    
	// Create video texture
	videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    
    // Create curved geometry for cinematic effect - smaller size
    const geometry = new THREE.PlaneGeometry(8, 4.5, 32, 32); // Smaller video plane
    
    // Add slight curve to the video plane
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        positions[i + 2] += Math.sin(x * 0.1) * 0.3 + Math.sin(y * 0.1) * 0.2; // Subtle curve
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Create material with glow effect
    const material = new THREE.MeshLambertMaterial({
        map: videoTexture,
        emissive: new THREE.Color(0x111111),
        emissiveMap: videoTexture,
        transparent: true,
        opacity: 1
    });
    
    videoPlane = new THREE.Mesh(geometry, material);
    videoPlane.position.set(0, 0, 0); // Center the video plane
    scene.add(videoPlane);
    
    // Add ambient lighting for the glow effect
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x73fbd3, 0.5, 100);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);
    
    // Audio is now managed by the permission system
    
    console.log('✅ WebGL Video with curves created');
}


// Subtle starfield background
function createStarfield() {
	const starCount = 2000;
	const positions = new Float32Array(starCount * 3);
	for (let i = 0; i < starCount; i++) {
		const i3 = i * 3;
		positions[i3 + 0] = (Math.random() - 0.5) * 400;
		positions[i3 + 1] = (Math.random() - 0.5) * 400;
		positions[i3 + 2] = -Math.random() * 600 - 50; // push back
	}
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	const mat = new THREE.PointsMaterial({
		color: 0x93c5fd,
		size: 0.6,
		sizeAttenuation: true,
		transparent: true,
		opacity: 0.8,
		blending: THREE.AdditiveBlending
	});
	starfield = new THREE.Points(geo, mat);
	starfield.position.z = -50;
	scene.add(starfield);
	console.log('✅ Starfield created');
}

// Aurora shader plane behind rings
function createAurora() {
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
			// simple hash noise
			float hash(vec2 p){return fract(sin(dot(p, vec2(41.3, 289.1)))*43758.5453);} 
			float noise(vec2 p){
				vec2 i=floor(p); vec2 f=fract(p);
				float a=hash(i), b=hash(i+vec2(1.0,0.0));
				float c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));
				vec2 u=f*f*(3.0-2.0*f);
				return mix(a,b,u.x)+ (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
			}
			float fbm(vec2 p){
				float v=0.0; float amp=0.5; 
				for(int i=0;i<5;i++){v+=amp*noise(p); p*=2.05; amp*=0.5;}
				return v;
			}
			void main(){
				vec2 uv = vUv*vec2(1.6,1.0);
				uv.x += sin(uv.y*3.1415+time*0.25)*0.08;
				float n = fbm(uv*2.0 + vec2(0.0, time*0.12));
				float band = smoothstep(0.35, 0.9, n) * intensity;
				vec3 col = mix(colorA, colorB, n);
				gl_FragColor = vec4(col * band, band*0.6);
			}
		`
	});
	auroraMesh = new THREE.Mesh(geo, mat);
	auroraMesh.position.set(0, 0, -45);
	scene.add(auroraMesh);
	console.log('✅ Aurora plane created');
}

// Load Goku Super Saiyan 3D model
function loadGokuModel() {
	const loader = new THREE.GLTFLoader();
	loader.load(
		'assets/goku_super_saiyan.glb',
		function(gltf) {
			gokuModel = gltf.scene;
			
			// Scale and position the model
			gokuModel.scale.setScalar(0.4); // A little bigger
			gokuModel.position.set(0, -4, -15); // Position lower and behind the video
			
			// Add some lighting for the model (only when model is visible)
			const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
			directionalLight.position.set(5, 5, 5);
			directionalLight.visible = false; // Start hidden
			scene.add(directionalLight);
			gokuModel.userData.directionalLight = directionalLight; // Store reference
			
			// Add the model to the scene but start hidden and scaled down for entrance
			gokuModel.visible = false;
			gokuModel.scale.setScalar(0.1); // Start very small for entrance effect
			scene.add(gokuModel);
			
			console.log('✅ Goku Super Saiyan model loaded');
			
		},
		function(progress) {
			console.log('Loading Goku model:', (progress.loaded / progress.total * 100) + '%');
		},
		function(error) {
			console.error('Error loading Goku model:', error);
		}
	);
}

// Create energy particles around Goku
function createGokuEnergyParticles() {
	const particleCount = 50;
	const particles = [];
	
	for (let i = 0; i < particleCount; i++) {
		const particle = new THREE.Mesh(
			new THREE.SphereGeometry(0.08, 8, 8), // Much larger particles
			new THREE.MeshBasicMaterial({
				color: new THREE.Color().setHSL(0.1, 1, 1), // Brighter golden energy color
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
		scene.add(particle);
		particles.push(particle);
	}
	
	return particles;
}


// Create funny arrow pointing at spaghetti monster
function createSpaghettiArrow() {
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
	
	// Draw arrow pointing left (towards spaghetti monster)
	const arrowX = 50;
	const arrowY = 128;
	const arrowLength = 200;
	const arrowHeadSize = 30;
	
	// Arrow shaft (move slightly lower to allow more gap from text)
	const shaftY = arrowY + 6;
	context.beginPath();
	context.moveTo(arrowX + arrowLength, shaftY);
	context.lineTo(arrowX, shaftY);
	context.stroke();
	
	// Arrow head (align with shaftY)
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
	
	// Funny text (raise text to create more space from the arrow line)
	const textLine1Y = arrowY - 78; // previously -40
	const textLine2Y = arrowY - 44; // previously -10
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
	
	spaghettiArrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
	spaghettiArrow.position.set(3, 0, -8); // Position further to the right to point at the monster
	spaghettiArrow.visible = false; // Start hidden
	scene.add(spaghettiArrow);
	
	console.log('✅ Spaghetti arrow created');
}

// Load Flying Spaghetti Monster 3D model
function loadSpaghettiModel() {
	const loader = new THREE.GLTFLoader();
	loader.load(
		'assets/the_flying_spaghetti_monster.glb',
		function(gltf) {
			spaghettiModel = gltf.scene;
			
			// Scale and position the model
			spaghettiModel.scale.setScalar(1.2); // Even bigger!
			spaghettiModel.position.set(0, -2, -10); // Center the monster
			
			// Add some lighting for the model
			const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
			directionalLight.position.set(-5, 5, 5);
			directionalLight.visible = false;
			scene.add(directionalLight);
			spaghettiModel.userData.directionalLight = directionalLight;
			
			// Add the model to the scene but start hidden
			spaghettiModel.visible = false;
			scene.add(spaghettiModel);
			
			console.log('✅ Flying Spaghetti Monster model loaded');
			
			// Create funny arrow and text pointing at spaghetti monster
			createSpaghettiArrow();
		},
		function(progress) {
			console.log('Loading Spaghetti Monster:', (progress.loaded / progress.total * 100) + '%');
		},
		function(error) {
			console.error('Error loading Spaghetti Monster:', error);
		}
	);
}

// Create EM video element
function createEmVideo() {
	// Create EM video element
	emVideoElement = document.createElement('video');
	emVideoElement.src = 'assets/em.mp4';
	emVideoElement.crossOrigin = 'anonymous';
	emVideoElement.loop = true;
	emVideoElement.muted = true;
	emVideoElement.volume = 0.8;
	emVideoElement.playsInline = true;

	// Video styling - position in container below news image
	emVideoElement.style.position = 'relative';
	emVideoElement.style.width = '100%';
	emVideoElement.style.maxWidth = window.innerWidth <= 768 ? '400px' : '500px';
	emVideoElement.style.height = 'auto';
	emVideoElement.style.margin = '0 auto';
	emVideoElement.style.display = 'block';
	emVideoElement.style.borderRadius = '15px';
	emVideoElement.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
	emVideoElement.style.opacity = '0';
	emVideoElement.style.transition = 'opacity 1s ease-in-out';
	emVideoElement.style.pointerEvents = 'none';
	
	// Add to mobile container
	const mobileContainer = document.getElementById('mobile-video-container');
	if (mobileContainer) {
		mobileContainer.appendChild(emVideoElement);
	} else {
		// Fallback to body if container not found
		document.body.appendChild(emVideoElement);
	}

	// Initialize WebAudio analyser for audio-reactive visuals
	try {
		if (!audioContext) {
			audioContext = new (window.AudioContext || window.webkitAudioContext)();
		}
		const source = audioContext.createMediaElementSource(emVideoElement);
		analyserNode = audioContext.createAnalyser();
		analyserNode.fftSize = 256;
		audioDataArray = new Uint8Array(analyserNode.frequencyBinCount);
		source.connect(analyserNode);
		analyserNode.connect(audioContext.destination);
		audioReady = true;
		console.log('✅ EM video audio analyser ready');
	} catch (e) {
		console.log('EM video audio analyser not available:', e);
	}

	console.log('✅ EM video created');
}

// Handle window resize for video positioning
function handleVideoResize() {
	if (!emVideoElement) return;
	
	const mobileContainer = document.getElementById('mobile-video-container');
	
	// Ensure video is in the correct container
	if (mobileContainer && emVideoElement.parentNode !== mobileContainer) {
		// Update max width based on screen size
		emVideoElement.style.maxWidth = window.innerWidth <= 768 ? '400px' : '500px';
		
		// Move to mobile container
		mobileContainer.appendChild(emVideoElement);
		console.log('📱 Video repositioned in container');
	}
}

// Neon ring corridor - REMOVED (user doesn't like this effect)
// function createNeonRings() {
// 	const ringCount = 18;
// 	for (let i = 0; i < ringCount; i++) {
// 		const radius = 6.5 + Math.sin(i * 0.3) * 0.4;
// 		const tube = 0.035; // thicker so it doesn't collapse to a line
// 		const geo = new THREE.TorusGeometry(radius, tube, 16, 128);
// 		const colorMix = i / ringCount;
// 		const color = new THREE.Color().setHSL(0.55 + 0.25 * colorMix, 1.0, 0.6);
// 		const mat = new THREE.MeshBasicMaterial({
// 			color,
// 			transparent: true,
// 			opacity: 0.55,
// 			blending: THREE.AdditiveBlending,
// 			depthWrite: false
// 		});
// 		const ring = new THREE.Mesh(geo, mat);
// 		ring.position.set(0, 0, -i * 2 - 8); // bring corridor closer, tighter spacing
// 		ring.rotation.x = 0; // face camera to avoid edge-on collapse
// 		ring.userData.baseZ = ring.position.z;
// 		scene.add(ring);
// 		neonRings.push(ring);
// 	}
// 	console.log('✅ Neon ring corridor created');
// }

// Postprocessing: composer + bloom + FXAA
function setupPostprocessing() {
	try {
	composer = new THREE.EffectComposer(renderer);
	renderPass = new THREE.RenderPass(scene, camera);
	composer.addPass(renderPass);

	bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.8, 0.85);
	composer.addPass(bloomPass);

	// Film (grain + scanlines)
	filmPass = new THREE.FilmPass(0.18, 0.35, 512, false);
	filmPass.renderToScreen = false;
	composer.addPass(filmPass);

	// Optional extra subtle scanlines overlay
	const ScanlineShader = {
		uniforms: { tDiffuse: { value: null }, opacity: { value: 0.07 }, density: { value: 2.0 } },
		vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
		fragmentShader: `uniform sampler2D tDiffuse; uniform float opacity; uniform float density; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); float s = sin(vUv.y * 3.14159 * 100.0 * density) * 0.5 + 0.5; c.rgb *= mix(1.0, 0.96, s*opacity); gl_FragColor = c; }`
	};
	scanlinePass = new THREE.ShaderPass(ScanlineShader);
	composer.addPass(scanlinePass);

	fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
	fxaaPass.material.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
	composer.addPass(fxaaPass);
	console.log('✅ Postprocessing ready');
	} catch (error) {
		console.warn('Postprocessing setup failed, falling back to basic rendering:', error);
		composer = null;
	}
}

function setupInteractions() {
	window.addEventListener('mousemove', (e) => {
		const nx = (e.clientX / window.innerWidth) * 2 - 1;
		const ny = (e.clientY / window.innerHeight) * 2 - 1;
		pointerTarget.x = nx;
		pointerTarget.y = ny;
	});

	// Prepare/resume audio context on user gesture
	window.addEventListener('click', () => {
		if (audioContext && audioContext.state === 'suspended') audioContext.resume();
		// Create a shockwave at center on click
		createShockwave(0, 0, -6);
	});
}

// Create a shockwave expanding ring
function createShockwave(x, y, z) {
	const geo = new THREE.RingGeometry(0.01, 0.05, 64);
	const mat = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		uniforms: { time: { value: 0 }, alpha: { value: 0.9 }, color: { value: new THREE.Color(0x73fbd3) } },
		vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
		fragmentShader: `varying vec2 vUv; uniform float time; uniform float alpha; uniform vec3 color; void main(){ float d = length(vUv - 0.5); float edge = smoothstep(0.5, 0.48, d); gl_FragColor = vec4(color, alpha * edge); }`
	});
	const m = new THREE.Mesh(geo, mat);
	m.position.set(x, y, z);
	m.userData = { life: 0 };
	scene.add(m);
	shockwaves.push(m);
}

// Trigger a short glitch burst
// (Glitch removed)

// Create floating speech bubbles with "AI" text
function createSpeechBubbles() {
    const bubbleCount = 50;
    
    for (let i = 0; i < bubbleCount; i++) {
        // Create "AI" text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        // Draw cartoonish speech bubble with more character
        context.fillStyle = '#ffffff';
        context.strokeStyle = '#333333';
        context.lineWidth = 6;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        
        // Draw main bubble with more rounded corners and slight irregularity
        const x = 20, y = 20, width = 216, height = 88, radius = 45;
        
        // Add slight waviness to make it more organic
        const waveOffset = Math.sin(i * 0.5) * 3;
        
        context.beginPath();
        context.moveTo(x + radius + waveOffset, y);
        context.lineTo(x + width - radius - waveOffset, y);
        context.quadraticCurveTo(x + width + waveOffset, y, x + width + waveOffset, y + radius);
        context.lineTo(x + width + waveOffset, y + height - radius);
        context.quadraticCurveTo(x + width + waveOffset, y + height, x + width - radius - waveOffset, y + height);
        context.lineTo(x + radius - waveOffset, y + height);
        context.quadraticCurveTo(x - waveOffset, y + height, x - waveOffset, y + height - radius);
        context.lineTo(x - waveOffset, y + radius);
        context.quadraticCurveTo(x - waveOffset, y, x + radius + waveOffset, y);
        context.closePath();
        
        // Add shadow for depth
        context.shadowColor = 'rgba(0, 0, 0, 0.3)';
        context.shadowBlur = 8;
        context.shadowOffsetX = 4;
        context.shadowOffsetY = 4;
        context.fill();
        
        // Reset shadow for stroke
        context.shadowColor = 'transparent';
        context.shadowBlur = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.stroke();
        
        // No tail/arrow - just clean rounded rectangles
        
        // Draw "AI" text with better font and colors
        context.fillStyle = '#000000';
        context.font = 'bold 48px "Helvetica Neue", Arial, sans-serif';
        context.textAlign = 'center';
        
        // Add text shadow for better readability
        context.shadowColor = 'rgba(0, 0, 0, 0.3)';
        context.shadowBlur = 6;
        context.shadowOffsetX = 3;
        context.shadowOffsetY = 3;
        
        // Slight text rotation for more character
        const textRotation = Math.sin(i * 0.7) * 0.1;
        context.save();
        context.translate(128, 70);
        context.rotate(textRotation);
        context.fillText('AI', 0, 0);
        context.restore();
        
        // Reset shadow
        context.shadowColor = 'transparent';
        context.shadowBlur = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // Create text plane (bigger)
        const textGeometry = new THREE.PlaneGeometry(1.2, 0.6);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0
        });
        
        const bubble = new THREE.Mesh(textGeometry, textMaterial);
        
        // Position more distributed across the entire screen
        const screenWidth = 20;  // Wider distribution
        const screenHeight = 15; // Taller distribution
        const depth = 8;         // More depth variation
        
        bubble.position.set(
            (Math.random() - 0.5) * screenWidth,
            (Math.random() - 0.5) * screenHeight,
            (Math.random() - 0.5) * depth
        );
        
        // Start invisible and small for pop effect
        bubble.visible = false;
        bubble.scale.setScalar(0.1);
        
        // Add animation properties
        bubble.userData = {
            popDelay: Math.random() * 1000, // Random delay for staggered appearance
            popTime: 0,
            isPopping: false,
            hasPopped: false
        };
        
        // Add to scene
        scene.add(bubble);
        speechBubbles.push(bubble);
    }
    
    console.log('✅ Speech bubbles created');
}

// Typewriter effect function
function createTypewriterEffect() {
    // Create typewriter container
    typewriterElement = document.createElement('div');
    typewriterElement.style.position = 'fixed';
    typewriterElement.style.top = '50%';
    typewriterElement.style.left = '50%';
    typewriterElement.style.transform = 'translate(-50%, -50%)';
    typewriterElement.style.zIndex = '1001';
    typewriterElement.style.opacity = '0';
    typewriterElement.style.transition = 'opacity 0.5s ease-in-out';
    typewriterElement.style.pointerEvents = 'none';
    typewriterElement.style.maxWidth = '90vw';
    typewriterElement.style.textAlign = 'center';
    
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
    typewriterElement.appendChild(terminal);
    
    // Add CSS animations
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
		/* Glitch effect */
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
		/* Optional: disable clone layers to avoid perceived duplicate text */
		.glitch-no-clone::before,
		.glitch-no-clone::after { display: none; }
	`;
    document.head.appendChild(style);
    
    document.body.appendChild(typewriterElement);
    
    console.log('✅ Futuristic typewriter effect created');
}

// Typewriter animation
function startTypewriter(text, speed = 80) {
    if (!typewriterElement) return;
    
    const textElement = document.getElementById('typewriter-text');
    const cursorElement = document.getElementById('typewriter-cursor');
    if (!textElement || !cursorElement) return;
	
	// Ensure glitch effect is removed for normal typing
	textElement.classList.remove('glitch');
	textElement.removeAttribute('data-text');
	cursorElement.style.opacity = '1';
    
    typewriterElement.style.opacity = '1';
    textElement.textContent = '';
    
    // Add subtle glow effect to the paper
    const paper = typewriterElement.querySelector('div');
    if (paper) {
        paper.style.animation = 'typewriterGlow 2s ease-in-out infinite';
    }
    
    let i = 0;
    
    function typeNextChar() {
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
            const variation = Math.random() * 20 - 10; // ±10ms variation
            delay += variation;
            
            setTimeout(typeNextChar, delay);
        } else {
            // Hide cursor after typing is complete
            setTimeout(() => {
                if (cursorElement) {
                    cursorElement.style.opacity = '0';
                }
            }, 2000);
        }
    }
    
    // Start typing
    typeNextChar();
    
    console.log('✅ Typewriter started:', text);
}

// Glitch text animation (instant text with error/glitch effect)
function startGlitchText(text) {
	if (!typewriterElement) return;

	const textElement = document.getElementById('typewriter-text');
	const cursorElement = document.getElementById('typewriter-cursor');
	if (!textElement || !cursorElement) return;

	typewriterElement.style.opacity = '1';
	cursorElement.style.opacity = '0';
	textElement.textContent = text;
	textElement.setAttribute('data-text', text);
	textElement.classList.remove('glitch');
	textElement.classList.add('glitch', 'glitch-no-clone');

	console.log('✅ Glitch text started:', text);
}

// Create A1 video element
function createA1Video() {
    // Create A1 video element
    a1VideoElement = document.createElement('video');
    a1VideoElement.src = 'assets/a1.mp4';
    a1VideoElement.crossOrigin = 'anonymous';
    a1VideoElement.loop = true;
    a1VideoElement.muted = false; // We want audio for this one
    a1VideoElement.volume = 0.8;
    a1VideoElement.playsInline = true; // Important for mobile

    // Video styling for mobile
    a1VideoElement.style.position = 'fixed';
    a1VideoElement.style.top = '50%';
    a1VideoElement.style.left = '50%';
    a1VideoElement.style.transform = 'translate(-50%, -50%)';
    a1VideoElement.style.width = 'min(80vw, 400px)';
    a1VideoElement.style.height = 'auto';
    a1VideoElement.style.zIndex = '1002';
    a1VideoElement.style.borderRadius = '20px';
    a1VideoElement.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
    a1VideoElement.style.opacity = '0';
    a1VideoElement.style.transition = 'opacity 1s ease-in-out';
    a1VideoElement.style.pointerEvents = 'none';

    // Add to DOM
    document.body.appendChild(a1VideoElement);

	// Initialize WebAudio analyser for audio-reactive visuals
	try {
		if (!audioContext) {
			audioContext = new (window.AudioContext || window.webkitAudioContext)();
		}
		const source = audioContext.createMediaElementSource(a1VideoElement);
		analyserNode = audioContext.createAnalyser();
		analyserNode.fftSize = 256;
		audioDataArray = new Uint8Array(analyserNode.frequencyBinCount);
		source.connect(analyserNode);
		analyserNode.connect(audioContext.destination);
		audioReady = true;
		console.log('✅ Audio analyser ready');
	} catch (e) {
		console.log('Audio analyser not available:', e);
	}

    console.log('✅ A1 video created');
}

// Create audio permission prompt
function createIntroModal() {
    introModal = document.getElementById('introModal');
    enterButton = document.getElementById('enterButton');
    
    if (!introModal || !enterButton) {
        console.error('❌ Intro modal elements not found');
        return;
    }
    
    // Prevent scrolling on the body when modal is active
    document.body.classList.add('modal-active');
    
    // Handle enter button click
    enterButton.addEventListener('click', async () => {
        try {
            // Grant audio permission
            await ensureAudioContextResumed();
            audioPermissionGranted = true;
            applyAudioState();
            
            // Re-enable scrolling on the body
            document.body.classList.remove('modal-active');
            
            // Create audio control button now that we're in the main experience
            createAudioControlButton();
            
            // Hide intro modal with smooth transition
            introModal.classList.add('hidden');
            
            // Remove modal after transition completes
            setTimeout(() => {
                if (introModal.parentNode) {
                    introModal.remove();
                }
            }, 1000);
            
            console.log('✅ Entered experience with audio permission granted');
        } catch (error) {
            console.log('❌ Audio permission denied, continuing muted:', error);
            // Still hide modal but without audio
            audioPermissionGranted = false;
            applyAudioState();
            
            // Re-enable scrolling on the body
            document.body.classList.remove('modal-active');
            
            // Create audio control button now that we're in the main experience
            createAudioControlButton();
            
            introModal.classList.add('hidden');
            setTimeout(() => {
                if (introModal.parentNode) {
                    introModal.remove();
                }
            }, 1000);
        }
    });
    
    console.log('✅ Intro modal created');
}

// Create and setup hamburger menu
function createHamburgerMenu() {
    menuTrigger = document.getElementById('menuTrigger');
    menuOverlay = document.getElementById('menuOverlay');
    
    if (!menuTrigger || !menuOverlay) {
        console.error('❌ Menu elements not found');
        return;
    }
    
    // Setup hamburger icon animation on canvas
    setupHamburgerIcon();
    
    // Setup menu text letter animations
    setupMenuLetterAnimations();
    
    // Set initial state
    menuTrigger.classList.add('is-default-out');
    
    // Add click handler
    menuTrigger.addEventListener('click', toggleMenu);
    
    // Close menu when clicking on overlay
    menuOverlay.addEventListener('click', (e) => {
        if (e.target === menuOverlay) {
            closeMenu();
        }
    });
    
    // Close menu with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMenuOpen) {
            closeMenu();
        }
    });
    
    // Add navigation handlers to menu links
    const menuLinks = menuOverlay.querySelectorAll('.main-link');
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // Handle email links normally
            if (href && href.startsWith('mailto:')) {
                closeMenu();
                return;
            }
            
            // Handle anchor links with smooth scrolling
            if (href && href.startsWith('#')) {
                e.preventDefault();
                closeMenu();
                
                // Wait for menu to close, then scroll
                setTimeout(() => {
                    const targetId = href.substring(1);
                    let targetElement = null;
                    
                    // Map menu items to actual sections
                    if (targetId === 'services') {
                        // Find the services section
                        targetElement = document.querySelector('.story-section:nth-child(12)'); // Services section
                    } else if (targetId === 'about') {
                        // Find the about section (first story section)
                        targetElement = document.querySelector('.story-section:nth-child(2)'); // First story section
                    } else if (targetId === 'experience') {
                        // Find the experience section (company logos)
                        targetElement = document.querySelector('.story-section:nth-child(10)'); // Company section
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
    
    console.log('✅ Hamburger menu created');
}

// Setup hamburger icon animation on canvas
function setupHamburgerIcon() {
    const canvas = menuTrigger.querySelector('.canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const size = 40;
    const lineHeight = 2;
    const lineSpacing = 8;
    
    function drawHamburger(progress = 0) {
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
            // Top line
            ctx.beginPath();
            ctx.moveTo(startX, centerY - lineSpacing);
            ctx.lineTo(endX, centerY - lineSpacing);
            ctx.stroke();
            
            // Middle line
            ctx.beginPath();
            ctx.moveTo(startX, centerY);
            ctx.lineTo(endX, centerY);
            ctx.stroke();
            
            // Bottom line
            ctx.beginPath();
            ctx.moveTo(startX, centerY + lineSpacing);
            ctx.lineTo(endX, centerY + lineSpacing);
            ctx.stroke();
        } else if (progress === 1) {
            // X state
            const diagonal = lineWidth * 0.7;
            const offsetX = (lineWidth - diagonal) / 2;
            
            // First diagonal
            ctx.beginPath();
            ctx.moveTo(startX + offsetX, centerY - diagonal/2);
            ctx.lineTo(startX + offsetX + diagonal, centerY + diagonal/2);
            ctx.stroke();
            
            // Second diagonal
            ctx.beginPath();
            ctx.moveTo(startX + offsetX, centerY + diagonal/2);
            ctx.lineTo(startX + offsetX + diagonal, centerY - diagonal/2);
            ctx.stroke();
        } else {
            // Animated state between hamburger and X
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            
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
    }
    
    // Initial draw
    drawHamburger(0);
    
    // Store animation function for use in menu transitions
    canvas.drawHamburger = drawHamburger;
}

// Setup letter-by-letter animations for menu items
function setupMenuLetterAnimations() {
    const menuLinks = menuOverlay.querySelectorAll('.main-link');
    
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
            letterInner.textContent = char === ' ' ? '\u00A0' : char; // Non-breaking space
            
            letter.appendChild(letterInner);
            titleElement.appendChild(letter);
        });
    });
}

// Toggle menu open/close
function toggleMenu() {
    if (menuAnimationInProgress) return;
    
    if (isMenuOpen) {
        closeMenu();
    } else {
        openMenu();
    }
}

// Open menu with animation
function openMenu() {
    if (isMenuOpen || menuAnimationInProgress) return;
    
    menuAnimationInProgress = true;
    isMenuOpen = true;
    
    // Update trigger state
    menuTrigger.classList.remove('is-default-out');
    menuTrigger.classList.add('is-menu-in');
    
    // Animate hamburger to X
    animateHamburgerIcon(0, 1, 300);
    
    // Show overlay
    menuOverlay.classList.add('menu-open');
    menuOverlay.classList.add('menu-opening');
    
    // Animate letters in
    const letters = menuOverlay.querySelectorAll('.letter');
    letters.forEach((letter, index) => {
        letter.style.opacity = '0';
        letter.style.transform = 'translateX(-100px)';
        
        setTimeout(() => {
            letter.style.opacity = '1';
            letter.style.transform = 'translateX(0)';
        }, 500 + index * 20); // Staggered animation
    });
    
    // Enable menu state after animation
    setTimeout(() => {
        menuAnimationInProgress = false;
        menuOverlay.classList.remove('menu-opening');
    }, 1000);
    
    console.log('🍔 Menu opened');
}

// Close menu with animation
function closeMenu() {
    if (!isMenuOpen || menuAnimationInProgress) return;
    
    menuAnimationInProgress = true;
    isMenuOpen = false;
    
    // Update trigger state
    menuTrigger.classList.remove('is-menu-in');
    menuTrigger.classList.add('is-default-out');
    
    // Animate X back to hamburger
    animateHamburgerIcon(1, 0, 300);
    
    // Add closing animation class
    menuOverlay.classList.add('menu-closing');
    
    // Animate letters out
    const letters = menuOverlay.querySelectorAll('.letter');
    letters.forEach((letter, index) => {
        setTimeout(() => {
            letter.style.opacity = '0';
            letter.style.transform = 'translateX(-100px)';
        }, index * 10); // Faster staggered exit
    });
    
    // Hide overlay after animation
    setTimeout(() => {
        menuOverlay.classList.remove('menu-open');
        menuOverlay.classList.remove('menu-closing');
        menuAnimationInProgress = false;
    }, 800);
    
    console.log('🍔 Menu closed');
}

// Animate hamburger icon transformation
function animateHamburgerIcon(startProgress, endProgress, duration) {
    const canvas = menuTrigger.querySelector('.canvas');
    if (!canvas || !canvas.drawHamburger) return;
    
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentProgress = startProgress + (endProgress - startProgress) * easedProgress;
        
        canvas.drawHamburger(currentProgress);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}


// Show audio control button
function showAudioControl() {
    if (audioControlButton) {
        audioControlButton.style.opacity = '1';
        audioControlButton.style.transform = 'translateY(0)';
        audioControlButton.style.transition = 'all 0.5s ease';
    }
}

// Toggle audio on/off
async function toggleAudio() {
    isAudioMuted = !isAudioMuted;
    
    if (isAudioMuted) {
        // Mute all audio immediately
        applyAudioState();
        console.log('🔇 Audio muted');
    } else {
        // Treat user toggle as explicit permission grant if previously skipped
        audioPermissionGranted = true;
        await ensureAudioContextResumed();
        applyAudioState();
        console.log('🔊 Audio unmuted (permission: ' + audioPermissionGranted + ')');
    }
}

// Enable all audio
function enableAllAudio() {
    setMediaAudio(video, false, CONFIG.videoVolume);
    setMediaAudio(a1VideoElement, false, 0.8);
    setMediaAudio(emVideoElement, false, 0.8);
    applyAudioState();
    
    console.log('🔊 All audio enabled');
}

// Disable all audio
function disableAllAudio() {
    setMediaAudio(video, true, 0);
    setMediaAudio(a1VideoElement, true, 0);
    setMediaAudio(emVideoElement, true, 0);
    applyAudioState();
    
    console.log('🔇 All audio disabled');
}

// Hide audio prompt
function hideAudioPrompt() {
    if (audioPermissionPrompt) {
        audioPermissionPrompt.style.opacity = '0';
        audioPermissionPrompt.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (audioPermissionPrompt && audioPermissionPrompt.parentNode) {
                audioPermissionPrompt.parentNode.removeChild(audioPermissionPrompt);
            }
        }, 500);
    }
}

// Enhanced animation loop with WebGL effects
function startAnimation() {
    title.style.webkitTextFillColor = 'transparent';
    title.style.fontWeight = '500';
    title.style.letterSpacing = '0.02em';
    title.style.textShadow = '0 0 20px rgba(115, 251, 211, 0.3)';
    
    // Create subtle icon
    const icon = document.createElement('div');
    icon.textContent = '♪';
    icon.style.fontSize = '1.5rem';
    icon.style.color = 'rgba(115, 251, 211, 0.8)';
    icon.style.marginBottom = '1rem';
    icon.style.animation = 'pulse 3s ease-in-out infinite';
    
    // Create concise description
    const description = document.createElement('p');
    description.textContent = 'Enable audio for the full immersive experience.';
    description.style.fontSize = 'clamp(0.95rem, 2.2vw, 1.1rem)';
    description.style.lineHeight = '1.5';
    description.style.marginBottom = '2rem';
    description.style.opacity = '0.85';
    description.style.fontWeight = '300';
    description.style.letterSpacing = '0.01em';
    
    // Create compact button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '1rem';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.flexWrap = 'wrap';
    buttonContainer.style.marginTop = '1.5rem';
    
    // Create modern enable button
    const enableButton = document.createElement('button');
    enableButton.innerHTML = '<span style="display: flex; align-items: center; gap: 0.4rem;"><span>🔊</span> Enable</span>';
    enableButton.style.padding = '14px 28px';
    enableButton.style.background = 'linear-gradient(135deg, #73fbd3 0%, #8a7efc 100%)';
    enableButton.style.border = 'none';
    enableButton.style.borderRadius = '12px';
    enableButton.style.color = '#000';
    enableButton.style.fontSize = '0.95rem';
    enableButton.style.fontWeight = '600';
    enableButton.style.cursor = 'pointer';
    enableButton.style.transition = 'all 0.3s ease';
    enableButton.style.boxShadow = '0 8px 25px rgba(115, 251, 211, 0.25)';
    enableButton.style.letterSpacing = '0.02em';
    enableButton.style.position = 'relative';
    enableButton.style.overflow = 'hidden';
    enableButton.style.minWidth = '120px';
    
    // Create modern disable button
    const disableButton = document.createElement('button');
    disableButton.innerHTML = '<span style="display: flex; align-items: center; gap: 0.4rem;"><span>🔇</span> Skip</span>';
    disableButton.style.padding = '14px 28px';
    disableButton.style.background = 'rgba(255, 255, 255, 0.08)';
    disableButton.style.border = '1px solid rgba(255, 255, 255, 0.15)';
    disableButton.style.borderRadius = '12px';
    disableButton.style.color = '#fff';
    disableButton.style.fontSize = '0.95rem';
    disableButton.style.fontWeight = '500';
    disableButton.style.cursor = 'pointer';
    disableButton.style.transition = 'all 0.3s ease';
    disableButton.style.backdropFilter = 'blur(10px)';
    disableButton.style.letterSpacing = '0.02em';
    disableButton.style.minWidth = '120px';
    
    // Add refined hover effects
    enableButton.addEventListener('mouseenter', () => {
        enableButton.style.transform = 'translateY(-2px) scale(1.02)';
        enableButton.style.boxShadow = '0 12px 35px rgba(115, 251, 211, 0.4)';
    });
    enableButton.addEventListener('mouseleave', () => {
        enableButton.style.transform = 'translateY(0) scale(1)';
        enableButton.style.boxShadow = '0 8px 25px rgba(115, 251, 211, 0.25)';
    });
    
    disableButton.addEventListener('mouseenter', () => {
        disableButton.style.transform = 'translateY(-2px) scale(1.02)';
        disableButton.style.background = 'rgba(255, 255, 255, 0.12)';
        disableButton.style.borderColor = 'rgba(255, 255, 255, 0.25)';
    });
    disableButton.addEventListener('mouseleave', () => {
        disableButton.style.transform = 'translateY(0) scale(1)';
        disableButton.style.background = 'rgba(255, 255, 255, 0.08)';
        disableButton.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    });
    
    // Add click handlers
    enableButton.addEventListener('click', () => {
        audioPermissionGranted = true;
        isAudioMuted = false;
        enableAllAudio();
        applyAudioState();
        hideAudioPrompt();
    });
    
    disableButton.addEventListener('click', () => {
        audioPermissionGranted = false;
        // Keep button usable to enable later via toggle
        isAudioMuted = true;
        disableAllAudio();
        applyAudioState();
        hideAudioPrompt();
    });
    
    buttonContainer.appendChild(enableButton);
    buttonContainer.appendChild(disableButton);
    
    content.appendChild(icon);
    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(buttonContainer);
    audioPermissionPrompt.appendChild(particles);
    audioPermissionPrompt.appendChild(content);
    
    // Add refined CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.4; }
            50% { transform: translateY(-15px) rotate(180deg); opacity: 0.8; }
        }
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(audioPermissionPrompt);
    
    console.log('✅ Modern compact audio permission prompt created');
}

// Create floating audio control button
function createAudioControlButton() {
    // Create audio control button
    audioControlButton = document.createElement('button');
    audioControlButton.id = 'audio-control';
    audioControlButton.innerHTML = '<span>🔊</span>';
    audioControlButton.style.position = 'fixed';
    audioControlButton.style.bottom = '30px';
    audioControlButton.style.right = '30px';
    audioControlButton.style.width = '60px';
    audioControlButton.style.height = '60px';
    audioControlButton.style.borderRadius = '50%';
    audioControlButton.style.border = 'none';
    audioControlButton.style.background = 'rgba(15, 15, 20, 0.9)';
    audioControlButton.style.border = '1px solid rgba(115, 251, 211, 0.3)';
    audioControlButton.style.color = '#73fbd3';
    audioControlButton.style.fontSize = '1.5rem';
    audioControlButton.style.cursor = 'pointer';
    audioControlButton.style.zIndex = '1000';
    audioControlButton.style.display = 'flex';
    audioControlButton.style.alignItems = 'center';
    audioControlButton.style.justifyContent = 'center';
    audioControlButton.style.transition = 'all 0.3s ease';
    audioControlButton.style.backdropFilter = 'blur(10px)';
    audioControlButton.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
    audioControlButton.style.opacity = '0';
    audioControlButton.style.transform = 'translateY(20px)';
    
    // Add hover effects
    audioControlButton.addEventListener('mouseenter', () => {
        audioControlButton.style.transform = 'translateY(-3px) scale(1.1)';
        audioControlButton.style.background = 'rgba(115, 251, 211, 0.1)';
        audioControlButton.style.borderColor = 'rgba(115, 251, 211, 0.5)';
        audioControlButton.style.boxShadow = '0 12px 35px rgba(115, 251, 211, 0.3)';
    });
    
    audioControlButton.addEventListener('mouseleave', () => {
        audioControlButton.style.transform = 'translateY(0) scale(1)';
        audioControlButton.style.background = 'rgba(15, 15, 20, 0.9)';
        audioControlButton.style.borderColor = 'rgba(115, 251, 211, 0.3)';
        audioControlButton.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
    });
    
    // Add click handler for mute/unmute
    audioControlButton.addEventListener('click', () => {
        toggleAudio();
    });
    
    // Add to DOM
    document.body.appendChild(audioControlButton);
    // Sync initial icon/state
    applyAudioState();

    // Show button after a delay (regardless of initial audio choice)
    setTimeout(() => {
        showAudioControl();
    }, 2000);
    
    console.log('✅ Audio control button created');
}

// Show audio control button
function showAudioControl() {
    if (audioControlButton) {
        audioControlButton.style.opacity = '1';
        audioControlButton.style.transform = 'translateY(0)';
        audioControlButton.style.transition = 'all 0.5s ease';
    }
}

// Hide audio control button
function hideAudioControl() {
    if (audioControlButton) {
        audioControlButton.style.opacity = '0';
        audioControlButton.style.transform = 'translateY(20px)';
        audioControlButton.style.transition = 'all 0.3s ease';
    }
}

// Toggle audio on/off
async function toggleAudio() {
    isAudioMuted = !isAudioMuted;
    
    if (isAudioMuted) {
        // Mute all audio immediately
        applyAudioState();
        console.log('🔇 Audio muted');
    } else {
        // Treat user toggle as explicit permission grant if previously skipped
        audioPermissionGranted = true;
        await ensureAudioContextResumed();
        applyAudioState();
        console.log('🔊 Audio unmuted (permission: ' + audioPermissionGranted + ')');
    }
}

// Enable all audio
function enableAllAudio() {
    setMediaAudio(video, false, CONFIG.videoVolume);
    setMediaAudio(a1VideoElement, false, 0.8);
    setMediaAudio(emVideoElement, false, 0.8);
    applyAudioState();
    
    console.log('🔊 All audio enabled');
}

// Disable all audio
function disableAllAudio() {
    setMediaAudio(video, true, 0);
    setMediaAudio(a1VideoElement, true, 0);
    setMediaAudio(emVideoElement, true, 0);
    applyAudioState();
    
    console.log('🔇 All audio disabled');
}

// Hide audio prompt
function hideAudioPrompt() {
    if (audioPermissionPrompt) {
        audioPermissionPrompt.style.opacity = '0';
        audioPermissionPrompt.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (audioPermissionPrompt && audioPermissionPrompt.parentNode) {
                audioPermissionPrompt.parentNode.removeChild(audioPermissionPrompt);
            }
        }, 500);
    }
}




// Simple scroll system
function setupScrolling() {
    // Get all story sections
    sections = Array.from(document.querySelectorAll('.story-section'));
    console.log(`📄 Found ${sections.length} story sections`);
    
    // Simple scroll handler
    function handleScroll() {
        const scrollY = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
		const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
		currentScrollProgress = scrollProgress;
        
        // Update video opacity and volume - will be handled in the section-specific logic belowr
        
        // Show sections based on scroll
        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionVisible = scrollY + window.innerHeight > sectionTop + 100;
            
            if (sectionVisible && !section.classList.contains('visible')) {
                section.classList.add('visible');
                console.log(`✨ Section ${index + 1} visible`);
                
                // Animate the vibe coding image when section 3 becomes visible
                if (index === 2) { // Section 3 (Enter Vibe Coding)
                    const vibeImage = section.querySelector('img');
                    if (vibeImage) {
                        vibeImage.style.opacity = '1';
                        vibeImage.style.transform = 'translateY(0)';
                        console.log('🎨 Vibe Coding image appears!');
                    }
                }
                
                // Animate company logos when credentials section becomes visible
                if (index === 4) { // Credentials section (5th section, index 4)
                    const logoItems = section.querySelectorAll('.logo-item');
                    logoItems.forEach((item, logoIndex) => {
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0) scale(1)';
                        }, logoIndex * 150); // Staggered animation
                    });
                    console.log('🏢 Company logos animating!');
                }
            }
        });
        
        // Handle EM video and Spaghetti Monster visibility - show after section 4 (spaghetti section)
        const section4 = sections[3]; // "On the surface it looks calm and ready"
        const section5 = sections[4]; // "Luckily there are ways to make it work better"
        
        if (section4 && section5) {
            const section4Middle = section4.offsetTop + (section4.offsetHeight * 0.2); // Show at 20% through section 4
            const section5Top = section5.offsetTop;
            
            // Show EM video and Spaghetti Monster earlier - at 20% through section 4 and before section 5 starts
            const shouldShowSpaghettiElements = scrollY > section4Middle && scrollY < section5Top;
            
            // Handle EM video
            if (emVideoElement) {
                if (shouldShowSpaghettiElements && emVideoElement.style.opacity === '0') {
                    emVideoElement.style.opacity = '1';
                    applyAudioState();
                    emVideoElement.play().catch(console.log);
                    console.log('🎬 EM video appears!');
                } else if (!shouldShowSpaghettiElements && emVideoElement.style.opacity === '1') {
                    emVideoElement.style.opacity = '0';
                    emVideoElement.pause();
                    emVideoElement.currentTime = 0;
                }
            }
            
            // Handle Spaghetti Monster model and arrow
            if (spaghettiModel) {
                if (shouldShowSpaghettiElements && !spaghettiModel.visible) {
                    spaghettiModel.visible = true;
                    if (spaghettiModel.userData.directionalLight) {
                        spaghettiModel.userData.directionalLight.visible = true;
                    }
                    console.log('🍝 Flying Spaghetti Monster appears!');
                } else if (!shouldShowSpaghettiElements && spaghettiModel.visible) {
                    spaghettiModel.visible = false;
                    if (spaghettiModel.userData.directionalLight) {
                        spaghettiModel.userData.directionalLight.visible = false;
                    }
                    console.log('🍝 Flying Spaghetti Monster disappears!');
                }
            }
            
            // Handle Spaghetti Arrow
            if (spaghettiArrow) {
                if (shouldShowSpaghettiElements && !spaghettiArrow.visible) {
                    spaghettiArrow.visible = true;
                    console.log('🏹 Spaghetti arrow appears!');
                } else if (!shouldShowSpaghettiElements && spaghettiArrow.visible) {
                    spaghettiArrow.visible = false;
                    console.log('🏹 Spaghetti arrow disappears!');
                }
            }
        }
        
        // Handle news.png image visibility - show when section 4 becomes visible (same as vibecoding.webp)
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
        
        // Handle Goku model visibility - show between section 2 and section 3
        if (gokuModel) {
            const section2 = sections[1]; // "Jokes aside, AI is really powerful"
            const section3 = sections[2]; // "Enter Vibe Coding"
            
            let gokuShouldBeVisible = false;
            
            if (section2 && section3) {
                const section2Middle = section2.offsetTop + (section2.offsetHeight * 0.6); // Show at 60% through section 2
                const section3Top = section3.offsetTop;
                
                // Show Goku earlier - at 60% through section 2 and before section 3 starts
                gokuShouldBeVisible = scrollY > section2Middle && scrollY < section3Top;
            }
            
            if (gokuShouldBeVisible && !gokuModel.visible) {
                gokuModel.visible = true;
                gokuEntranceTime = 0; // Reset entrance animation
                gokuEntranceComplete = false;
                if (gokuModel.userData.directionalLight) {
                    gokuModel.userData.directionalLight.visible = true;
                }
                // Show energy particles
                gokuEnergyParticles.forEach(particle => {
                    particle.visible = true;
                });
                console.log('🥋 Goku Super Saiyan appears!');
            } else if (!gokuShouldBeVisible && gokuModel.visible) {
                gokuModel.visible = false;
                gokuEntranceComplete = false; // Reset for next appearance
                if (gokuModel.userData.directionalLight) {
                    gokuModel.userData.directionalLight.visible = false;
                }
                // Hide energy particles
                gokuEnergyParticles.forEach(particle => {
                    particle.visible = false;
                });
                console.log('🥋 Goku Super Saiyan disappears!');
            }
        }
        
        
        // Get first section for timing
        const firstSection = sections[0];
        let firstSectionTop = 0;
        let firstSectionBottom = 0;
        
        if (firstSection) {
            firstSectionTop = firstSection.offsetTop;
            firstSectionBottom = firstSection.offsetTop + firstSection.offsetHeight;
            
            // Handle first video - disappears right before typewriter starts
            if (video && videoPlane && videoPlane.material) {
                const typewriterStart = firstSectionBottom - window.innerHeight * 0.8; // When typewriter starts
                const videoDisappearPoint = typewriterStart; // Video disappears right before typewriter
                
                const videoVisible = scrollY < videoDisappearPoint;
                
                if (videoVisible) {
                    // Show video with appropriate audio (respect global state)
                    videoPlane.material.opacity = 1;
                    applyAudioState();
                } else {
                    // Hide video instantly
                    videoPlane.material.opacity = 0;
                    setMediaAudio(video, true, 0);
                }
            }
            
            
            // Handle typewriter effect - appears much earlier, disappears when A1 video starts
            if (typewriterElement) {
                const typewriterStart = firstSectionBottom - window.innerHeight * 0.8; // Much earlier - well before section 1 ends
                const a1VideoStart = firstSectionBottom + window.innerHeight * 0.2; // When A1 video starts
                const typewriterEnd = a1VideoStart; // Typewriter ends exactly when A1 video starts
                
                const typewriterVisible = scrollY >= typewriterStart && scrollY <= typewriterEnd;
                
				if (typewriterVisible && typewriterElement.style.opacity === '0') {
					// Show the phrase with a glitch effect instead of typewriter
					startGlitchText('and the occasional A1...');
                } else if (!typewriterVisible && typewriterElement.style.opacity === '1') {
                    // Hide typewriter immediately when A1 video starts
                    typewriterElement.style.opacity = '0';
                }
            }
            
            // Handle A1 video - appears after typewriter, disappears instantly at section 2
            if (a1VideoElement) {
                const secondSection = sections[1];
                const a1VideoStart = firstSectionBottom + window.innerHeight * 0.2; // Right after typewriter
                const a1VideoEnd = secondSection ? secondSection.offsetTop - window.innerHeight * 0.1 : firstSectionBottom + window.innerHeight * 4; // Much longer duration
                
                const a1VideoVisible = scrollY >= a1VideoStart && scrollY <= a1VideoEnd;
                
                if (a1VideoVisible && a1VideoElement.style.opacity === '0') {
                    // Show and play A1 video instantly
                    a1VideoElement.style.opacity = '1';
                    a1VideoElement.style.transition = 'none'; // Remove transition for instant appearance
                    applyAudioState();
                    a1VideoElement.play().catch(console.log);
                    console.log('Starting A1 video!');
                } else if (!a1VideoVisible && a1VideoElement.style.opacity === '1') {
                    // Hide A1 video instantly
                    a1VideoElement.style.transition = 'none'; // Remove transition for instant disappearance
                    a1VideoElement.style.opacity = '0';
                    a1VideoElement.pause();
                    a1VideoElement.currentTime = 0;
                }
            }
        }
        
    }
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial call
    handleScroll();
    
    console.log('✅ Scrolling setup complete');
}


// Enhanced animation loop with WebGL effects
function startAnimation() {
    function animate() {
        requestAnimationFrame(animate);
        
        const time = Date.now() * 0.001;
		
		// Easing for pointer parallax
		pointer.x += (pointerTarget.x - pointer.x) * 0.07;
		pointer.y += (pointerTarget.y - pointer.y) * 0.07;
		
		// Parallax camera tilt
		camera.rotation.x = THREE.MathUtils.degToRad(pointer.y * -3);
		camera.rotation.y = THREE.MathUtils.degToRad(pointer.x * 3);
        camera.position.x = Math.sin(time * 0.1) * 0.1 + pointer.x * 0.25;
        camera.position.y = Math.cos(time * 0.15) * 0.05 + pointer.y * 0.15;
        // Scroll-driven dolly
        camera.position.z = 8 - currentScrollProgress * 10;
		
		// Subtle video plane animation
        if (videoPlane) {
            videoPlane.rotation.z = Math.sin(time * 0.1) * 0.005;
            videoPlane.position.y = Math.sin(time * 0.3) * 0.1;
        }
		
		// Starfield drift and parallax
		if (starfield) {
			starfield.rotation.z += 0.0002;
			starfield.position.x = pointer.x * -5;
			starfield.position.y = pointer.y * -3;
		}
		
		// Neon rings animation removed (user doesn't like this effect)

        // Aurora time evolution
        if (auroraMesh) {
            auroraMesh.material.uniforms.time.value = time;
        }

        // Animate Goku model with super-powered entrance
        if (gokuModel && gokuModel.visible) {
            if (!gokuEntranceComplete) {
                gokuEntranceTime += 0.016; // ~60fps timing
                
                // Super-powered entrance animation
                if (gokuEntranceTime < 1.0) {
                    // Scale up with power effect
                    const scaleProgress = gokuEntranceTime / 1.0;
                    const easeOut = 1 - Math.pow(1 - scaleProgress, 3); // Cubic ease out
                    const currentScale = 0.1 + (0.4 - 0.1) * easeOut;
                    gokuModel.scale.setScalar(currentScale);
                    
                    // Add dramatic rotation during entrance
                    gokuModel.rotation.y = Math.sin(gokuEntranceTime * 10) * 0.2 * (1 - scaleProgress);
                    
                    // Add vertical bounce effect
                    const bounceHeight = Math.sin(gokuEntranceTime * Math.PI) * 0.5;
                    gokuModel.position.y = -4 + bounceHeight;
                    
                    // Create energy shockwave on entrance
                    if (gokuEntranceTime > 0.3 && gokuEntranceTime < 0.4) {
                        createShockwave(0, -4, -15);
                    }
                } else {
                    // Entrance complete - normal floating
                    gokuModel.scale.setScalar(0.4);
                    gokuModel.rotation.y = 0;
                    gokuModel.position.y = -4 + Math.sin(time * 0.5) * 0.1;
                    gokuEntranceComplete = true;
                }
            } else {
                // Normal floating motion after entrance
                gokuModel.position.y = -4 + Math.sin(time * 0.5) * 0.1;
            }
            
            // Animate energy particles - more dramatic and obvious
            gokuEnergyParticles.forEach((particle, index) => {
                if (particle.visible) {
                    const userData = particle.userData;
                    
                    // Faster orbital motion around Goku
                    userData.angle += userData.speed * 0.02;
                    particle.position.x = Math.cos(userData.angle) * userData.radius;
                    particle.position.z = -15 + Math.sin(userData.angle) * userData.radius;
                    
                    // More dramatic floating motion
                    particle.position.y = userData.originalY + Math.sin(time * 3 + index * 0.5) * 0.8;
                    
                    // More dramatic pulsing opacity
                    particle.material.opacity = 0.7 + Math.sin(time * 4 + index * 0.3) * 0.3;
                    
                    // More vibrant color shifting for energy effect
                    const hue = (0.1 + Math.sin(time * 3 + index * 0.2) * 0.1) % 1;
                    particle.material.color.setHSL(hue, 1, 1);
                    
                    // Add scaling for more dynamic effect
                    const scale = 1 + Math.sin(time * 5 + index * 0.4) * 0.3;
                    particle.scale.setScalar(scale);
                }
            });
        }


        // Animate Spaghetti Monster
        if (spaghettiModel && spaghettiModel.visible) {
            // Gentle floating motion
            spaghettiModel.position.y = -2 + Math.sin(time * 0.4) * 0.2;
            // Slight rotation for movement
            spaghettiModel.rotation.y += 0.01;
            // Scale pulsing effect
            const scale = 1.2 + Math.sin(time * 0.6) * 0.05;
            spaghettiModel.scale.setScalar(scale);
        }

        // Animate Spaghetti Arrow
        if (spaghettiArrow && spaghettiArrow.visible) {
            // Gentle floating motion
            spaghettiArrow.position.y = Math.sin(time * 0.3) * 0.1;
            // Slight rotation for movement
            spaghettiArrow.rotation.z = Math.sin(time * 0.2) * 0.05;
            // Scale pulsing effect
            const scale = 1 + Math.sin(time * 0.8) * 0.1;
            spaghettiArrow.scale.setScalar(scale);
        }

        // Update shockwaves
        if (shockwaves.length) {
            for (let i = shockwaves.length - 1; i >= 0; i--) {
                const m = shockwaves[i];
                m.userData.life += 0.02;
                m.scale.x = m.scale.y = 1 + m.userData.life * 8;
                const mat = m.material;
                mat.uniforms.alpha.value = Math.max(0, 0.9 - m.userData.life * 0.9);
                if (mat.uniforms.alpha.value <= 0.01) {
                    scene.remove(m);
                    shockwaves.splice(i, 1);
                }
            }
        }

		// Audio reactive bloom intensity (if available)
		if (bloomPass && audioReady && analyserNode && audioDataArray) {
			analyserNode.getByteFrequencyData(audioDataArray);
			let sum = 0;
			for (let i = 0; i < audioDataArray.length; i++) sum += audioDataArray[i];
			const avg = sum / audioDataArray.length;
			const intensity = 0.7 + (avg / 255) * 0.9; // 0.7 to ~1.6
			bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, intensity, 0.15);
		}
		
		// Render with composer if set up
		if (composer) {
			composer.render();
		} else {
			renderer.render(scene, camera);
		}
    }
    animate();
    console.log('✅ Enhanced WebGL animation started');
}

// Handle window resize
window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
		if (composer) composer.setSize(window.innerWidth, window.innerHeight);
		if (fxaaPass) fxaaPass.material.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
    }
    
    // Handle video layout changes
    handleVideoResize();
});

// Start when page loads
document.addEventListener('DOMContentLoaded', init);
