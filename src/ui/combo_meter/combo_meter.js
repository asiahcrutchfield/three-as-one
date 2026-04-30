class ComboMeter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.initialized = false;
        this.lastValue = 1.0;
    }

    static get observedAttributes() {
        return ['value'];
    }

    async connectedCallback() {
        if (!this.initialized) {
            try {
                const htmlRes = await fetch('/assets/ui/combo_meter/combo_meter.html');
                const html = await htmlRes.text();
                
                const cssRes = await fetch('/assets/ui/combo_meter/combo_meter.css');
                const css = await cssRes.text();
                
                this.shadowRoot.innerHTML = `<style>${css}</style>${html}`;
                
                this.container = this.shadowRoot.querySelector('.combo-container');
                this.valueText = this.shadowRoot.querySelector('.combo-value');
                this.fillBar = this.shadowRoot.querySelector('.combo-fill');
                
                this.initialized = true;
                this.updateDisplay();
            } catch (err) {
                console.error("Failed to load combo_meter template:", err);
            }
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.initialized) {
            this.updateDisplay();
        }
    }

    updateDisplay() {
        if (!this.initialized) return;

        const value = parseFloat(this.getAttribute('value')) || 1.0;
        
        // Pop animation if value increased
        if (value > this.lastValue) {
            this.valueText.style.transform = 'scale(1.4)';
            setTimeout(() => {
                this.valueText.style.transform = 'scale(1)';
            }, 100);
        }
        this.lastValue = value;

        this.valueText.textContent = value.toFixed(2);

        // Progress bar (1.0 to 3.0 maps to 0% to 100%)
        const percentage = Math.max(0, Math.min(100, ((value - 1.0) / 2.0) * 100));
        this.fillBar.style.width = `${percentage}%`;

        // Tiers
        this.container.classList.remove('tier-2', 'tier-3');
        if (value >= 3.0) {
            this.container.classList.add('tier-3');
        } else if (value >= 2.0) {
            this.container.classList.add('tier-2');
        }
    }
}

customElements.define('combo-meter', ComboMeter);
