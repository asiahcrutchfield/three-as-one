import html from "./SubMenu.html?raw";

export async function createSubMenu() {
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    return template.content.querySelector("#action-sub");
}
