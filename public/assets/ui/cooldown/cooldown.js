class CooldownIndicator extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.initialized = false;
    }

    static get observedAttributes() {
        return ['turns'];
    }

    async connectedCallback() {
        if (!this.initialized) {
            try {
                const htmlRes = await fetch('/assets/ui/cooldown/cooldown.html');
                const html = await htmlRes.text();
                
                const cssRes = await fetch('/assets/ui/cooldown/cooldown.css');
                const css = await cssRes.text();
                
                this.shadowRoot.innerHTML = `<style>${css}</style>${html}`;
                
                this.container = this.shadowRoot.querySelector('.cooldown-container');
                this.text = this.shadowRoot.querySelector('.cooldown-text');
                
                this.initialized = true;
                this.updateDisplay();
            } catch (err) {
                console.error("Failed to load cooldown template:", err);
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

        const turns = parseInt(this.getAttribute('turns')) || 0;
        
        if (turns > 0) {
            this.text.textContent = turns;
            this.container.classList.add('active');
            
            // Re-trigger animation
            this.text.style.animation = 'none';
            this.text.offsetHeight; /* trigger reflow */
            this.text.style.animation = null; 
        } else {
            this.container.classList.remove('active');
        }
    }
}

customElements.define('cooldown-indicator', CooldownIndicator);
