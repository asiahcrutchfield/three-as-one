class PortraitFrame extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.initialized = false;
    }

    static get observedAttributes() {
        return ['name', 'role', 'active', 'image'];
    }

    async connectedCallback() {
        if (!this.initialized) {
            try {
                const htmlRes = await fetch('/assets/ui/portrait_frame/portrait_frame.html');
                const html = await htmlRes.text();
                
                const cssRes = await fetch('/assets/ui/portrait_frame/portrait_frame.css');
                const css = await cssRes.text();
                
                this.shadowRoot.innerHTML = `<style>${css}</style>${html}`;
                
                this.nameText = this.shadowRoot.querySelector('.character-name');
                this.roleIcon = this.shadowRoot.querySelector('.role-icon');
                this.imgEl = this.shadowRoot.querySelector('.portrait-img');
                this.placeholder = this.shadowRoot.querySelector('.portrait-placeholder');
                
                this.initialized = true;
                this.updateDisplay();
            } catch (err) {
                console.error("Failed to load portrait_frame template:", err);
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

        const name = this.getAttribute('name') || 'Unknown';
        const role = this.getAttribute('role') || 'damage';
        const imageSrc = this.getAttribute('image');

        this.nameText.textContent = name;
        
        this.roleIcon.className = 'role-icon';
        this.roleIcon.classList.add(role);

        if (imageSrc) {
            this.imgEl.src = imageSrc;
            this.imgEl.style.display = 'block';
            this.placeholder.style.display = 'none';
        } else {
            this.imgEl.style.display = 'none';
            this.placeholder.style.display = 'block';
        }
    }
}

customElements.define('portrait-frame', PortraitFrame);
