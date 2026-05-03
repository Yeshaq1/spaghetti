export class ScrollManager {
    constructor() {
        this.sections = [];
        this.currentScrollProgress = 0;
        this.activeScene = null;
        this.callbacks = {
            onSectionVisible: [],
            onScrollProgress: [],
            onSceneChange: [],
            onSceneProgress: []
        };
        this.visibleSections = new WeakSet();
        this.handleScroll = this.handleScroll.bind(this);
    }

    init() {
        this.refresh();
        window.addEventListener('scroll', this.handleScroll, { passive: true });
        this.handleScroll();
        return this;
    }

    refresh() {
        this.sections = Array.from(document.querySelectorAll('.story-section'));
        this.handleScroll();
    }

    handleScroll() {
        const scrollY = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        this.currentScrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;

        this.updateSectionVisibility();
        this.updateActiveScene();
        this.notifyCallbacks('onScrollProgress', this.currentScrollProgress);
    }

    updateSectionVisibility() {
        this.sections.forEach((section, index) => {
            const rect = section.getBoundingClientRect();
            const sectionVisible = rect.top < window.innerHeight * 0.82 && rect.bottom > window.innerHeight * 0.1;

            if (sectionVisible && !this.visibleSections.has(section)) {
                this.visibleSections.add(section);
                section.classList.add('visible');
                this.notifyCallbacks('onSectionVisible', { section, index });
            }
        });
    }

    updateActiveScene() {
        if (!this.sections.length) return;

        const viewportCenter = window.innerHeight * 0.5;
        let activeSection = this.sections[0];
        let closestDistance = Number.POSITIVE_INFINITY;

        this.sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            const sectionCenter = rect.top + rect.height * 0.5;
            const distance = Math.abs(sectionCenter - viewportCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                activeSection = section;
            }
        });

        const scene = activeSection.dataset.scene || activeSection.id || 'default';
        const progress = this.getSectionProgress(activeSection);
        const payload = { section: activeSection, scene, progress, index: this.sections.indexOf(activeSection) };

        if (scene !== this.activeScene) {
            this.activeScene = scene;
            this.notifyCallbacks('onSceneChange', payload);
        }

        this.notifyCallbacks('onSceneProgress', payload);
    }

    getSectionProgress(section) {
        const rect = section.getBoundingClientRect();
        const sectionHeight = Math.max(rect.height, window.innerHeight);
        const traveled = window.innerHeight - rect.top;
        return Math.min(Math.max(traveled / (sectionHeight + window.innerHeight), 0), 1);
    }

    on(eventType, callback) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType].push(callback);
        }
    }

    notifyCallbacks(eventType, data) {
        if (!this.callbacks[eventType]) return;

        this.callbacks[eventType].forEach((callback) => {
            callback(data);
        });
    }

    getScrollProgress() {
        return this.currentScrollProgress;
    }
}
