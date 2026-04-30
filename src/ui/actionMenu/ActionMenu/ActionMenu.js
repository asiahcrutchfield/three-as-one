import html from "./ActionMenu.html?raw";
import { createSubMenu } from "/src/ui/actionMenu/SubMenu/SubMenu.js";
import { createTimer } from "/src/ui/actionMenu/Timer/Timer.js";

const actionData = {
    attack: [
        { label: "Heavy Swing", title: "Heavy Swing", type: "Close", cost: "1/Battle", damage: "18", desc: "Big damage, slower timed strike. Best when momentum is high." },
        { label: "Quick Jab", title: "Quick Jab", type: "Close", damage: "8", desc: "Fast, reliable hit. Lower damage but easier to commit under pressure." },
        { label: "Gun Shot", title: "Gun Shot", type: "Long", cost: "1 Combo", damage: "10", desc: "Safe ranged attack. Weaker than close attacks, but avoids counter risk." }
    ],
    defend: [
        { label: "Block", title: "Block", type: "Defense", desc: "Safest defense. Reduces damage, but gives the weakest momentum gain." },
        { label: "Dodge", title: "Dodge", type: "Defense", desc: "Avoids all damage if timed correctly. Harder against close-range pressure." },
        { label: "Counter", title: "Counter", type: "Defense", damage: "Var", desc: "Highest reward defensive option. Only works against close-range attacks." }
    ],
    assist: [
        { label: "Tactical Focus", title: "Tactical Focus", type: "Assist", cost: "CD 1T", desc: "Slows the decision clock for a turn and helps stabilize dangerous situations." },
        { label: "Rush Cover", title: "Rush Cover", type: "Assist", cost: "1 Combo", desc: "Creates a safe opening, but gives up some offensive tempo." },
        { label: "Tiger Support", title: "Tiger Support", type: "Assist", cost: "CD 1T", desc: "Stabilizes the Girl/Tiger lane and helps recover from pressure." }
    ],
    switch: [
        { label: "Officer", title: "Switch: Officer", type: "Switch", desc: "Safer, more stable defense profile. Better for surviving pressure." },
        { label: "Man", title: "Switch: Man", type: "Switch", desc: "Explosive counter damage, but the riskiest timing windows." },
        { label: "Girl", title: "Switch: Girl", type: "Switch", desc: "Adaptive offense and support, strongly affected by Tiger state." }
    ]
};

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
    let hoverTimer = null;
    let tooltipHideTimer = null;
    let activeMenuKey = null;

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
                title: item.dataset.title || "",
                desc: item.dataset.desc || "",
                type: item.dataset.type || "",
                cost: item.dataset.cost || "",
                damage: item.dataset.damage || ""
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
        });
    }

    function renderSubmenu(menuKey) {
        const items = actionData[menuKey] || [];
        activeMenuKey = menuKey;
        subMenu.innerHTML = items.map((item, index) => `
            <li class="action-sub-item${index === 0 ? " is-active" : ""}" data-title="${item.title}" data-desc="${item.desc}" data-type="${item.type || ""}" data-cost="${item.cost || ""}" data-damage="${item.damage || ""}">
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
            window.clearTimeout(hoverTimer);
            hoverTimer = window.setTimeout(() => {
                if (activeMenuKey === item.dataset.action) return;
                mainItems.forEach((main) => main.classList.toggle("is-active", main === item));
                renderSubmenu(item.dataset.action);
            }, 70);
        });
    });

    actionMenu.addEventListener("mouseenter", () => window.clearTimeout(tooltipHideTimer));
    actionMenu.addEventListener("mouseleave", () => queueTooltipHide());

    actionMenu.insertBefore(subMenu, actionMenu.querySelector("#action-main"));
    actionMenu.append(timer);
    clearPreview();

    return actionMenu;
}
