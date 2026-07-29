/**
 * Procedural pasta surface: albedo, normal and roughness maps generated once and
 * shared by every strand on the site, so the homepage hero and the case study
 * rail are made of visibly the same spaghetti.
 *
 * Expects the global THREE from the CDN script tags.
 */
export class PastaSurface {
    constructor() {
        this.albedoMap = null;
        this.normalMap = null;
        this.roughnessMap = null;
    }

    hash2(x, y) {
        const sn = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
        return sn - Math.floor(sn);
    }

    noise2(x, y) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;
        const ux = fx * fx * (3 - 2 * fx);
        const uy = fy * fy * (3 - 2 * fy);
        const a = this.hash2(ix, iy);
        const b = this.hash2(ix + 1, iy);
        const c = this.hash2(ix, iy + 1);
        const d = this.hash2(ix + 1, iy + 1);
        return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, ux), THREE.MathUtils.lerp(c, d, ux), uy);
    }

    fbm(x, y) {
        let value = 0;
        let amplitude = 0.52;
        let frequency = 1;
        for (let octave = 0; octave < 5; octave++) {
            value += amplitude * this.noise2(x * frequency, y * frequency);
            frequency *= 2.05;
            amplitude *= 0.5;
        }
        return value;
    }

    sampleHeight(u, v) {
        const x = u * 5.2;
        const y = v * 5.2;
        const base = this.fbm(x, y);
        const axial = 0.11 * Math.sin(u * Math.PI * 2 * 26 + base * 1.8) * this.noise2(x * 3.1, y * 3.1);
        const ridge = Math.abs(Math.sin(u * Math.PI * 2 * 38 + y * 14.3)) * 0.065;
        const speck = this.hash2(u * 193.17, v * 149.03) < 0.035 ? -0.035 : 0;
        const flour = this.hash2(u * 67.2, v * 59.8) * 0.032;
        return THREE.MathUtils.clamp(0.5 + base * 0.3 + axial + ridge + speck + flour, 0, 1);
    }

    linearToSRGBChannel(c) {
        return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    }

    ensure() {
        if (this.albedoMap) return this;

        const size = 128;
        const cells = size * size;
        const height = new Float32Array(cells);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                height[y * size + x] = this.sampleHeight(x / size, y / size);
            }
        }

        const heightAt = (ix, iy) =>
            height[THREE.MathUtils.euclideanModulo(iy, size) * size + THREE.MathUtils.euclideanModulo(ix, size)];

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
                if (this.hash2(u * 401.3, v * 307.9) < 0.028) {
                    lr *= 0.96;
                    lg *= 0.94;
                    lb *= 0.92;
                }
                if (this.hash2(u * 211.1, v * 183.7) < 0.012) {
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

        this.albedoMap = new THREE.DataTexture(albedoData, size, size, THREE.RGBAFormat);
        configureMap(this.albedoMap, THREE.sRGBEncoding);

        this.normalMap = new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat);
        configureMap(this.normalMap, THREE.LinearEncoding);

        this.roughnessMap = new THREE.DataTexture(roughData, size, size, THREE.RGBAFormat);
        configureMap(this.roughnessMap, THREE.LinearEncoding);

        return this;
    }

    createStrandMaterial(strandIndex) {
        this.ensure();

        const base = new THREE.Color(0xfffff4);
        base.offsetHSL(
            (Math.random() - 0.5) * 0.018,
            (Math.random() - 0.5) * 0.04,
            (Math.random() - 0.5) * 0.028
        );

        const mat = new THREE.MeshPhysicalMaterial({
            map: this.albedoMap,
            normalMap: this.normalMap,
            normalScale: new THREE.Vector2(0.52, 0.52),
            color: base,
            roughness: 0.28 + (strandIndex % 5) * 0.014,
            metalness: 0.01,
            roughnessMap: this.roughnessMap,
            clearcoat: 0.26,
            clearcoatRoughness: 0.34,
            clearcoatRoughnessMap: this.roughnessMap,
            clearcoatNormalMap: this.normalMap,
            clearcoatNormalScale: new THREE.Vector2(0.2, 0.2),
            emissive: 0xffe8d4,
            transparent: true,
            opacity: 0.98
        });
        mat.emissiveIntensity = 0.11;
        return mat;
    }

    createKnotMaterial() {
        this.ensure();

        const mat = new THREE.MeshPhysicalMaterial({
            map: this.albedoMap,
            normalMap: this.normalMap,
            normalScale: new THREE.Vector2(0.44, 0.44),
            color: 0xfffffb,
            roughness: 0.32,
            metalness: 0.01,
            roughnessMap: this.roughnessMap,
            clearcoat: 0.22,
            clearcoatRoughness: 0.36,
            clearcoatRoughnessMap: this.roughnessMap,
            clearcoatNormalMap: this.normalMap,
            clearcoatNormalScale: new THREE.Vector2(0.16, 0.16),
            emissive: 0xfff0e6,
            transparent: true,
            opacity: 0.82,
            depthWrite: true
        });
        mat.emissiveIntensity = 0.1;
        return mat;
    }
}

export const pastaSurface = new PastaSurface();
