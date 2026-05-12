const DEFAULT_MAX_SCROLLS = 25;

const DEFAULT_WAIT_MS = 450;

const DEFAULT_WAIT_SECONDS = .5;

const DEFAULT_GAP_PX = 0;

const SHORTCUT_SETTINGS_FALLBACK = "Open about:addons, click the gear icon, choose Manage Extension Shortcuts, then close the shortcut assignment window after setting shortcuts.";

document.addEventListener("DOMContentLoaded", initializeOptions);

async function initializeOptions() {
    const controls = getControls();
    bindAutoSave(controls);
    bindShortcutSettings(controls);
    try {
        const stored = await browser.storage.local.get([ "singleClickCaptureEnabled", "defaultCaptureMode", "dynamicMaxScrolls", "dynamicWaitMs", "dynamicGapPx", "dynamicStartFromTop", "dynamicHideOverlays", "dynamicDisableBackgrounds", "dynamicPauseAnimations" ]);
        controls.singleClickCaptureEnabled.checked = stored.singleClickCaptureEnabled === true;
        const defaultMode = normalizeDefaultCaptureMode(stored.defaultCaptureMode);
        controls.defaultModeStatic.checked = defaultMode === "static";
        controls.defaultModeDynamic.checked = defaultMode === "dynamic";
        controls.maxScrolls.value = normalizeMaxScrolls(stored.dynamicMaxScrolls || DEFAULT_MAX_SCROLLS);
        controls.waitSeconds.value = formatWaitSeconds(stored.dynamicWaitMs == null ? DEFAULT_WAIT_MS : stored.dynamicWaitMs);
        controls.gapPx.value = normalizeGapPx(stored.dynamicGapPx == null ? DEFAULT_GAP_PX : stored.dynamicGapPx);
        controls.startFromTop.checked = stored.dynamicStartFromTop !== false;
        controls.hideOverlays.checked = stored.dynamicHideOverlays !== false;
        controls.disableBackgrounds.checked = stored.dynamicDisableBackgrounds === true;
        controls.pauseAnimations.checked = stored.dynamicPauseAnimations !== false;
    } catch (error) {
        setStatus(`Failed to load options: ${error.message}`);
    }
    updateOptionState(controls);
}

function getControls() {
    return {
        singleClickCaptureEnabled: document.getElementById("singleClickCaptureEnabled"),
        singleClickControls: document.getElementById("singleClickControls"),
        dynamicSettingsPanel: document.getElementById("dynamicSettingsPanel"),
        defaultModeStatic: document.getElementById("defaultModeStatic"),
        defaultModeDynamic: document.getElementById("defaultModeDynamic"),
        maxScrolls: document.getElementById("maxScrolls"),
        waitSeconds: document.getElementById("waitSeconds"),
        gapPx: document.getElementById("gapPx"),
        startFromTop: document.getElementById("startFromTop"),
        hideOverlays: document.getElementById("hideOverlays"),
        disableBackgrounds: document.getElementById("disableBackgrounds"),
        pauseAnimations: document.getElementById("pauseAnimations"),
        shortcutSettingsButton: document.getElementById("shortcutSettingsButton")
    };
}

function bindAutoSave(controls) {
    for (const control of getManagedInputs(controls)) {
        control.addEventListener("change", () => saveOptions(controls));
    }
}

function bindShortcutSettings(controls) {
    if (!controls.shortcutSettingsButton) {
        return;
    }
    controls.shortcutSettingsButton.addEventListener("click", () => {
        openShortcutSettings().catch(error => {
            setStatus(`Failed to open shortcut settings: ${error.message}`);
        });
    });
}

function getManagedInputs(controls) {
    return [ controls.singleClickCaptureEnabled, controls.defaultModeStatic, controls.defaultModeDynamic, controls.maxScrolls, controls.waitSeconds, controls.gapPx, controls.startFromTop, controls.hideOverlays, controls.disableBackgrounds, controls.pauseAnimations ];
}

function updateOptionState(controls) {
    const singleClickEnabled = controls.singleClickCaptureEnabled.checked;
    const dynamicSelected = controls.defaultModeDynamic.checked;
    const showDynamicSettings = singleClickEnabled && dynamicSelected;
    controls.singleClickControls.classList.toggle("is-disabled", !singleClickEnabled);
    controls.dynamicSettingsPanel.hidden = !showDynamicSettings;
    controls.dynamicSettingsPanel.setAttribute("aria-hidden", String(!showDynamicSettings));
    const nestedControls = getManagedInputs(controls).filter(control => control !== controls.singleClickCaptureEnabled);
    for (const control of nestedControls) {
        control.disabled = !singleClickEnabled;
    }
}

async function saveOptions(controls) {
    const maxScrolls = normalizeMaxScrolls(controls.maxScrolls.value);
    const waitSeconds = normalizeWaitSeconds(controls.waitSeconds.value);
    const gapPx = normalizeGapPx(controls.gapPx.value);
    const defaultCaptureMode = controls.defaultModeDynamic.checked ? "dynamic" : "static";
    controls.maxScrolls.value = maxScrolls;
    controls.waitSeconds.value = waitSeconds;
    controls.gapPx.value = gapPx;
    updateOptionState(controls);
    try {
        await browser.storage.local.set({
            singleClickCaptureEnabled: controls.singleClickCaptureEnabled.checked,
            defaultCaptureMode: defaultCaptureMode,
            dynamicMaxScrolls: maxScrolls,
            dynamicWaitMs: waitSecondsToMs(waitSeconds),
            dynamicGapPx: gapPx,
            dynamicStartFromTop: controls.startFromTop.checked,
            dynamicHideOverlays: controls.hideOverlays.checked,
            dynamicDisableBackgrounds: controls.disableBackgrounds.checked,
            dynamicPauseAnimations: controls.pauseAnimations.checked
        });
        setStatus("Saved");
    } catch (error) {
        setStatus(`Failed to save options: ${error.message}`);
    }
}

function setStatus(message) {
    document.getElementById("status").textContent = message;
}

async function openShortcutSettings(statusWriter = setStatus) {
    try {
        const methodName = "openShortcut" + "Settings";
        const openSettings = browser.commands && browser.commands[methodName];
        if (typeof openSettings !== "function") {
            throw new Error("Shortcut settings are not available in this browser");
        }
        await openSettings();
        statusWriter("Shortcut settings opened. Close the shortcut assignment window after setting shortcuts.");
    } catch (error) {
        statusWriter(SHORTCUT_SETTINGS_FALLBACK);
    }
}

function normalizeDefaultCaptureMode(value) {
    return value === "dynamic" ? "dynamic" : "static";
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
        normalizeDefaultCaptureMode: normalizeDefaultCaptureMode,
        normalizeMaxScrolls: normalizeMaxScrolls,
        normalizeWaitSeconds: normalizeWaitSeconds,
        waitSecondsToMs: waitSecondsToMs,
        formatWaitSeconds: formatWaitSeconds,
        normalizeGapPx: normalizeGapPx,
        updateOptionState: updateOptionState,
        openShortcutSettings: openShortcutSettings,
        SHORTCUT_SETTINGS_FALLBACK: SHORTCUT_SETTINGS_FALLBACK
    };
}