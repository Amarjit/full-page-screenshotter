const MOTION_STYLE_ID = "__fullscreen_shotter_pause_motion__";

function pauseCaptureMotion() {
    if (document.getElementById(MOTION_STYLE_ID)) {
        return {
            styleElement: null
        };
    }
    const styleElement = document.createElement("style");
    styleElement.id = MOTION_STYLE_ID;
    styleElement.textContent = [ "*, *::before, *::after {", "  animation-duration: 0s !important;", "  animation-delay: 0s !important;", "  animation-iteration-count: 1 !important;", "  transition-duration: 0s !important;", "  transition-delay: 0s !important;", "  scroll-behavior: auto !important;", "}" ].join("\n");
    (document.head || document.documentElement).appendChild(styleElement);
    return {
        styleElement: styleElement
    };
}

function restoreCaptureMotion(state) {
    if (!state || !state.styleElement || !state.styleElement.parentNode) {
        return;
    }
    state.styleElement.parentNode.removeChild(state.styleElement);
}

if (typeof window !== "undefined") {
    window.captureMotionManager = {
        pauseCaptureMotion: pauseCaptureMotion,
        restoreCaptureMotion: restoreCaptureMotion
    };
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        pauseCaptureMotion: pauseCaptureMotion,
        restoreCaptureMotion: restoreCaptureMotion,
        MOTION_STYLE_ID: MOTION_STYLE_ID
    };
}