import html from "./ActionTimer.html?raw";
import "./ActionTimer.css";

export async function createActionTimer() {
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    return template.content.querySelector("#action-timer-preview");
}
