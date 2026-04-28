class HealthBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.initialized = false;
    }

    static get observedAttributes() {
        return ['hp', 'max-hp', 'name', 'type', 'image'];
    }

    async connectedCallback() {
        if (!this.initialized) {
            try {
                // Fetch template and styles relative to public root
                const htmlRes = await fetch('/assets/ui/health_bar/health_bar.html');
                const html = await htmlRes.text();
                
                const cssRes = await fetch('/assets/ui/health_bar/health_bar.css');
                const css = await cssRes.text();
                
                this.shadowRoot.innerHTML = `<style>${css}</style>${html}`;
                
                this.barInner = this.shadowRoot.querySelector('.bar-inner');
                this.hpText = this.shadowRoot.querySelector('.hp-text');
                this.nameText = this.shadowRoot.querySelector('.name');
                this.container = this.shadowRoot.querySelector('.health-bar-container');
                this.portraitImg = this.shadowRoot.querySelector('.portrait-img');
                
                this.initialized = true;
                this.updateDisplay();
            } catch (err) {
                console.error("Failed to load health_bar template:", err);
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

        const hp = parseFloat(this.getAttribute('hp')) || 0;
        const maxHp = parseFloat(this.getAttribute('max-hp')) || 100;
        const name = this.getAttribute('name') || 'Unknown';
        const type = this.getAttribute('type');
        const image = this.getAttribute('image');

        const percentage = Math.max(0, Math.min(100, (hp / maxHp) * 100));

        this.nameText.textContent = name;
        this.hpText.textContent = `${Math.floor(hp)} / ${maxHp}`;
        this.barInner.style.width = `${percentage}%`;

        if (image) {
            this.portraitImg.src = image;
            this.portraitImg.style.display = 'block';
        } else {
            this.portraitImg.style.display = 'none';
        }

        if (type === 'enemy') {
            this.container.classList.add('enemy');
        } else {
            this.container.classList.remove('enemy');
        }

        // Apply low hp warning for players
        if (type !== 'enemy' && percentage <= 25) {
            this.barInner.classList.add('low-hp');
        } else {
            this.barInner.classList.remove('low-hp');
        }
    }
}

customElements.define('health-bar', HealthBar);
