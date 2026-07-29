import { pastaSurface } from './PastaSurface.js';

/**
 * A rope of spaghetti that unwinds from knotted to straight as a progress value
 * runs 0 -> 1. Strands resolve on a stagger so the untangling reads as a
 * sequence rather than a single snap, and knots ride the tangle until it clears.
 *
 * This is only the rope: it builds into a THREE.Group that the caller adds to
 * whatever scene it likes. `SpaghettiRail` wraps it in its own renderer for the
 * case study pages; the homepage drives the same rope inside the existing hero
 * scene. Both pages therefore run identical geometry.
 *
 * Expects the global THREE from the CDN script tags.
 */

const DEFAULTS = {
    strandCount: 7,
    controlPoints: 9,
    height: 9.2,
    laneSpacing: 0.24,
    tubeSegments: 116,
    radialSegments: 9,
    // Share of progress spent staggering strand starts; the rest is the window
    // any single strand gets to travel from knotted to straight.
    staggerSpan: 0.3,
    coilTurns: 3.1,
    coilSpread: 1,
    coilBulge: 0.72,
    baseRadius: 0.055,
    knotCount: 3,
    swayAmplitude: 0.16
};

export class SpaghettiRope {
    constructor(options = {}) {
        this.options = { ...DEFAULTS, ...options };
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.group = new THREE.Group();
        this.strands = [];
        this.knots = [];
        this.progress = 0;

        this.build();
    }

