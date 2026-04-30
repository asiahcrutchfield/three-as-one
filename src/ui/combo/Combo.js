import html from "./Combo.html?raw";
import "./Combo.css";

export async function createComboMeter() {
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    return template.content.querySelector("#combo-preview");
}
