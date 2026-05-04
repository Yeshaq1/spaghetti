export class Effects {
    constructor(scene) {
        this.scene = scene;
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.scrollProgress = 0;
        this.visualScrollProgress = 0;
        this.activeScene = 'hero';
        this.sceneProgress = 0;

        this.rig = new THREE.Group();
        this.strandGroup = new THREE.Group();
        this.signalGroup = new THREE.Group();
        this.dataGroup = new THREE.Group();
        this.tunnelGroup = new THREE.Group();

        this.particleField = null;
        this.strands = [];
        this.signals = [];
        this.dataPlanes = [];
        this.tunnelFrames = [];
        this.knots = [];
        this.pastaAlbedoMap = null;
        this.pastaNormalMap = null;
        this.pastaRoughnessMap = null;
    }

    init() {
        this.scene.add(this.rig);
        this.rig.add(this.strandGroup);
        this.rig.add(this.signalGroup);
        this.rig.add(this.dataGroup);
        this.rig.add(this.tunnelGroup);

        this.positionRig();
        this.createParticleField();
        this.ensurePastaSurfaceTextures();
        this.createSpaghettiCore();
        this.createSignals();
        this.createDataPlanes();
        this.createTunnelFrames();

        return this;
    }

    positionRig() {
        const w = window.innerWidth;
        const isMobile = w < 820;
        const isHeroMobile = w < 720;

        if (isHeroMobile) {
            this.rig.position.set(0, -0.92, -6.85);
            this.rig.scale.setScalar(0.85);
        } else if (isMobile) {
            this.rig.position.set(0.15, -1, -6.85);
            this.rig.scale.setScalar(0.76);
        } else {
            this.rig.position.set(5.15, 0.1, -6.85);
            this.rig.scale.setScalar(1.12);
        }
    }

    createParticleField() {
        const particleCount = window.innerWidth < 720 ? 420 : 760;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let index = 0; index < particleCount; index++) {
            const offset = index * 3;
            positions[offset] = (Math.random() - 0.5) * 86;
            positions[offset + 1] = (Math.random() - 0.5) * 44;
            positions[offset + 2] = -Math.random() * 96 - 2;

            const tone = 0.5 + Math.random() * 0.34;
            colors[offset] = tone;
            colors[offset + 1] = tone;
            colors[offset + 2] = tone;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: window.innerWidth < 720 ? 0.06 : 0.08,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.12,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particleField = new THREE.Points(geometry, material);
        this.particleField.position.z = -10;
        this.scene.add(this.particleField);
    }

    pastaHash2(x, y) {
        const sn = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
        return sn - Math.floor(sn);
    }

    pastaNoise2(x, y) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;
        const ux = fx * fx * (3 - 2 * fx);
        const uy = fy * fy * (3 - 2 * fy);
        const a = this.pastaHash2(ix, iy);
        const b = this.pastaHash2(ix + 1, iy);
        const c = this.pastaHash2(ix, iy + 1);
        const d = this.pastaHash2(ix + 1, iy + 1);
        return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, ux), THREE.MathUtils.lerp(c, d, ux), uy);
    }

    pastaFbm(x, y) {
        let value = 0;
        let amplitude = 0.52;
        let frequency = 1;
        for (let octave = 0; octave < 5; octave++) {
            value += amplitude * this.pastaNoise2(x * frequency, y * frequency);
            frequency *= 2.05;
            amplitude *= 0.5;
        }
        return value;
    }

    pastaSampleHeight(u, v) {
        const x = u * 5.2;
        const y = v * 5.2;
        const base = this.pastaFbm(x, y);
        const axial = 0.11 * Math.sin(u * Math.PI * 2 * 26 + base * 1.8) * this.pastaNoise2(x * 3.1, y * 3.1);
        const ridge = Math.abs(Math.sin(u * Math.PI * 2 * 38 + y * 14.3)) * 0.065;
        const speck = this.pastaHash2(u * 193.17, v * 149.03) < 0.035 ? -0.035 : 0;
        const flour = this.pastaHash2(u * 67.2, v * 59.8) * 0.032;
        return THREE.MathUtils.clamp(0.5 + base * 0.3 + axial + ridge + speck + flour, 0, 1);
    }

    linearToSRGBChannel(c) {
        return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    }

    ensurePastaSurfaceTextures() {
        if (this.pastaAlbedoMap) return;

        const size = 128;
        const cells = size * size;
        const height = new Float32Array(cells);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                height[y * size + x] = this.pastaSampleHeight(x / size, y / size);
            }
        }

        const heightAt = (ix, iy) => height[(THREE.MathUtils.euclideanModulo(iy, size) * size + THREE.MathUtils.euclideanModulo(ix, size))];

        const albedoData = new Uint8Array(cells * 4);
        const normalData = new Uint8Array(cells * 4);
        const roughData = new Uint8Array(cells * 4);
        const bumpStrength = 4.1;

        const cream = { r: 1, g: 0.97, b: 0.9 };
        const wheat = { r: 0.99, g: 0.91, b: 0.72 };
        const honey = { r: 0.98, g: 0.86, b: 0.58 };

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const o = (y * size + x) * 4;
                const h = height[y * size + x];
                const sx = (heightAt(x + 1, y) - heightAt(x - 1, y)) * 0.5 * bumpStrength;
                const sy = (heightAt(x, y + 1) - heightAt(x, y - 1)) * 0.5 * bumpStrength;
                let nx = -sx;
                let ny = -sy;
                let nz = 1;
                const invLen = 1 / Math.hypot(nx, ny, nz);
                nx *= invLen;
                ny *= invLen;
                nz *= invLen;
                normalData[o] = Math.floor(THREE.MathUtils.clamp(nx * 0.5 + 0.5, 0, 1) * 255);
                normalData[o + 1] = Math.floor(THREE.MathUtils.clamp(ny * 0.5 + 0.5, 0, 1) * 255);
                normalData[o + 2] = Math.floor(THREE.MathUtils.clamp(nz * 0.5 + 0.5, 0, 1) * 255);
                normalData[o + 3] = 255;

                const u = x / size;
                const v = y / size;
                const t = THREE.MathUtils.clamp(h * 0.88 + 0.08, 0, 1);
                let lr = THREE.MathUtils.lerp(cream.r, wheat.r, t);
                let lg = THREE.MathUtils.lerp(cream.g, wheat.g, t);
                let lb = THREE.MathUtils.lerp(cream.b, wheat.b, t);
                const warm = Math.max(0, h - 0.55) * 1.6;
                lr = THREE.MathUtils.lerp(lr, honey.r, warm * 0.22);
                lg = THREE.MathUtils.lerp(lg, honey.g, warm * 0.22);
                lb = THREE.MathUtils.lerp(lb, honey.b, warm * 0.22);
                const deep = Math.max(0, 0.22 - h);
                lr = THREE.MathUtils.lerp(lr, honey.r, deep * 0.14);
                lg = THREE.MathUtils.lerp(lg, honey.g, deep * 0.14);
                lb = THREE.MathUtils.lerp(lb, honey.b, deep * 0.14);
                if (this.pastaHash2(u * 401.3, v * 307.9) < 0.028) {
                    lr *= 0.96;
                    lg *= 0.94;
                    lb *= 0.92;
                }
                if (this.pastaHash2(u * 211.1, v * 183.7) < 0.012) {
                    lr = THREE.MathUtils.lerp(lr, 0.88, 0.18);
                    lg = THREE.MathUtils.lerp(lg, 0.72, 0.18);
                    lb = THREE.MathUtils.lerp(lb, 0.52, 0.18);
                }
                lr = THREE.MathUtils.clamp(lr * 1.045, 0, 1);
                lg = THREE.MathUtils.clamp(lg * 1.035, 0, 1);
                lb = THREE.MathUtils.clamp(lb * 1.02, 0, 1);
                albedoData[o] = Math.floor(THREE.MathUtils.clamp(this.linearToSRGBChannel(lr), 0, 1) * 255);
                albedoData[o + 1] = Math.floor(THREE.MathUtils.clamp(this.linearToSRGBChannel(lg), 0, 1) * 255);
                albedoData[o + 2] = Math.floor(THREE.MathUtils.clamp(this.linearToSRGBChannel(lb), 0, 1) * 255);
                albedoData[o + 3] = 255;

                const rough = THREE.MathUtils.clamp(0.12 + h * 0.38 + Math.abs(sx + sy) * 0.028, 0.06, 0.88);
                const g = Math.floor(rough * 255);
                roughData[o] = 255;
                roughData[o + 1] = g;
                roughData[o + 2] = g;
                roughData[o + 3] = 255;
            }
        }

        const repeatU = 5.2;
        const repeatV = 1.18;

        const configureMap = (texture, encoding) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(repeatU, repeatV);
            texture.flipY = false;
            texture.encoding = encoding;
            texture.needsUpdate = true;
        };

        this.pastaAlbedoMap = new THREE.DataTexture(albedoData, size, size, THREE.RGBAFormat);
        configureMap(this.pastaAlbedoMap, THREE.sRGBEncoding);

        this.pastaNormalMap = new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat);
        configureMap(this.pastaNormalMap, THREE.LinearEncoding);

        this.pastaRoughnessMap = new THREE.DataTexture(roughData, size, size, THREE.RGBAFormat);
        configureMap(this.pastaRoughnessMap, THREE.LinearEncoding);
    }

    getStrandTubeParams() {
        const narrow = window.innerWidth < 720;
        if (narrow) {
            return { tubeSegments: 96, radialSegments: 10 };
        }
        return { tubeSegments: 128, radialSegments: 14 };
    }

    createStrandPastaMaterial(strandIndex) {
        const base = new THREE.Color(0xfffff4);
        base.offsetHSL(
            (Math.random() - 0.5) * 0.018,
            (Math.random() - 0.5) * 0.04,
            (Math.random() - 0.5) * 0.028
        );

        const mat = new THREE.MeshPhysicalMaterial({
            map: this.pastaAlbedoMap,
            normalMap: this.pastaNormalMap,
            normalScale: new THREE.Vector2(0.52, 0.52),
            color: base,
            roughness: 0.28 + (strandIndex % 5) * 0.014,
            metalness: 0.01,
            roughnessMap: this.pastaRoughnessMap,
            clearcoat: 0.26,
            clearcoatRoughness: 0.34,
            clearcoatRoughnessMap: this.pastaRoughnessMap,
            clearcoatNormalMap: this.pastaNormalMap,
            clearcoatNormalScale: new THREE.Vector2(0.2, 0.2),
            emissive: 0xffe8d4,
            transparent: true,
            opacity: 0.98
        });
        mat.emissiveIntensity = 0.11;
        return mat;
    }

    createSpaghettiCore() {
        const strandCount = window.innerWidth < 720 ? 10 : 18;

        for (let index = 0; index < strandCount; index++) {
            const strand = this.createStrand(index, strandCount);
            this.strands.push(strand);
            this.strandGroup.add(strand.mesh);
        }

        const knotMaterial = new THREE.MeshPhysicalMaterial({
            map: this.pastaAlbedoMap,
            normalMap: this.pastaNormalMap,
            normalScale: new THREE.Vector2(0.44, 0.44),
            color: 0xfffffb,
            roughness: 0.32,
            metalness: 0.01,
            roughnessMap: this.pastaRoughnessMap,
            clearcoat: 0.22,
            clearcoatRoughness: 0.36,
            clearcoatRoughnessMap: this.pastaRoughnessMap,
            clearcoatNormalMap: this.pastaNormalMap,
            clearcoatNormalScale: new THREE.Vector2(0.16, 0.16),
            emissive: 0xfff0e6,
            transparent: true,
            opacity: 0.82,
            depthWrite: true
        });
        knotMaterial.emissiveIntensity = 0.1;

        for (let index = 0; index < 4; index++) {
            const knotGeometry = new THREE.TorusGeometry(0.072, 0.022, 12, 22);
            const knot = new THREE.Mesh(knotGeometry, knotMaterial.clone());
            knot.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            knot.scale.set(1.05, 0.88, 1.02);
            knot.userData = {
                start: new THREE.Vector3(
                    (Math.random() - 0.5) * 1.5,
                    (Math.random() - 0.5) * 1.5,
                    (Math.random() - 0.5) * 1.2
                ),
                end: new THREE.Vector3(-0.4 + index * 0.28, 0.35 - index * 0.24, -0.1 + index * 0.06),
                phase: index * 0.7
            };
            knot.position.copy(knot.userData.start);
            this.knots.push(knot);
            this.strandGroup.add(knot);
        }
    }

    createStrand(index, strandCount) {
        const progress = index / strandCount;
        const phase = progress * Math.PI * 2;
        const baseRadius = 0.06 + (index % 3) * 0.014;
        const { tubeSegments, radialSegments } = this.getStrandTubeParams();

        const chaosPoints = [
            new THREE.Vector3(-1.7 + Math.sin(phase * 2.1) * 1.5, 1.9 - progress * 4.6, -1.1 + Math.cos(phase * 1.4) * 1.5),
            new THREE.Vector3(1.4 + Math.cos(phase * 2.7) * 1.8, 1.6 - progress * 2.3, 1.2 + Math.sin(phase * 1.6) * 1.5),
            new THREE.Vector3(-1.1 + Math.sin(phase * 3.2) * 1.7, -0.2 + Math.cos(phase * 2.2) * 1.7, -1.6 + Math.cos(phase * 2.8) * 1.2),
            new THREE.Vector3(1.7 + Math.cos(phase * 1.8) * 1.6, -1.8 + progress * 3.3, 1 + Math.sin(phase * 3.3) * 1.4),
            new THREE.Vector3(-1.4 + Math.sin(phase * 2.4) * 1.3, -2 + progress * 4.3, -1 + Math.cos(phase * 1.2) * 1.5)
        ];

        const endY = -1.1 + progress * 2.25;
        const lanePoints = [
            new THREE.Vector3(-2.9, endY + Math.sin(phase) * 0.38, -0.85 + Math.cos(phase * 1.3) * 0.26),
            new THREE.Vector3(-1.35, endY + 0.78 + Math.sin(phase * 1.5) * 0.34, -0.3 + Math.sin(phase * 1.1) * 0.26),
            new THREE.Vector3(0.3, endY * 0.35 + Math.sin(phase * 2) * 0.34, Math.cos(phase * 1.8) * 0.28),
            new THREE.Vector3(1.95, endY - 0.42 + Math.cos(phase * 1.2) * 0.22, 0.2 + Math.sin(phase * 1.6) * 0.18),
            new THREE.Vector3(3.1, endY + Math.cos(phase) * 0.14, 0.56 + Math.sin(phase * 1.3) * 0.12)
        ];

        const orderedPoints = [
            new THREE.Vector3(-3.4, endY + Math.sin(phase) * 0.07, -0.38 + Math.cos(phase * 1.2) * 0.08),
            new THREE.Vector3(-1.7, endY + 0.12 + Math.sin(phase * 1.2) * 0.08, -0.1 + Math.sin(phase * 1.1) * 0.06),
            new THREE.Vector3(0, endY * 0.08 + Math.sin(phase * 1.6) * 0.07, Math.cos(phase * 1.4) * 0.06),
            new THREE.Vector3(1.7, endY - 0.1 + Math.cos(phase * 1.1) * 0.08, 0.1 + Math.sin(phase * 1.2) * 0.06),
            new THREE.Vector3(3.4, endY + Math.cos(phase) * 0.07, 0.38 + Math.sin(phase * 1.2) * 0.08)
        ];

        const curve = new THREE.CatmullRomCurve3(chaosPoints, false, 'centripetal', 0.55);
        const geometry = new THREE.TubeGeometry(curve, tubeSegments, baseRadius, radialSegments, false);

        const material = this.createStrandPastaMaterial(index);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = {
            chaosPoints: chaosPoints.map((point) => point.clone()),
            lanePoints: lanePoints.map((point) => point.clone()),
            orderedPoints: orderedPoints.map((point) => point.clone()),
            phase,
            strandIndex: index,
            baseRadius,
            tubeSegments,
            radialSegments
        };

        return { mesh, curve };
    }

    createSignals() {
        const signalMaterial = new THREE.MeshBasicMaterial({
            color: 0xfff1d7,
            transparent: true,
            opacity: 0.38,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.strands.slice(0, Math.min(8, this.strands.length)).forEach((_strand, index) => {
            const signal = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), signalMaterial.clone());
            signal.userData = {
                strandIndex: index,
                offset: index / 8,
                speed: 0.085 + index * 0.012
            };
            this.signals.push(signal);
            this.signalGroup.add(signal);
        });
    }

    createDataPlanes() {
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: 0xe8dcc9,
            transparent: true,
            opacity: 0.01,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        for (let index = 0; index < 4; index++) {
            const plane = new THREE.Mesh(
                new THREE.PlaneGeometry(2.7 + index * 0.45, 0.64 + (index % 3) * 0.18, 12, 2),
                planeMaterial.clone()
            );
            plane.position.set(
                -2.2 + (index % 2) * 4.8,
                -2.25 + index * 0.82,
                -1.6 - index * 0.3
            );
            plane.rotation.set(
                0,
                THREE.MathUtils.degToRad(index % 2 === 0 ? -28 : 28),
                THREE.MathUtils.degToRad(index % 2 === 0 ? 7 : -7)
            );
            plane.userData.baseY = plane.position.y;
            plane.userData.speed = 0.35 + index * 0.04;
            this.dataPlanes.push(plane);
            this.dataGroup.add(plane);
        }
    }

    createTunnelFrames() {
        const material = new THREE.LineBasicMaterial({
            color: 0xe8dcc9,
            transparent: true,
            opacity: 0.006,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        for (let index = 0; index < 5; index++) {
            const geometry = new THREE.EdgesGeometry(
                new THREE.BoxGeometry(5.2 + index * 0.5, 3.1 + index * 0.28, 0.05)
            );
            const frame = new THREE.LineSegments(geometry, material.clone());
            frame.position.z = -2 - index * 1.2;
            frame.rotation.z = THREE.MathUtils.degToRad(index * 4.5);
            frame.material.opacity = 0.1 - index * 0.008;
            frame.userData.speed = 0.018 + index * 0.002;
            this.tunnelFrames.push(frame);
            this.tunnelGroup.add(frame);
        }
    }

    getFormationProgress() {
        const intro = document.getElementById('intro');
        let targetProgress = this.activeScene === 'hero' ? 0.03 : 1;

        if (intro) {
            const rect = intro.getBoundingClientRect();
            const startsWhenIntroPeeks = window.innerHeight * 0.98;
            const finishesBeforeHeadlineSettles = window.innerHeight * 0.34;
            const rawProgress = (startsWhenIntroPeeks - rect.top) / (startsWhenIntroPeeks - finishesBeforeHeadlineSettles);
            targetProgress = THREE.MathUtils.clamp(rawProgress, 0.03, 1);
        }

        if (targetProgress >= 0.98) {
            this.visualScrollProgress = 1;
        } else {
            this.visualScrollProgress += (targetProgress - this.visualScrollProgress) * (this.prefersReducedMotion ? 0.22 : 0.32);
        }

        const clamped = THREE.MathUtils.clamp(this.visualScrollProgress, 0, 1);
        return clamped * clamped * (3 - 2 * clamped);
    }

    rebuildStrand(strand, time, formationProgress) {
        const { mesh } = strand;
        const {
            chaosPoints,
            lanePoints,
            orderedPoints,
            phase,
            strandIndex,
            baseRadius,
            tubeSegments,
            radialSegments
        } = mesh.userData;
        const tension = 1 - formationProgress;
        const laneProgress = THREE.MathUtils.clamp(formationProgress / 0.58, 0, 1);
        const routeProgress = THREE.MathUtils.clamp((formationProgress - 0.28) / 0.5, 0, 1);

        const radiusDrift =
            1 +
            0.055 *
                Math.sin(time * 0.38 + phase * 1.7 + strandIndex * 0.41) *
                (0.35 + 0.65 * tension);
        const effectiveRadius = baseRadius * radiusDrift;

        const points = chaosPoints.map((chaosPoint, index) => {
            const lanePoint = lanePoints[index];
            const orderedPoint = orderedPoints[index];
            const untangledPoint = chaosPoint.clone().lerp(lanePoint, laneProgress);
            const point = untangledPoint.lerp(orderedPoint, routeProgress);

            if (!this.prefersReducedMotion) {
                const chaosAmplitude = 0.24 * tension;
                const calmAmplitude = 0.015 + 0.018 * (1 - tension);
                point.x += Math.sin(time * 0.7 + phase * 1.2 + index) * (chaosAmplitude + calmAmplitude);
                point.y += Math.cos(time * 0.56 + phase * 0.9 + index * 0.6) * (chaosAmplitude * 0.95 + calmAmplitude);
                point.z += Math.sin(time * 0.62 + phase * 1.4 + index * 0.4) * (chaosAmplitude * 0.56 + calmAmplitude * 0.28);

                const microAmp = (0.0085 + 0.0068 * (1 - tension)) * (0.45 + 0.55 * (1 - tension));
                point.x += Math.sin(time * 2.42 + phase * 3.08 + index * 2.05 + strandIndex * 0.31) * microAmp;
                point.y += Math.cos(time * 2.18 + phase * 2.74 + index * 1.68 + strandIndex * 0.27) * microAmp;
                point.z += Math.sin(time * 2.51 + phase * 2.19 + index * 2.33 + strandIndex * 0.36) * microAmp * 0.62;
            }

            return point;
        });

        const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.55);
        const nextGeometry = new THREE.TubeGeometry(curve, tubeSegments, effectiveRadius, radialSegments, false);
        mesh.geometry.dispose();
        mesh.geometry = nextGeometry;
        strand.curve = curve;
        strand.currentPoints = points;
    }

    updateSignals(time, formationProgress) {
        this.signals.forEach((signal, index) => {
            const strand = this.strands[signal.userData.strandIndex];
            if (!strand?.curve) return;

            const speed = signal.userData.speed * (0.7 + formationProgress * 0.8);
            const t = (signal.userData.offset + time * speed) % 1;
            const point = strand.curve.getPointAt(t);
            signal.position.copy(point);
            signal.scale.setScalar(0.86 + Math.sin(time * 2.1 + t * Math.PI * 6 + index) * 0.1);
            signal.material.opacity = 0.45 + formationProgress * 0.5;
        });
    }

    updateKnots(time, formationProgress) {
        this.knots.forEach((knot, index) => {
            const { start, end, phase } = knot.userData;
            knot.position.copy(start).lerp(end, formationProgress);
            knot.position.x += Math.sin(time * 0.9 + phase) * 0.08 * (1 - formationProgress);
            knot.position.y += Math.cos(time * 1.1 + phase) * 0.08 * (1 - formationProgress);
            knot.scale.setScalar(1 + Math.sin(time * 1.3 + index) * 0.08);
            knot.material.opacity = 0.18 + formationProgress * 0.28;
        });
    }

    updateScrollProgress(progress) {
        this.scrollProgress = progress;
    }

    updateSceneState({ scene, progress }) {
        this.activeScene = scene;
        this.sceneProgress = progress;
    }

    getRigProgressState(formationProgress) {
        const isMobile = window.innerWidth < 820;
        const isSmallMobile = window.innerWidth < 430;
        const isHeroMobile = window.innerWidth < 720;

        if (isHeroMobile) {
            return {
                x: 0.02 + formationProgress * 0.05,
                y: -0.54 - formationProgress * 0.12,
                z: -6.9 + formationProgress * 0.28,
                scale: (isSmallMobile ? 0.78 : 0.86) - formationProgress * (isSmallMobile ? 0.05 : 0.06),
                rotY: 0.06 + formationProgress * 0.22,
                rotX: 0.06 - formationProgress * 0.09,
                particleOpacity: 0.12 - formationProgress * 0.08
            };
        }

        return {
            x: (isSmallMobile ? 0.58 : isMobile ? 0.42 : -0.18) + formationProgress * (isMobile ? 0.08 : 3.05),
            y: (isSmallMobile ? -0.48 : isMobile ? -0.62 : 0.02) - formationProgress * 0.12,
            z: -6.9 + formationProgress * 0.28,
            scale: (isSmallMobile ? 0.62 : isMobile ? 0.72 : 1.38) - formationProgress * (isMobile ? 0.06 : 0.38),
            rotY: 0.08 + formationProgress * 0.22,
            rotX: 0.08 - formationProgress * 0.09,
            particleOpacity: 0.12 - formationProgress * 0.08
        };
    }

    animate(time, pointer) {
        const motion = this.prefersReducedMotion ? 0.18 : 1;
        const formationProgress = this.getFormationProgress();
        const sceneState = this.getRigProgressState(formationProgress);
        const separationProgress = THREE.MathUtils.clamp((formationProgress - 0.18) / 0.42, 0, 1);
        const resolveProgress = THREE.MathUtils.clamp((formationProgress - 0.58) / 0.3, 0, 1);

        this.rig.position.x = sceneState.x + pointer.x * 0.28;
        this.rig.position.y = sceneState.y + pointer.y * 0.18;
        this.rig.position.z = sceneState.z;
        this.rig.scale.setScalar(sceneState.scale);
        this.rig.rotation.y = sceneState.rotY + pointer.x * 0.06 + (1 - formationProgress) * 0.14;
        this.rig.rotation.x = sceneState.rotX + pointer.y * -0.04 + (1 - formationProgress) * 0.06;

        if (this.particleField) {
            this.particleField.rotation.y = time * 0.014 * motion;
            this.particleField.position.x = pointer.x * -1.1;
            this.particleField.position.y = pointer.y * -0.5;
            this.particleField.material.opacity = sceneState.particleOpacity - formationProgress * 0.08;
        }

        this.strands.forEach((strand, index) => {
            this.rebuildStrand(strand, time + index * 0.08, formationProgress);
            strand.mesh.material.opacity = 0.98;
        });

        this.updateKnots(time, formationProgress);
        this.updateSignals(time * motion, formationProgress);

        this.dataPlanes.forEach((plane, index) => {
            plane.position.y = plane.userData.baseY + Math.sin(time * plane.userData.speed + index) * 0.11 * motion;
            plane.position.x = (-0.8 + (index % 2) * 1.6) * separationProgress;
            plane.material.opacity = 0.004 + resolveProgress * 0.08 + Math.sin(time * 0.8 + index) * 0.006 * motion;
        });

        this.tunnelFrames.forEach((frame, index) => {
            frame.rotation.z += frame.userData.speed * 0.01 * motion;
            frame.position.z = -2 - index * 1.2 + Math.sin(time * 0.22 + index) * 0.07 * motion;
            frame.material.opacity = 0.002 + resolveProgress * 0.045 - index * 0.004;
        });
    }
}
