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
    }

    init() {
        this.scene.add(this.rig);
        this.rig.add(this.strandGroup);
        this.rig.add(this.signalGroup);
        this.rig.add(this.dataGroup);
        this.rig.add(this.tunnelGroup);

        this.positionRig();
        this.createParticleField();
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

    createSpaghettiCore() {
        const strandCount = window.innerWidth < 720 ? 10 : 18;

        for (let index = 0; index < strandCount; index++) {
            const strand = this.createStrand(index, strandCount);
            this.strands.push(strand);
            this.strandGroup.add(strand.mesh);
        }

        const knotMaterial = new THREE.MeshBasicMaterial({
            color: 0xfff4df,
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        for (let index = 0; index < 4; index++) {
            const knot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 18), knotMaterial.clone());
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
        const radius = 0.06 + (index % 3) * 0.014;
        const tubeSegments = 120;
        const radialSegments = 8;

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
        const geometry = new THREE.TubeGeometry(curve, tubeSegments, radius, radialSegments, false);

        const material = new THREE.MeshStandardMaterial({
            color: 0xffefd1,
            roughness: 0.34,
            metalness: 0.025,
            emissive: 0x241c13,
            transparent: true,
            opacity: 0.98
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = {
            chaosPoints: chaosPoints.map((point) => point.clone()),
            lanePoints: lanePoints.map((point) => point.clone()),
            orderedPoints: orderedPoints.map((point) => point.clone()),
            phase,
            radius,
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
        const { chaosPoints, lanePoints, orderedPoints, phase, radius, tubeSegments, radialSegments } = mesh.userData;
        const tension = 1 - formationProgress;
        const laneProgress = THREE.MathUtils.clamp(formationProgress / 0.58, 0, 1);
        const routeProgress = THREE.MathUtils.clamp((formationProgress - 0.28) / 0.5, 0, 1);

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
            }

            return point;
        });

        const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.55);
        const nextGeometry = new THREE.TubeGeometry(curve, tubeSegments, radius, radialSegments, false);
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
