import { SpaghettiRope } from './SpaghettiRope.js';

/**
 * Case study page harness around a SpaghettiRope: owns the canvas, renderer,
 * camera and lights, keeps the rope parked in the page margin, and drives its
 * progress from how far the reader has scrolled. The rope starts knotted at the
 * top of the page and finishes straight just before the closing CTA.
 *
 * Expects the global THREE from the CDN script tags.
 */

const STRAND_COUNT_DESKTOP = 7;
const STRAND_COUNT_NARROW = 5;
const RAIL_HEIGHT = 9.2;
// Widest the coil reaches from its own axis, in world units, including sway.
// Used to keep the rope inside the viewport at every breakpoint.
const RAIL_HALF_WIDTH = 2.4;

export class SpaghettiRail {
    constructor(canvas) {
        this.canvas = canvas;
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.rig = new THREE.Group();
        this.rope = null;

        this.clock = new THREE.Clock();
        this.targetProgress = 0;
        this.progress = 0;
        this.isRunning = false;
        this.frameHandle = null;

        this.handleResize = this.handleResize.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleVisibility = this.handleVisibility.bind(this);
    }

    /** Kept for callers that inspect the rope's strands (tests, tuning). */
    get strands() {
        return this.rope ? this.rope.strands : [];
    }

    init() {
        if (!this.canvas || typeof THREE === 'undefined') return null;

        this.setupRenderer();
        this.setupScene();

        this.rope = new SpaghettiRope({
            strandCount: window.innerWidth < 1200 ? STRAND_COUNT_NARROW : STRAND_COUNT_DESKTOP,
            height: RAIL_HEIGHT,
            tubeSegments: window.innerWidth < 1200 ? 88 : 116,
            staggerSpan: 0.3
        });
        this.rig.add(this.rope.group);

        this.layout();

        window.addEventListener('resize', this.handleResize);
        window.addEventListener('scroll', this.handleScroll, { passive: true });
        document.addEventListener('visibilitychange', this.handleVisibility);

        this.handleScroll();
        this.progress = this.targetProgress;
        this.start();

        return this;
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // The rail is decorative and always in motion; cap DPR harder than the hero.
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.34;
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 120);
        this.camera.position.set(0, 0, 11);

        this.scene.add(new THREE.AmbientLight(0xfff5eb, 0.72));

        const keyLight = new THREE.DirectionalLight(0xffefd9, 1.34);
        keyLight.position.set(-3, 6, 8);
        this.scene.add(keyLight);

        const rimLight = new THREE.PointLight(0xffebd0, 1.1, 60);
        rimLight.position.set(6, -2, 8);
        this.scene.add(rimLight);

        const fillLight = new THREE.PointLight(0xffead6, 0.6, 60);
        fillLight.position.set(-6, 0, 7);
        this.scene.add(fillLight);

        this.scene.add(this.rig);
    }

    /** Places the rail in the page margin: right of the prose on LTR, left on RTL. */
    layout() {
        const width = window.innerWidth;
        const isRtl = document.documentElement.dir === 'rtl';

        const distance = this.camera.position.z;
        const visibleHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5));
        const visibleWidth = visibleHeight * this.camera.aspect;
        const unitsPerPx = visibleWidth / width;

        // Narrower viewports get a slimmer rope: it has less margin to live in,
        // and the gutter reserved for it has to come out of the reading column.
        const scale = width < 1400 ? 0.62 : width < 1600 ? 0.8 : 1;
        this.rig.scale.setScalar(scale);

        // Push the rope as far into the margin as it will go without leaving the
        // viewport, but never so far on ultra-wide screens that it drifts away
        // from the text column it belongs to.
        const railHalfPx = (RAIL_HALF_WIDTH * scale) / unitsPerPx;
        const edgeLimitPx = width / 2 - railHalfPx - 24;
        const contentLimitPx = Math.min(width, 1280) / 2 + 70;
        const centerPx = Math.max(0, Math.min(edgeLimitPx, contentLimitPx));

        this.rig.position.set(centerPx * unitsPerPx * (isRtl ? -1 : 1), 0, 0);
    }

    handleResize() {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.layout();
    }

    handleScroll() {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const raw = maxScroll > 0 ? window.scrollY / maxScroll : 0;
        // Finish untangling a little before the true bottom so the closing CTA
        // sits against fully resolved strands.
        this.targetProgress = THREE.MathUtils.clamp(raw / 0.86, 0, 1);
    }

    handleVisibility() {
        if (document.hidden) {
            this.stop();
        } else {
            this.start();
        }
    }

    update(time) {
        const ease = this.prefersReducedMotion ? 0.2 : 0.075;
        this.progress += (this.targetProgress - this.progress) * ease;
        this.rope.setProgress(this.progress);
        this.rope.update(time);

        // The whole rope settles upright as it resolves.
        this.rig.rotation.y = (1 - this.progress) * 0.5 + Math.sin(time * 0.16) * 0.04;
        this.rig.rotation.z = (1 - this.progress) * 0.14;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        const frame = () => {
            if (!this.isRunning) return;
            this.update(this.clock.getElapsedTime());
            this.renderer.render(this.scene, this.camera);
            this.frameHandle = requestAnimationFrame(frame);
        };

        frame();
    }

    stop() {
        this.isRunning = false;
        if (this.frameHandle) {
            cancelAnimationFrame(this.frameHandle);
            this.frameHandle = null;
        }
    }
}
