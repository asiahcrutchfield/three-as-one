import html from "./Assists.html?raw";
import "./Assists.css";

export async function createAssists() {
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    return template.content.querySelector("#assists-layer");
}
