import { SpaghettiRope } from './SpaghettiRope.js';

/**
 * Homepage hero scene. Runs the same SpaghettiRope as the case study rail, but
 * leaning over at an angle while knotted so it reads as a mess for the "tangled
 * data, unclear workflows" annotation to point at. As the reader scrolls from
 * the hero into the intro headline the rope unwinds and rights itself to
 * vertical, then leaves the screen with the canvas.
 *
 * Expects the global THREE from the CDN script tags.
 */

// How far the rope leans while fully knotted, in degrees.
const HERO_TILT_DEGREES = 45;

// Camera values mirrored from SceneManager so the rig can turn a viewport
// fraction into world x without holding a camera reference. The distance is the
// camera's resting z minus the rig's, which only has to be close enough to park
// the rope at a repeatable spot on screen.
const CAMERA_FOV_DEGREES = 58;
const CAMERA_TO_RIG_DISTANCE = 17.1;

// Where the resolved rope sits inside the gutter beside the intro copy, as a
// share of that gutter: past halfway, so it reads as its own column rather than
// as something crowding the headline.
const GUTTER_POSITION = 0.58;

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

        this.particleField = null;
        this.rope = null;
        this.signals = [];
    }

    /** The rope's strands, for the signal lights and for tuning scripts. */
    get strands() {
        return this.rope ? this.rope.strands : [];
    }

    init() {
        this.scene.add(this.rig);
        this.rig.add(this.strandGroup);
        this.rig.add(this.signalGroup);

        this.createParticleField();
        this.createRope();
        this.createSignals();
        this.positionRig();

        return this;
    }

    /** World x that lands `fraction` of the way across the viewport. */
    worldXAtViewportFraction(fraction) {
        const visibleHeight =
            2 * CAMERA_TO_RIG_DISTANCE * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV_DEGREES / 2));
        const visibleWidth = visibleHeight * (window.innerWidth / window.innerHeight);
        return (fraction - 0.5) * visibleWidth;
    }

    /**
     * Desktop resting place for the resolved rope, measured off the intro copy
     * column so it clears the headline at any window width instead of trusting a
     * fixed world offset. Cached: the animation loop reads it every frame, and
     * `positionRig` re-measures on resize.
     */
    measureResolvedX() {
        const copy = document.querySelector('#intro .hero-copy');
        const copyRight = copy ? copy.getBoundingClientRect().right : window.innerWidth * 0.55;
        const centre = copyRight + (window.innerWidth - copyRight) * GUTTER_POSITION;

        // Never so far out that the strands or their pointer parallax clip the edge.
        const fraction = THREE.MathUtils.clamp(centre / window.innerWidth, 0.66, 0.87);
        this.resolvedX = this.worldXAtViewportFraction(fraction);
        return this.resolvedX;
    }

    createRope() {
        const narrow = window.innerWidth < 720;

        this.rope = new SpaghettiRope({
            strandCount: narrow ? 5 : 7,
            height: narrow ? 7.4 : 8.6,
            tubeSegments: narrow ? 88 : 116,
            // A touch tighter than the case study rail: the hero rope is seen
            // whole rather than sliced by the viewport, so it needs to knot up
            // more compactly to read as a tangle.
            coilSpread: 0.92,
            coilTurns: 3.4,
            staggerSpan: 0.32
        });

        this.strandGroup.add(this.rope.group);
    }

    positionRig() {
        this.measureResolvedX();
        const state = this.getRigProgressState(0);
        this.rig.position.set(state.x, state.y, state.z);
        this.rig.scale.setScalar(state.scale);
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

    createSignals() {
        const signalMaterial = new THREE.MeshBasicMaterial({
            color: 0xfff1d7,
            transparent: true,
            opacity: 0.38,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const count = Math.min(5, this.strands.length);
        for (let index = 0; index < count; index++) {
            const signal = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 14), signalMaterial.clone());
            signal.userData = {
                strandIndex: index,
                offset: index / count,
                speed: 0.085 + index * 0.012
            };
            this.signals.push(signal);
            this.signalGroup.add(signal);
        }
    }

    /**
     * How far through the hero -> intro transition the reader is. The rope is
     * fully knotted at the top of the hero and fully straight by the time the
     * intro headline has settled.
     */
    getFormationProgress() {
        const intro = document.getElementById('intro');
        let targetProgress = this.activeScene === 'hero' ? 0.03 : 1;

        if (intro) {
            const rect = intro.getBoundingClientRect();
            const startsWhenIntroPeeks = window.innerHeight * 0.98;
            const finishesBeforeHeadlineSettles = window.innerHeight * 0.34;
            const rawProgress =
                (startsWhenIntroPeeks - rect.top) / (startsWhenIntroPeeks - finishesBeforeHeadlineSettles);
            targetProgress = THREE.MathUtils.clamp(rawProgress, 0.03, 1);
        }

        if (targetProgress >= 0.98) {
            this.visualScrollProgress = 1;
        } else {
            this.visualScrollProgress +=
                (targetProgress - this.visualScrollProgress) * (this.prefersReducedMotion ? 0.22 : 0.32);
        }

        const clamped = THREE.MathUtils.clamp(this.visualScrollProgress, 0, 1);
        return clamped * clamped * (3 - 2 * clamped);
    }

    /**
     * Where the rope sits knotted (beside the hero annotation, so the arrow has
     * something to point at) and resolved (clear of the intro headline).
     */
    getLayoutTier() {
        const width = window.innerWidth;

        // Phones have no margin beside the copy — the intro paragraph runs to
        // within ~16px of the edge — so instead of parking the rope next to the
        // text it finishes straightening early, in the empty hero, and then
        // dissolves as the headline settles. Wider screens have room to keep it.
        if (width < 720) {
            const narrowest = width < 430;
            return {
                tangled: { x: narrowest ? 0.1 : 0.15, y: -0.35, scale: narrowest ? 0.62 : 0.68 },
                resolved: { x: narrowest ? 0.5 : 0.6, y: 0.55, scale: narrowest ? 0.52 : 0.56 },
                resolveBy: 0.6,
                fadeFrom: 0.64,
                fadeTo: 0.88
            };
        }

        if (width < 1100) {
            return {
                tangled: { x: 0.6, y: -0.3, scale: 0.72 },
                resolved: { x: 6.05, y: -0.1, scale: 0.62 },
                resolveBy: 1
            };
        }

        return {
            tangled: { x: -0.35, y: -0.05, scale: 1.06 },
            resolved: { x: this.resolvedX ?? this.measureResolvedX(), y: 0, scale: 0.86 },
            resolveBy: 1
        };
    }

    getRigProgressState(formationProgress) {
        const { tangled, resolved } = this.getLayoutTier();
        const t = formationProgress;

        // The swing out to the side leads the untangling, so the rope is already
        // clear of the copy column by the time the headline has settled rather
        // than sliding past it while it straightens.
        const lateral = 1 - Math.pow(1 - t, 1.9);

        return {
            x: THREE.MathUtils.lerp(tangled.x, resolved.x, lateral),
            y: THREE.MathUtils.lerp(tangled.y, resolved.y, t),
            z: -6.9 + t * 0.28,
            scale: THREE.MathUtils.lerp(tangled.scale, resolved.scale, t),
            particleOpacity: 0.12 - t * 0.08
        };
    }

    updateSignals(time, formationProgress) {
        this.signals.forEach((signal, index) => {
            const strand = this.strands[signal.userData.strandIndex];
            if (!strand?.curve) return;

            const speed = signal.userData.speed * (0.7 + formationProgress * 0.8);
            const t = (signal.userData.offset + time * speed) % 1;
            signal.position.copy(strand.curve.getPointAt(t));
            signal.scale.setScalar(0.86 + Math.sin(time * 2.1 + t * Math.PI * 6 + index) * 0.1);
            signal.material.opacity = 0.35 + formationProgress * 0.4;
        });
    }

    updateScrollProgress(progress) {
        this.scrollProgress = progress;
    }

    updateSceneState({ scene, progress }) {
        this.activeScene = scene;
        this.sceneProgress = progress;
    }

    animate(time, pointer) {
        const motion = this.prefersReducedMotion ? 0.18 : 1;
        const formationProgress = this.getFormationProgress();
        const sceneState = this.getRigProgressState(formationProgress);
        const tier = this.getLayoutTier();

        // Breakpoints that fade the rope out finish untangling early, so the
        // rope is fully straight and upright before it starts to leave.
        const ropeProgress = THREE.MathUtils.clamp(formationProgress / (tier.resolveBy || 1), 0, 1);

        this.rig.position.x = sceneState.x + pointer.x * 0.28;
        this.rig.position.y = sceneState.y + pointer.y * 0.18;
        this.rig.position.z = sceneState.z;
        this.rig.scale.setScalar(sceneState.scale);

        // Leaning while knotted, upright once resolved.
        this.rig.rotation.z = THREE.MathUtils.degToRad(HERO_TILT_DEGREES) * (1 - ropeProgress);
        this.rig.rotation.y = pointer.x * 0.06 + (1 - ropeProgress) * 0.24;
        this.rig.rotation.x = pointer.y * -0.04 + (1 - ropeProgress) * 0.08;

        if (this.particleField) {
            this.particleField.rotation.y = time * 0.014 * motion;
            this.particleField.position.x = pointer.x * -1.1;
            this.particleField.position.y = pointer.y * -0.5;
            this.particleField.material.opacity = sceneState.particleOpacity;
        }

        this.rope.setProgress(ropeProgress);
        this.rope.update(time);

        // Breakpoints with no room beside the copy fade the rope out once it has
        // finished straightening, rather than parking it over the text.
        if (tier.fadeFrom !== undefined) {
            const fade = THREE.MathUtils.clamp(
                (formationProgress - tier.fadeFrom) / (tier.fadeTo - tier.fadeFrom),
                0,
                1
            );
            this.rope.setOpacity(1 - fade);
            this.signalGroup.visible = fade < 1;
        }

        this.updateSignals(time * motion, ropeProgress);
    }
}