    build() {
        const {
            strandCount,
            controlPoints,
            height,
            laneSpacing,
            tubeSegments,
            radialSegments,
            coilTurns,
            coilSpread,
            coilBulge,
            baseRadius,
            knotCount
        } = this.options;

        for (let index = 0; index < strandCount; index++) {
            const phase = (index / strandCount) * Math.PI * 2;
            const laneX = (index - (strandCount - 1) / 2) * laneSpacing;
            const radius = baseRadius + (index % 3) * 0.009;

            const tangled = [];
            const straight = [];

            for (let point = 0; point < controlPoints; point++) {
                const t = point / (controlPoints - 1);
                const y = height * (0.5 - t);

                // Coiled: each strand wraps its own helix around the rope axis,
                // wandering furthest from centre through the middle of its run.
                const coil = phase + t * Math.PI * coilTurns + index * 0.6;
                const spread = coilSpread + Math.sin(t * Math.PI) * (coilSpread * 0.72);
                tangled.push(
                    new THREE.Vector3(
                        Math.cos(coil) * spread + Math.sin(t * 7.3 + phase) * 0.34,
                        y + Math.sin(coil * 0.8) * 0.34,
                        Math.sin(coil) * spread * coilBulge + Math.cos(t * 5.9 + phase) * 0.3
                    )
                );

                // Resolved: a near-vertical line in its own lane, with a whisper
                // of variation so it stays hand-made rather than CAD.
                straight.push(
                    new THREE.Vector3(
                        laneX + Math.sin(phase + t * 0.6) * 0.018,
                        y,
                        Math.cos(phase + t * 0.5) * 0.05
                    )
                );
            }

            const curve = new THREE.CatmullRomCurve3(tangled, false, 'centripetal', 0.5);
            const geometry = new THREE.TubeGeometry(curve, tubeSegments, radius, radialSegments, false);
            const mesh = new THREE.Mesh(geometry, pastaSurface.createStrandMaterial(index));

            mesh.userData = { tangled, straight, phase, radius, index };
            this.group.add(mesh);
            this.strands.push({ mesh, curve });
        }

        const knotMaterial = pastaSurface.createKnotMaterial();
        for (let index = 0; index < knotCount; index++) {
            const knot = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.026, 10, 20), knotMaterial.clone());
            knot.userData = {
                anchor: new THREE.Vector3(
                    (Math.random() - 0.5) * 1.6,
                    height * 0.5 - 0.6 - index * (height * 0.125),
                    (Math.random() - 0.5) * 1.2
                ),
                phase: index * 0.9
            };
            knot.position.copy(knot.userData.anchor);
            this.group.add(knot);
            this.knots.push(knot);
        }
    }

    setProgress(progress) {
        this.progress = THREE.MathUtils.clamp(progress, 0, 1);
    }

    /** Per-strand progress, staggered so strands resolve one after another. */
    getStrandProgress(index) {
        const { staggerSpan } = this.options;
        const count = this.strands.length;
        const offset = count > 1 ? (index / (count - 1)) * staggerSpan : 0;
        const local = THREE.MathUtils.clamp((this.progress - offset) / (1 - staggerSpan), 0, 1);
        return local * local * (3 - 2 * local);
    }

    /** Progress of the last strand to resolve; 1 only when the rope is fully straight. */
    getResolvedProgress() {
        return this.getStrandProgress(this.strands.length - 1);
    }

    rebuildStrand(strand, time, strandProgress) {
        const { mesh } = strand;
        const { tangled, straight, phase, radius, index } = mesh.userData;
        const { tubeSegments, radialSegments, swayAmplitude } = this.options;
        const tension = 1 - strandProgress;

        const points = tangled.map((tangledPoint, pointIndex) => {
            const point = tangledPoint.clone().lerp(straight[pointIndex], strandProgress);

            if (!this.prefersReducedMotion) {
                // Sway is loud while knotted and nearly still once resolved.
                const sway = swayAmplitude * tension + 0.012;
                point.x += Math.sin(time * 0.62 + phase * 1.3 + pointIndex * 0.8) * sway;
                point.y += Math.cos(time * 0.48 + phase + pointIndex * 0.5) * sway * 0.5;
                point.z += Math.sin(time * 0.55 + phase * 1.6 + pointIndex * 0.6) * sway * 0.8;

                const micro = 0.006 + 0.004 * strandProgress;
                point.x += Math.sin(time * 2.3 + pointIndex * 2.1 + index * 0.4) * micro;
                point.z += Math.cos(time * 2.1 + pointIndex * 1.7 + index * 0.3) * micro;
            }

            return point;
        });

        const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
        const geometry = new THREE.TubeGeometry(curve, tubeSegments, radius, radialSegments, false);
        mesh.geometry.dispose();
        mesh.geometry = geometry;
        strand.curve = curve;
    }

    update(time) {
        this.strands.forEach((strand, index) => {
            this.rebuildStrand(strand, time + index * 0.12, this.getStrandProgress(index));
        });

        const resolved = this.getResolvedProgress();
        this.knots.forEach((knot, index) => {
            const { anchor, phase } = knot.userData;
            knot.position.x = anchor.x * (1 - resolved) + Math.sin(time * 0.7 + phase) * 0.1 * (1 - resolved);
            knot.position.y = anchor.y + Math.cos(time * 0.9 + phase) * 0.12 * (1 - resolved);
            knot.position.z = anchor.z * (1 - resolved);
            knot.rotation.x += 0.0022;
            knot.rotation.y += 0.0031;
            knot.material.opacity = Math.max(0, 0.72 * (1 - resolved));
            knot.visible = knot.material.opacity > 0.01;
        });
    }

    /** Fades the whole rope, for pages that need it to leave the screen. */
    setOpacity(opacity) {
        const clamped = THREE.MathUtils.clamp(opacity, 0, 1);
        this.group.visible = clamped > 0.01;
        this.strands.forEach(({ mesh }) => {
            mesh.material.opacity = 0.98 * clamped;
        });
        const resolved = this.getResolvedProgress();
        this.knots.forEach((knot) => {
            knot.material.opacity = Math.max(0, 0.72 * (1 - resolved) * clamped);
        });
    }

    dispose() {
        this.strands.forEach(({ mesh }) => {
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.knots.forEach((knot) => {
            knot.geometry.dispose();
            knot.material.dispose();
        });
    }
}
