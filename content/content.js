let captureState = null;

function getScrollStrategies() {
    if (!window.scrollCaptureStrategies) {
        throw new Error("Scroll capture strategies are not available");
    }
    return window.scrollCaptureStrategies;
}

function getOverlayManager() {
    if (!window.captureOverlayManager) {
        throw new Error("Capture overlay manager is not available");
    }
    return window.captureOverlayManager;
}

function getBackgroundManager() {
    if (!window.captureBackgroundManager) {
        throw new Error("Capture background manager is not available");
    }
    return window.captureBackgroundManager;
}

function getMotionManager() {
    if (!window.captureMotionManager) {
        throw new Error("Capture motion manager is not available");
    }
    return window.captureMotionManager;
}

function getPageDimensions() {
    return getScrollStrategies().getDimensionsForState(captureState && captureState.scroll);
}

function calculateCaptureRect() {
    const dimensions = getPageDimensions();
    return {
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.height
    };
}

function canCaptureSingleRect() {
    const dimensions = getPageDimensions();
    const maxSafeDimension = 3e4;
    return dimensions.width <= maxSafeDimension && dimensions.height <= maxSafeDimension && !dimensions.exceedsLimits;
}

async function getPageDimensionsForCapture() {
    try {
        if (document.readyState !== "complete") {
            await new Promise(resolve => {
                if (document.readyState === "complete") {
                    resolve();
                } else {
                    window.addEventListener("load", resolve, {
                        once: true
                    });
                }
            });
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        const dimensions = getPageDimensions();
        const rect = calculateCaptureRect();
        const singleCapturePossible = canCaptureSingleRect();
        return {
            success: true,
            dimensions: dimensions,
            rect: rect,
            singleCapturePossible: singleCapturePossible,
            error: null
        };
    } catch (error) {
        console.error("Failed to get page dimensions:", error);
        return {
            success: false,
            dimensions: null,
            rect: null,
            singleCapturePossible: false,
            error: error.message
        };
    }
}

function prepareDynamicCapture(options = {}) {
    restoreDynamicCapture();
    captureState = {
        scroll: getScrollStrategies().createScrollCaptureState({
            startFromTop: options.startFromTop !== false
        }),
        hiddenOverlays: [],
        disabledBackgrounds: [],
        pausedMotion: null
    };
    if (options.disableBackgrounds === true) {
        captureState.disabledBackgrounds = getBackgroundManager().disableCaptureBackgrounds();
    }
    if (options.pauseAnimations !== false) {
        captureState.pausedMotion = getMotionManager().pauseCaptureMotion();
    }
    const dimensions = getScrollStrategies().getDimensionsForState(captureState.scroll);
    return {
        success: true,
        scrollX: captureState.scroll.scrollX,
        scrollY: captureState.scroll.scrollY,
        dimensions: dimensions,
        cropRect: dimensions.cropRect,
        scrollTargetType: dimensions.scrollTargetType,
        captureStartX: captureState.scroll.captureStartX || 0,
        captureStartY: captureState.scroll.captureStartY || 0
    };
}

function hideCaptureOverlays() {
    if (!captureState) {
        prepareDynamicCapture();
    }
    const dimensions = getScrollStrategies().getDimensionsForState(captureState.scroll);
    captureState.hiddenOverlays = getOverlayManager().hideCaptureOverlays({
        cropRect: dimensions.cropRect,
        scrollTarget: captureState.scroll.scrollTarget,
        hidden: captureState.hiddenOverlays
    });
    const refreshedDimensions = getScrollStrategies().getDimensionsForState(captureState.scroll);
    return {
        success: true,
        hiddenCount: captureState.hiddenOverlays.length,
        dimensions: refreshedDimensions,
        cropRect: refreshedDimensions.cropRect,
        scrollTargetType: refreshedDimensions.scrollTargetType
    };
}

function restoreDynamicCapture() {
    if (!captureState) {
        return {
            success: true
        };
    }
    getOverlayManager().restoreCaptureOverlays(captureState.hiddenOverlays);
    getBackgroundManager().restoreCaptureBackgrounds(captureState.disabledBackgrounds);
    getMotionManager().restoreCaptureMotion(captureState.pausedMotion);
    getScrollStrategies().restoreScrollState(captureState.scroll);
    captureState = null;
    return {
        success: true
    };
}

async function scrollToCapturePosition(x, y, waitMs) {
    if (!captureState) {
        prepareDynamicCapture();
    }
    const scrollResult = getScrollStrategies().scrollCaptureTargetTo(captureState.scroll, x, y);
    await waitForScrollSettle(waitMs || 350);
    const dimensions = getScrollStrategies().getDimensionsForState(captureState.scroll);
    return {
        success: true,
        scrollX: scrollResult.scrollX,
        scrollY: scrollResult.scrollY,
        dimensions: dimensions,
        cropRect: dimensions.cropRect,
        scrollTargetType: dimensions.scrollTargetType
    };
}

function waitForScrollSettle(waitMs) {
    return new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setTimeout(resolve, waitMs);
            });
        });
    });
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getPageDimensions") {
        getPageDimensionsForCapture().then(sendResponse);
        return true;
    }
    if (request.action === "prepareDynamicCapture") {
        sendResponse(prepareDynamicCapture(request.options || {}));
        return false;
    }
    if (request.action === "hideCaptureOverlays") {
        sendResponse(hideCaptureOverlays());
        return false;
    }
    if (request.action === "restoreDynamicCapture") {
        sendResponse(restoreDynamicCapture());
        return false;
    }
    if (request.action === "scrollToCapturePosition") {
        scrollToCapturePosition(request.x || 0, request.y || 0, request.waitMs).then(sendResponse);
        return true;
    }
    return false;
});

setTimeout(() => {
    browser.runtime.sendMessage({
        action: "ping"
    }).then(() => {}).catch(error => {
        console.error("Content script: Background script not responding:", error);
    });
}, 1e3);