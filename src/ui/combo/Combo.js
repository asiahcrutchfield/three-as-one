import html from "./Combo.html?raw";
import "./Combo.css";
import { t } from "/src/i18n.js";

export async function createComboMeter() {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    const combo = template.content.querySelector("#combo-preview");
    combo.querySelector(".combo-preview-label").textContent = t("ui.momentum");
    combo.querySelector(".combo-preview-max").textContent = t("ui.maxCombo");
    return combo;
}
