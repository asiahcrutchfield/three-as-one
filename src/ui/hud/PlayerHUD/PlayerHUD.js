import html from "./PlayerHUD.html?raw";

export async function createPlayerHUD() {
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    return template.content.querySelector("#player-hud");
}