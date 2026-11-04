// /gist podcast player: play/pause, seek and elapsed time for today's episode.

(() => {
    const root = document.querySelector('[data-gist-player]');
    if (!root) return;

    const audio = root.querySelector('[data-player-audio]');
    const toggle = root.querySelector('[data-player-toggle]');
    const seek = root.querySelector('[data-player-seek]');
    const elapsed = root.querySelector('[data-player-elapsed]');
    const duration = root.querySelector('[data-player-duration]');
    let isSeeking = false;

    const formatTime = (seconds) => {
        if (!Number.isFinite(seconds)) return '0:00';
        const total = Math.floor(seconds);
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = String(total % 60).padStart(2, '0');
        return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
    };

    const paintSeek = () => seek.style.setProperty('--progress', `${(Number(seek.value) / 10).toFixed(1)}%`);

    const setPlaying = (playing) => {
        root.classList.toggle('is-playing', playing);
        toggle.setAttribute('aria-label', playing ? 'Pause episode' : 'Play episode');
    };

    toggle.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().catch(() => setPlaying(false));
        } else {
            audio.pause();
        }
    });

    audio.addEventListener('play', () => setPlaying(true));
    audio.addEventListener('pause', () => setPlaying(false));
    audio.addEventListener('ended', () => setPlaying(false));
    audio.addEventListener('loadedmetadata', () => {
        duration.textContent = formatTime(audio.duration);
    });
    audio.addEventListener('timeupdate', () => {
        elapsed.textContent = formatTime(audio.currentTime);
        if (!isSeeking && audio.duration) {
            seek.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
            paintSeek();
        }
    });

    seek.addEventListener('input', () => {
        isSeeking = true;
        paintSeek();
        if (audio.duration) elapsed.textContent = formatTime((Number(seek.value) / 1000) * audio.duration);
    });

    seek.addEventListener('change', () => {
        isSeeking = false;
        const apply = () => {
            audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
        };
        if (audio.duration) {
            apply();
        } else {
            // Nothing loaded yet: load the episode, then jump to the chosen point.
            audio.addEventListener('loadedmetadata', apply, { once: true });
            audio.load();
        }
    });
})();
