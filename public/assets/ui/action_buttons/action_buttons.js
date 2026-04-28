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
                
                const submenu = this.shadowRoot.getElementById('submenu');
                this.subMenuOptions = {
                    attack: ['Pounce', 'Rock Throw', 'Comfort', "Tiger's Roar"],
                    defense: ['Block', 'Dodge', 'Counter'],
                    assist: ['Officer Assist', 'Man Assist']
                };
                let currentActiveAction = null;

                const buttons = this.shadowRoot.querySelectorAll('.action-btn');
                buttons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const action = btn.getAttribute('data-action');
                        
                        // Add temporary pop effect
                        btn.style.transform = 'scale(0.9)';
                        setTimeout(() => {
                            btn.style.transform = '';
                        }, 100);

                        if (currentActiveAction === action) {
                            submenu.classList.remove('active');
                            currentActiveAction = null;
                            return;
                        }

                        currentActiveAction = action;
                        submenu.innerHTML = '';
                        
                        const options = this.subMenuOptions[action] || [];
                        options.forEach(opt => {
                            const subBtn = document.createElement('button');
                            subBtn.className = 'submenu-btn';
                            subBtn.textContent = opt;
                            subBtn.addEventListener('click', (ev) => {
                                ev.stopPropagation();
                                this.dispatchEvent(new CustomEvent(`action-${action}-${opt.toLowerCase()}`, {
                                    bubbles: true,
                                    composed: true,
                                    detail: { action, subAction: opt.toLowerCase() }
                                }));
                                submenu.classList.remove('active');
                                currentActiveAction = null;
                            });
                            submenu.appendChild(subBtn);
                        });

                        submenu.classList.add('active');
                    });
                });

                // Close submenu when clicking outside
                document.addEventListener('click', (e) => {
                    // Check if the click is outside the component
                    if (!e.composedPath().includes(this)) {
                        submenu.classList.remove('active');
                        currentActiveAction = null;
                    }
                });
                
                this.initialized = true;
            } catch (err) {
                console.error("Failed to load action_buttons template:", err);
            }
        }
    }

    setOptions(options) {
        this.subMenuOptions = options;
    }
}

customElements.define('action-buttons', ActionButtons);
