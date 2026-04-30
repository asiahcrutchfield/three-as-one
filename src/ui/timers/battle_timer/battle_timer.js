class BattleTimer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.initialized = false;
        this.maxTime = 7.0;
        this.currentTime = 7.0;
        this.timerInterval = null;
    }

    async connectedCallback() {
        if (!this.initialized) {
            try {
                const htmlRes = await fetch('/assets/ui/battle_timer/battle_timer.html');
                const html = await htmlRes.text();
                
                const cssRes = await fetch('/assets/ui/battle_timer/battle_timer.css');
                const css = await cssRes.text();
                
                this.shadowRoot.innerHTML = `<style>${css}</style>${html}`;
                
                this.container = this.shadowRoot.querySelector('.timer-container');
                this.valueText = this.shadowRoot.querySelector('.timer-value');
                this.fillCircle = this.shadowRoot.querySelector('.timer-fill');
                
                this.initialized = true;
                this.updateDisplay();
            } catch (err) {
                console.error("Failed to load battle_timer template:", err);
            }
        }
    }

    start(time = 7.0) {
        this.maxTime = time;
        this.currentTime = time;
        this.updateDisplay();

        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            this.currentTime = Math.max(0, this.currentTime - 0.1);
            this.updateDisplay();

            if (this.currentTime <= 0) {
                clearInterval(this.timerInterval);
                this.dispatchEvent(new CustomEvent('timeout', { bubbles: true, composed: true }));
            }
        }, 100);
    }

    stop() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    updateDisplay() {
        if (!this.initialized) return;

        this.valueText.textContent = this.currentTime.toFixed(1);

        // Circumference is 2 * PI * 45 = 282.74
        const circumference = 283;
        const percentage = this.currentTime / this.maxTime;
        const offset = circumference - (percentage * circumference);
        this.fillCircle.style.strokeDashoffset = offset;

        this.container.classList.remove('warning', 'urgent');
        if (this.currentTime <= 1.5) {
            this.container.classList.add('urgent');
        } else if (this.currentTime <= 3.0) {
            this.container.classList.add('warning');
        }
    }
}

customElements.define('battle-timer', BattleTimer);
