class ActionButtons extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.initialized = false;
    }

    async connectedCallback() {
        if (!this.initialized) {
            try {
                const htmlRes = await fetch('/assets/ui/action_buttons/action_buttons.html');
                const html = await htmlRes.text();
                
                const cssRes = await fetch('/assets/ui/action_buttons/action_buttons.css');
                const css = await cssRes.text();
                
                this.shadowRoot.innerHTML = `<style>${css}</style>${html}`;
                
                const buttons = this.shadowRoot.querySelectorAll('.action-btn');
                buttons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const action = btn.getAttribute('data-action');
                        this.dispatchEvent(new CustomEvent(`action-${action}`, {
                            bubbles: true,
                            composed: true,
                            detail: { action }
                        }));
                        
                        // Add temporary pop effect
                        btn.style.transform = 'scale(0.9)';
                        setTimeout(() => {
                            btn.style.transform = '';
                        }, 100);
                    });
                });
                
                this.initialized = true;
            } catch (err) {
                console.error("Failed to load action_buttons template:", err);
            }
        }
    }
}

customElements.define('action-buttons', ActionButtons);
