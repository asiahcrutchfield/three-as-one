class TurnTimer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.initialized = false;
        this.interval = null;
        this.duration = 7000;
        this.timeLeft = 7000;
    }

    async connectedCallback() {
        if (!this.initialized) {
            try {
                const htmlRes = await fetch('/assets/ui/timer/timer.html');
                const html = await htmlRes.text();
                
                const cssRes = await fetch('/assets/ui/timer/timer.css');
                const css = await cssRes.text();
                
                this.shadowRoot.innerHTML = `<style>${css}</style>${html}`;
                this.initialized = true;
            } catch (err) {
                console.error("Failed to load turn timer:", err);
            }
        }
    }

    start(durationMs = 7000) {
        if (!this.initialized) return;
        this.stop(); // clear any existing

        this.duration = durationMs;
        this.timeLeft = durationMs;
        
        const textEl = this.shadowRoot.querySelector('.timer-text');
        const fillEl = this.shadowRoot.querySelector('.timer-bar-fill');
        const container = this.shadowRoot.querySelector('.timer-container');

        container.classList.remove('fast-action', 'slow-action');
        container.style.display = 'flex';
        fillEl.style.width = '100%';
        textEl.textContent = (this.timeLeft / 1000).toFixed(1) + 's';

        let lastTime = performance.now();

        const tick = () => {
            const now = performance.now();
            const dt = now - lastTime;
            lastTime = now;

            this.timeLeft -= dt;

            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.stop(true);
            } else {
                textEl.textContent = (this.timeLeft / 1000).toFixed(1) + 's';
                const pct = (this.timeLeft / this.duration) * 100;
                fillEl.style.width = `${pct}%`;

                if (pct > 50) {
                    container.classList.add('fast-action');
                    container.classList.remove('slow-action');
                } else {
                    container.classList.add('slow-action');
                    container.classList.remove('fast-action');
                }

                this.interval = requestAnimationFrame(tick);
            }
        };

        this.interval = requestAnimationFrame(tick);
    }

    stop(isTimeout = false) {
        if (this.interval) {
            cancelAnimationFrame(this.interval);
            this.interval = null;
        }

        if (isTimeout) {
            const fillEl = this.shadowRoot.querySelector('.timer-bar-fill');
            const textEl = this.shadowRoot.querySelector('.timer-text');
            if(fillEl) fillEl.style.width = '0%';
            if(textEl) textEl.textContent = '0.0s';
            
            this.dispatchEvent(new CustomEvent('timeout', {
                bubbles: true,
                composed: true
            }));
        }
        
        const isFast = this.timeLeft >= (this.duration / 2);
        return { timeLeft: this.timeLeft, isFast };
    }
}

customElements.define('turn-timer', TurnTimer);
