import html from "./ActionTimer.html?raw";
import "./ActionTimer.css";

export async function createActionTimer() {
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    const timer = template.content.querySelector("#action-timer-preview");
    const goodWindow = timer.querySelector(".action-timer-preview-window");
    const perfectWindow = timer.querySelector(".action-timer-preview-perfect");
    const fill = timer.querySelector(".action-timer-preview-fill");
    const cursor = timer.querySelector(".action-timer-preview-cursor");
    const key = timer.querySelector(".action-timer-preview-key");
    const value = timer.querySelector(".action-timer-preview-value");

    timer.setState = ({
        durationMs = 0,
        remainingMs = 0,
        visible = false,
        armed = false,
        label,
        keyLabel = "",
        windowStart = null,
        windowEnd = null,
        perfectStart = null,
        perfectEnd = null
    } = {}) => {
        const pct = durationMs > 0 ? Math.max(0, Math.min(100, (remainingMs / durationMs) * 100)) : 0;
        timer.classList.toggle("hidden", !visible);
        timer.classList.toggle("is-armed", armed);
        if (fill) fill.style.height = `${pct}%`;
        if (cursor) timer.style.setProperty("--cursor-position", `${pct}%`);
        if (key) key.textContent = keyLabel;
        if (value) value.textContent = label ?? `${Math.max(0, remainingMs / 1000).toFixed(1)}`;
        if (goodWindow) {
            const start = windowStart ?? 0;
            const end = windowEnd ?? 0;
            goodWindow.style.display = windowStart === null || windowEnd === null ? "none" : "block";
            timer.style.setProperty("--window-start", `${Math.max(0, start) * 100}%`);
            timer.style.setProperty("--window-size", `${Math.max(0, end - start) * 100}%`);
        }
        if (perfectWindow) {
            const start = perfectStart ?? 0;
            const end = perfectEnd ?? 0;
            perfectWindow.style.display = perfectStart === null || perfectEnd === null ? "none" : "block";
            timer.style.setProperty("--perfect-start", `${Math.max(0, start) * 100}%`);
            timer.style.setProperty("--perfect-size", `${Math.max(0, end - start) * 100}%`);
        }
    };

    timer.pulseWrong = () => {
        timer.classList.remove("is-wrong");
        void timer.offsetWidth;
        timer.classList.add("is-wrong");
        window.setTimeout(() => timer.classList.remove("is-wrong"), 140);
    };

    timer.setState({ visible: false });
    return timer;
}
