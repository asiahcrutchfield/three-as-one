import html from "./Timer.html?raw";

export async function createTimer() {
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    return template.content.querySelector("#timing-layer");
}
