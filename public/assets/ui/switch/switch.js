class CharacterSwitch extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.initialized = false;
    }

    static get observedAttributes() {
        return ['active'];
    }

    async connectedCallback() {
        if (!this.initialized) {
            try {
                const htmlRes = await fetch('/assets/ui/switch/switch.html');
                const html = await htmlRes.text();
                
                const cssRes = await fetch('/assets/ui/switch/switch.css');
                const css = await cssRes.text();
                
                this.shadowRoot.innerHTML = `<style>${css}</style>${html}`;
                
                this.slots = this.shadowRoot.querySelectorAll('.character-slot');
                this.slots.forEach(slot => {
                    slot.addEventListener('click', () => {
                        const id = slot.getAttribute('data-id');
                        this.dispatchEvent(new CustomEvent('character-switch', {
                            bubbles: true,
                            composed: true,
                            detail: { id }
                        }));
                    });
                });
                
                this.initialized = true;
                this.updateDisplay();
            } catch (err) {
                console.error("Failed to load switch template:", err);
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

        const activeId = this.getAttribute('active') || 'girl';
        
        this.slots.forEach(slot => {
            if (slot.getAttribute('data-id') === activeId) {
                slot.style.display = 'none';
            } else {
                slot.style.display = '';
            }
        });
    }
}

customElements.define('character-switch', CharacterSwitch);
