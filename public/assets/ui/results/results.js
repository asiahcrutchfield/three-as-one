class BattleResults extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.initialized = false;
    }

    static get observedAttributes() {
        return ['base', 'hp-bonus', 'combo-bonus', 'counters-bonus', 'penalties', 'total', 'rank', 'active'];
    }

    async connectedCallback() {
        if (!this.initialized) {
            try {
                const htmlRes = await fetch('/assets/ui/results/results.html');
                const html = await htmlRes.text();
                
                const cssRes = await fetch('/assets/ui/results/results.css');
                const css = await cssRes.text();
                
                this.shadowRoot.innerHTML = `<style>${css}</style>${html}`;
                
                this.els = {
                    base: this.shadowRoot.getElementById('base-score'),
                    hp: this.shadowRoot.getElementById('hp-bonus'),
                    combo: this.shadowRoot.getElementById('combo-bonus'),
                    counters: this.shadowRoot.getElementById('counters-bonus'),
                    penalties: this.shadowRoot.getElementById('penalties'),
                    total: this.shadowRoot.getElementById('total-score'),
                    stamp: this.shadowRoot.getElementById('rank-stamp')
                };

                const btn = this.shadowRoot.querySelector('.continue-btn');
                btn.addEventListener('click', () => {
                    this.dispatchEvent(new CustomEvent('results-continue', { bubbles: true, composed: true }));
                });
                
                this.initialized = true;
                this.updateDisplay();
            } catch (err) {
                console.error("Failed to load results template:", err);
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

        this.els.base.textContent = this.getAttribute('base') || '100';
        this.els.hp.textContent = '+' + (this.getAttribute('hp-bonus') || '0');
        this.els.combo.textContent = '+' + (this.getAttribute('combo-bonus') || '0');
        this.els.counters.textContent = '+' + (this.getAttribute('counters-bonus') || '0');
        this.els.penalties.textContent = '-' + (this.getAttribute('penalties') || '0');
        this.els.total.textContent = this.getAttribute('total') || '100';
        
        const rank = this.getAttribute('rank') || 'C';
        this.els.stamp.textContent = rank;
        this.els.stamp.setAttribute('data-rank', rank);
    }
}

customElements.define('battle-results', BattleResults);
