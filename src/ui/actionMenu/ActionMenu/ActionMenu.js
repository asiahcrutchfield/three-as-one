import html from "./ActionMenu.html?raw";
import { createSubMenu } from "/src/ui/actionMenu/SubMenu/SubMenu.js";
import { createTimer } from "/src/ui/actionMenu/Timer/Timer.js";

export async function createActionMenu() {
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    const actionMenu = template.content.querySelector("#action-menu");
    const subMenu = await createSubMenu();
    const timer = await createTimer();

    actionMenu.prepend(subMenu);
    actionMenu.append(timer);

    return actionMenu;
}
