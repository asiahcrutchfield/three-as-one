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
                this.initialized = true;
            } catch (err) {
                console.error("Failed to load action_buttons template:", err);
            }
        }
    }

    setOptions(options) {
        if (!this.initialized) return;

        const buildMenu = (container, config, category) => {
            if (!container) return;
            container.innerHTML = '';
            
            if (Array.isArray(config)) {
                config.forEach(item => {
                    const li = document.createElement('li');
                    li.className = 'submenu-item';
                    const btn = document.createElement('button');
                    btn.className = 'submenu-btn';
                    btn.textContent = item;
                    btn.addEventListener('click', () => {
                        this.dispatchEvent(new CustomEvent('action-selected', {
                            bubbles: true, composed: true,
                            detail: { category: category.toLowerCase(), subcategory: null, actionName: item }
                        }));
                    });
                    li.appendChild(btn);
                    container.appendChild(li);
                });
            } else if (typeof config === 'object' && config !== null) {
                Object.keys(config).forEach(subCat => {
                    const li = document.createElement('li');
                    li.className = 'submenu-item';
                    const btn = document.createElement('button');
                    btn.className = 'submenu-btn';
                    btn.textContent = subCat + ' >';
                    li.appendChild(btn);
                    
                    const subUl = document.createElement('ul');
                    subUl.className = 'sub-submenu';
                    
                    config[subCat].forEach(action => {
                        const subLi = document.createElement('li');
                        subLi.className = 'submenu-item';
                        const subBtn = document.createElement('button');
                        subBtn.className = 'submenu-btn';
                        subBtn.textContent = action;
                        subBtn.addEventListener('click', () => {
                            this.dispatchEvent(new CustomEvent('action-selected', {
                                bubbles: true, composed: true,
                                detail: { category: category.toLowerCase(), subcategory: subCat, actionName: action }
                            }));
                        });
                        subLi.appendChild(subBtn);
                        subUl.appendChild(subLi);
                    });
                    
                    li.appendChild(subUl);
                    container.appendChild(li);
                });
            }
        };

        if (options.Attack) buildMenu(this.shadowRoot.getElementById('submenu-attack'), options.Attack, 'Attack');
        if (options.Defense) buildMenu(this.shadowRoot.getElementById('submenu-defense'), options.Defense, 'Defense');
        if (options.Assist) buildMenu(this.shadowRoot.getElementById('submenu-assist'), options.Assist, 'Assist');
        if (options.Switch) buildMenu(this.shadowRoot.getElementById('submenu-switch'), options.Switch, 'Switch');
    }
}

customElements.define('action-buttons', ActionButtons);
