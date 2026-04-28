const DEFAULT_MAX_SCROLLS = 25;

const DEFAULT_WAIT_MS = 450;

const DEFAULT_WAIT_SECONDS = .5;

const DEFAULT_GAP_PX = 0;

document.addEventListener("DOMContentLoaded", initializePopup);

async function initializePopup() {
    const fastCaptureButton = document.getElementById("fastCapture");
    const dynamicCaptureButton = document.getElementById("dynamicCapture");
    const stopCaptureButton = document.getElementById("stopCapture");
    const maxScrollsInput = document.getElementById("maxScrolls");
    const waitSecondsInput = document.getElementById("waitSeconds");
    const gapPxInput = document.getElementById("gapPx");
    const startFromTopInput = document.getElementById("startFromTop");
    const hideOverlaysInput = document.getElementById("hideOverlays");
    const disableBackgroundsInput = document.getElementById("disableBackgrounds");
    const pauseAnimationsInput = document.getElementById("pauseAnimations");
    const optionsToggle = document.getElementById("dynamicOptionsToggle");
    const optionsPanel = document.getElementById("dynamicOptions");
    fastCaptureButton.addEventListener("click", () => startCapture("fast"));
    dynamicCaptureButton.addEventListener("click", () => startCapture("dynamic"));
    stopCaptureButton.addEventListener("click", stopCapture);
    optionsToggle.addEventListener("click", () => {
        const expanded = optionsPanel.hidden;
        optionsPanel.hidden = !expanded;
        optionsToggle.setAttribute("aria-expanded", String(expanded));
    });
    try {
        const stored = await browser.storage.local.get([ "dynamicMaxScrolls", "dynamicWaitMs", "dynamicGapPx", "dynamicStartFromTop", "dynamicHideOverlays", "dynamicDisableBackgrounds", "dynamicPauseAnimations" ]);
        maxScrollsInput.value = normalizeMaxScrolls(stored.dynamicMaxScrolls || DEFAULT_MAX_SCROLLS);
        waitSecondsInput.value = formatWaitSeconds(stored.dynamicWaitMs == null ? DEFAULT_WAIT_MS : stored.dynamicWaitMs);
        gapPxInput.value = normalizeGapPx(stored.dynamicGapPx == null ? DEFAULT_GAP_PX : stored.dynamicGapPx);
        startFromTopInput.checked = stored.dynamicStartFromTop !== false;
        hideOverlaysInput.checked = stored.dynamicHideOverlays !== false;
        disableBackgroundsInput.checked = stored.dynamicDisableBackgrounds === true;
        pauseAnimationsInput.checked = stored.dynamicPauseAnimations !== false;
    } catch (error) {
        setStatus(`Failed to load setting: ${error.message}`);
    }
    await refreshStatus();
}

async function startCapture(mode) {
    const maxScrollsInput = document.getElementById("maxScrolls");
    const waitSecondsInput = document.getElementById("waitSeconds");
    const gapPxInput = document.getElementById("gapPx");
    const maxScrolls = normalizeMaxScrolls(maxScrollsInput.value);
    const waitSeconds = normalizeWaitSeconds(waitSecondsInput.value);
    const waitMs = waitSecondsToMs(waitSeconds);
    const gapPx = normalizeGapPx(gapPxInput.value);
    const startFromTop = document.getElementById("startFromTop").checked;
    const hideOverlays = document.getElementById("hideOverlays").checked;
    const disableBackgrounds = document.getElementById("disableBackgrounds").checked;
    const pauseAnimations = document.getElementById("pauseAnimations").checked;
    maxScrollsInput.value = maxScrolls;
    waitSecondsInput.value = waitSeconds;
    gapPxInput.value = gapPx;
    setBusy(true);
    setStatus(mode === "dynamic" ? "Starting dynamic capture..." : "Starting fast capture...");
    try {
        await browser.storage.local.set({
            dynamicMaxScrolls: maxScrolls,
            dynamicWaitMs: waitMs,
            dynamicGapPx: gapPx,
            dynamicStartFromTop: startFromTop,
            dynamicHideOverlays: hideOverlays,
            dynamicDisableBackgrounds: disableBackgrounds,
            dynamicPauseAnimations: pauseAnimations
        });
        const response = await browser.runtime.sendMessage({
            action: "startCapture",
            mode: mode,
            maxScrolls: maxScrolls,
            waitMs: waitMs,
            gapPx: gapPx,
            startFromTop: startFromTop,
            hideOverlays: hideOverlays,
            disableBackgrounds: disableBackgrounds,
            pauseAnimations: pauseAnimations
        });
        if (!response || !response.success) {
            throw new Error(response && response.error ? response.error : "Capture failed");
        }
        setStatus("Capture started. This popup can be reopened to stop dynamic capture.");
        window.close();
    } catch (error) {
        setStatus(error.message);
        setBusy(false);
    }
}

async function stopCapture() {
    setStatus("Stopping capture...");
    try {
        await browser.runtime.sendMessage({
            action: "cancelCapture"
        });
        await refreshStatus();
    } catch (error) {
        setStatus(`Failed to stop: ${error.message}`);
    }
}

async function refreshStatus() {
    try {
        const response = await browser.runtime.sendMessage({
            action: "getCaptureStatus"
        });
        const active = !!(response && response.active);
        setBusy(active);
        setStatus(active ? `Capturing ${response.mode}... ${response.progress || ""}`.trim() : "Ready");
    } catch (error) {
        setStatus("Ready");
    }
}

function setBusy(active) {
    document.getElementById("fastCapture").disabled = active;
    document.getElementById("dynamicCapture").disabled = active;
    document.getElementById("stopCapture").hidden = !active;
}

function setStatus(message) {
    document.getElementById("status").textContent = message;
}

function normalizeMaxScrolls(value) {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
        return DEFAULT_MAX_SCROLLS;
    }
    return Math.min(200, Math.max(1, parsed));
}

function normalizeWaitSeconds(value) {
    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed)) {
        return DEFAULT_WAIT_SECONDS;
    }
    return Math.min(5, Math.max(0, parsed));
}

function waitSecondsToMs(value) {
    return Math.round(normalizeWaitSeconds(value) * 1e3);
}

function formatWaitSeconds(waitMs) {
    const parsed = parseInt(waitMs, 10);
    const ms = Number.isFinite(parsed) ? Math.min(5e3, Math.max(0, parsed)) : DEFAULT_WAIT_MS;
    const seconds = ms / 1e3;
    return Number.isInteger(seconds) ? String(seconds) : String(parseFloat(seconds.toFixed(2)));
}

function normalizeGapPx(value) {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
        return DEFAULT_GAP_PX;
    }
    return Math.min(200, Math.max(-200, parsed));
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        normalizeMaxScrolls: normalizeMaxScrolls,
        normalizeWaitSeconds: normalizeWaitSeconds,
        waitSecondsToMs: waitSecondsToMs,
        formatWaitSeconds: formatWaitSeconds,
        normalizeGapPx: normalizeGapPx
    };
}