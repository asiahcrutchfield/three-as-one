import html from "./EnemyHUD.html?raw";

export async function createEnemyHUD() {
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    return template.content.querySelector("#enemy-hud");
}