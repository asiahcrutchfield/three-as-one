import html from "./ActionMenu.html?raw";
import { createSubMenu } from "/src/ui/actionMenu/SubMenu/SubMenu.js";
import { createTimer } from "/src/ui/actionMenu/Timer/Timer.js";

export async function createActionMenu() {
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    const actionMenu = template.content.querySelector("#action-menu");
    const subMenu = await createSubMenu();
    const timer = await createTimer();
    const tooltipTitle = actionMenu.querySelector(".action-preview-tooltip-title");
    const tooltipMeta = actionMenu.querySelector(".action-preview-tooltip-meta");
    const tooltipBody = actionMenu.querySelector(".action-preview-tooltip-body");
    const tooltip = actionMenu.querySelector("#action-preview-tooltip");
    const mainItems = [...actionMenu.querySelectorAll(".action-main-item")];
    const timerRoot = timer.querySelector("#battle-timer");
    const timerNumber = timer.querySelector(".timer-number");
    let menuData = {
        attack: [],
        defend: [],
        assist: [],
        switch: []
    };
    let hoverTimer = null;
    let tooltipHideTimer = null;
    let activeMenuKey = null;
    let isLocked = false;

    function clearPreview() {
        activeMenuKey = null;
        subMenu.innerHTML = "";
        subMenu.classList.add("hidden");
        tooltip.classList.add("hidden");
        mainItems.forEach((item) => item.classList.remove("is-active"));
    }

    function queueTooltipHide(delay = 550) {
        window.clearTimeout(tooltipHideTimer);
        tooltipHideTimer = window.setTimeout(() => {
            clearPreview();
        }, delay);
    }

    function showTooltip() {
        window.clearTimeout(tooltipHideTimer);
        tooltip.classList.remove("hidden");
    }

    function readItemData(item) {
        if (item.dataset) {
            return {
                id: item.dataset.itemId || "",
                title: item.dataset.title || "",
                desc: item.dataset.desc || "",
                type: item.dataset.type || "",
                cost: item.dataset.cost || "",
                damage: item.dataset.damage || "",
                disabled: item.dataset.disabled === "true"
            };
        }

        return item;
    }

    function formatMeta(item) {
        const parts = [item.type, item.cost, item.damage ? `DMG ${item.damage}` : null].filter(Boolean);
        return parts.join(" - ");
    }

    function setTooltip(item) {
        const data = readItemData(item);
        showTooltip();
        tooltipTitle.textContent = data.title;
        tooltipMeta.textContent = formatMeta(data);
        tooltipMeta.classList.toggle("hidden", !tooltipMeta.textContent);
        tooltipBody.textContent = data.desc;
    }

    function setActiveSubItem(target) {
        const items = [...subMenu.querySelectorAll(".action-sub-item")];
        items.forEach((item) => item.classList.toggle("is-active", item === target));
    }

    function bindSubmenuEvents() {
        [...subMenu.querySelectorAll(".action-sub-item")].forEach((item) => {
            item.addEventListener("mouseenter", () => {
                setActiveSubItem(item);
                setTooltip(item);
            });

            item.addEventListener("click", () => {
                const data = readItemData(item);
                if (data.disabled || isLocked) return;

                actionMenu.dispatchEvent(new CustomEvent("actionselected", {
                    bubbles: true,
                    detail: {
                        menuKey: activeMenuKey,
                        itemId: data.id,
                        item: (menuData[activeMenuKey] || []).find((entry) => entry.id === data.id) || data
                    }
                }));
            });
        });
    }

    function renderSubmenu(menuKey) {
        const items = menuData[menuKey] || [];
        activeMenuKey = menuKey;
        subMenu.innerHTML = items.map((item, index) => `
            <li class="action-sub-item${index === 0 ? " is-active" : ""}${item.disabled ? " is-disabled" : ""}" data-item-id="${item.id || ""}" data-title="${item.title}" data-desc="${item.desc}" data-type="${item.type || ""}" data-cost="${item.cost || ""}" data-damage="${item.damage || ""}" data-disabled="${item.disabled ? "true" : "false"}" aria-disabled="${item.disabled ? "true" : "false"}">
                ${item.label}
            </li>
        `).join("");

        subMenu.classList.remove("hidden");
        subMenu.classList.remove("is-entering");
        void subMenu.offsetWidth;
        subMenu.classList.add("is-entering");
        tooltip.classList.add("hidden");

        const first = subMenu.querySelector(".action-sub-item");
        if (first) setActiveSubItem(first);
        bindSubmenuEvents();
    }

    mainItems.forEach((item) => {
        item.addEventListener("mouseenter", () => {
            if (isLocked) return;
            window.clearTimeout(hoverTimer);
            hoverTimer = window.setTimeout(() => {
                if (activeMenuKey === item.dataset.action) return;
                const items = menuData[item.dataset.action] || [];
                if (!items.length) {
                    clearPreview();
                    return;
                }
                mainItems.forEach((main) => main.classList.toggle("is-active", main === item));
                renderSubmenu(item.dataset.action);
            }, 70);
        });
    });

    actionMenu.addEventListener("mouseenter", () => window.clearTimeout(tooltipHideTimer));
    actionMenu.addEventListener("mouseleave", () => queueTooltipHide());

    actionMenu.insertBefore(subMenu, actionMenu.querySelector("#action-main"));
    actionMenu.append(timer);
    actionMenu.setMenuData = (nextData) => {
        menuData = {
            attack: nextData?.attack || [],
            defend: nextData?.defend || [],
            assist: nextData?.assist || [],
            switch: nextData?.switch || []
        };

        mainItems.forEach((item) => {
            const items = menuData[item.dataset.action] || [];
            item.classList.toggle("is-disabled", !items.length || items.every((entry) => entry.disabled));
        });

        clearPreview();
    };
    actionMenu.setLocked = (locked) => {
        isLocked = locked;
        actionMenu.classList.toggle("is-locked", locked);
        if (locked) clearPreview();
    };
    actionMenu.setTurnTimer = ({ durationMs = 0, remainingMs = 0, visible = true } = {}) => {
        const pct = durationMs > 0 ? Math.max(0, Math.min(100, (remainingMs / durationMs) * 100)) : 0;
        if (timerRoot) {
            timerRoot.style.setProperty("--timer-pct", `${pct}%`);
            timerRoot.classList.toggle("hidden", !visible);
        }
        if (timerNumber) {
            timerNumber.textContent = `${Math.max(0, remainingMs / 1000).toFixed(1)}`;
        }
    };
    clearPreview();
    actionMenu.setTurnTimer({ visible: false });

    return actionMenu;
}
