function disableCaptureBackgrounds() {
    const changed = [];
    const elements = [ document.documentElement, document.body ].concat(Array.from(document.querySelectorAll("*")));
    for (const element of elements) {
        if (!element || !element.style) {
            continue;
        }
        const style = window.getComputedStyle(element);
        const hasBackgroundImage = style.backgroundImage && style.backgroundImage !== "none";
        const hasBackgroundColor = style.backgroundColor && style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent";
        if (!hasBackgroundImage && !hasBackgroundColor) {
            continue;
        }
        changed.push({
            element: element,
            background: element.style.background,
            backgroundImage: element.style.backgroundImage,
            backgroundColor: element.style.backgroundColor
        });
        element.style.background = "transparent";
        element.style.backgroundImage = "none";
        element.style.backgroundColor = "transparent";
    }
    return changed;
}

function restoreCaptureBackgrounds(changed) {
    if (!Array.isArray(changed)) {
        return;
    }
    for (const entry of changed) {
        if (!entry || !entry.element || !entry.element.style) {
            continue;
        }
        entry.element.style.background = entry.background;
        entry.element.style.backgroundImage = entry.backgroundImage;
        entry.element.style.backgroundColor = entry.backgroundColor;
    }
}

if (typeof window !== "undefined") {
    window.captureBackgroundManager = {
        disableCaptureBackgrounds: disableCaptureBackgrounds,
        restoreCaptureBackgrounds: restoreCaptureBackgrounds
    };
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        disableCaptureBackgrounds: disableCaptureBackgrounds,
        restoreCaptureBackgrounds: restoreCaptureBackgrounds
    };
}