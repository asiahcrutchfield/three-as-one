class RewardSelection extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.initialized = false;
        
        // Mock data for testing
        this.rewards = [
            { id: 'hp_up', title: 'HP UP', desc: '+20 Max HP for all characters.' },
            { id: 'damage_up', title: 'DAMAGE UP', desc: '+5 Base Damage.' },
            { id: 'combo_boost', title: 'COMBO BOOST', desc: 'Increases combo gain by 20%.' }
        ];
    }

    async connectedCallback() {
        if (!this.initialized) {
            try {
                const htmlRes = await fetch('/assets/ui/reward_selection/reward_selection.html');
                const html = await htmlRes.text();
                
                const cssRes = await fetch('/assets/ui/reward_selection/reward_selection.css');
                const css = await cssRes.text();
                
                this.shadowRoot.innerHTML = `<style>${css}</style>${html}`;
                
                this.wrapper = this.shadowRoot.querySelector('.cards-wrapper');
                this.template = this.shadowRoot.getElementById('reward-card-template');
                
                this.initialized = true;
                this.renderCards();
            } catch (err) {
                console.error("Failed to load reward_selection template:", err);
            }
        }
    }

    renderCards() {
        this.wrapper.innerHTML = '';
        
        this.rewards.forEach(reward => {
            const clone = this.template.content.cloneNode(true);
            const card = clone.querySelector('.reward-card');
            
            clone.querySelector('.card-title').textContent = reward.title;
            clone.querySelector('.card-desc').textContent = reward.desc;
            
            card.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('reward-selected', {
                    bubbles: true,
                    composed: true,
                    detail: { rewardId: reward.id }
                }));
            });
            
            this.wrapper.appendChild(clone);
        });
    }
}

customElements.define('reward-selection', RewardSelection);
