try {
    async function captureWithRect(rect, tabId = null) {
        try {
            const options = {
                format: "png",
                quality: 100,
                rect: rect,
                scale: window.devicePixelRatio || 1
            };
            let dataUrl;
            if (tabId) {
                dataUrl = await browser.tabs.captureTab(tabId, options);
            } else {
                dataUrl = await browser.tabs.captureVisibleTab(null, options);
            }
            return dataUrl;
        } catch (error) {
            console.error("Failed to capture with rect:", error);
            throw error;
        }
    }
    async function captureViewport(tabId = null) {
        const options = {
            format: "png",
            quality: 100
        };
        return browser.tabs.captureVisibleTab(null, options);
    }
    async function captureByScrollAndStitch(dimensions, options = {}) {
        const tabId = options.tabId;
        const maxScrolls = Math.max(1, parseInt(options.maxScrolls || 25, 10));
        const parsedWaitMs = parseInt(options.waitMs == null ? 450 : options.waitMs, 10);
        const waitMs = Number.isFinite(parsedWaitMs) ? Math.max(0, parsedWaitMs) : 450;
        const parsedGapPx = parseInt(options.gapPx == null ? 0 : options.gapPx, 10);
        const gapPx = Number.isFinite(parsedGapPx) ? Math.min(200, Math.max(-200, parsedGapPx)) : 0;
        const startFromTop = options.startFromTop !== false;
        const hideOverlays = options.hideOverlays !== false;
        const disableBackgrounds = options.disableBackgrounds === true;
        const pauseAnimations = options.pauseAnimations !== false;
        const warnings = [];
        const chunks = [];
        let latestDimensions = dimensions;
        let captureStartX = 0;
        let captureStartY = 0;
        let cancelled = false;
        if (!tabId) {
            throw new Error("Dynamic capture requires an active tab ID");
        }
        try {
            const prepared = await browser.tabs.sendMessage(tabId, {
                action: "prepareDynamicCapture",
                options: {
                    startFromTop: startFromTop,
                    disableBackgrounds: disableBackgrounds,
                    pauseAnimations: pauseAnimations
                }
            });
            latestDimensions = prepared && prepared.dimensions ? prepared.dimensions : latestDimensions;
            captureStartX = prepared && prepared.captureStartX ? prepared.captureStartX : 0;
            captureStartY = prepared && prepared.captureStartY ? prepared.captureStartY : 0;
            if (hideOverlays) {
                const overlayResult = await browser.tabs.sendMessage(tabId, {
                    action: "hideCaptureOverlays"
                });
                if (overlayResult && isValidDimensions(overlayResult.dimensions)) {
                    latestDimensions = overlayResult.dimensions;
                }
            }
            let rowIndex = 0;
            let reachedBottom = false;
            let reachedMaxScrolls = false;
            while (!reachedBottom && rowIndex < maxScrolls) {
                throwIfCancelled(options);
                const grid = window.calculateViewportGrid(latestDimensions, latestDimensions.viewportWidth, latestDimensions.viewportHeight, maxScrolls, gapPx, captureStartX, captureStartY);
                const yPositions = grid.yPositions;
                const y = yPositions[Math.min(rowIndex, yPositions.length - 1)];
                if (rowIndex >= yPositions.length) {
                    reachedBottom = true;
                    break;
                }
                for (const x of grid.xPositions) {
                    throwIfCancelled(options);
                    const scrollInfo = await browser.tabs.sendMessage(tabId, {
                        action: "scrollToCapturePosition",
                        x: x,
                        y: y,
                        waitMs: waitMs
                    });
                    latestDimensions = scrollInfo.dimensions || latestDimensions;
                    if (hideOverlays) {
                        const overlayResult = await browser.tabs.sendMessage(tabId, {
                            action: "hideCaptureOverlays"
                        });
                        if (overlayResult && isValidDimensions(overlayResult.dimensions)) {
                            latestDimensions = overlayResult.dimensions;
                        }
                    }
                    const dataUrl = await captureViewport(tabId);
                    const cropRect = latestDimensions.cropRect || scrollInfo.cropRect || {
                        x: 0,
                        y: 0,
                        width: latestDimensions.viewportWidth,
                        height: latestDimensions.viewportHeight
                    };
                    const actualX = Math.max(0, scrollInfo.scrollX || 0);
                    const actualY = Math.max(0, scrollInfo.scrollY || 0);
                    const outputX = Math.max(0, actualX - captureStartX);
                    const outputY = Math.max(0, actualY - captureStartY);
                    const width = Math.max(1, Math.min(cropRect.width, latestDimensions.width - actualX));
                    const height = Math.max(1, Math.min(cropRect.height, latestDimensions.height - actualY));
                    chunks.push({
                        dataUrl: dataUrl,
                        x: outputX,
                        y: outputY,
                        width: width,
                        height: height,
                        cropX: cropRect.x || 0,
                        cropY: cropRect.y || 0,
                        cropWidth: width,
                        cropHeight: height,
                        viewportWidth: latestDimensions.viewportWidth,
                        viewportHeight: latestDimensions.viewportHeight,
                        dpr: latestDimensions.devicePixelRatio || window.devicePixelRatio || 1
                    });
                    if (typeof options.onProgress === "function") {
                        options.onProgress({
                            chunks: chunks.length,
                            row: rowIndex + 1,
                            maxRows: maxScrolls
                        });
                    }
                }
                const maxOffset = Math.max(0, latestDimensions.height - latestDimensions.viewportHeight);
                reachedBottom = y >= maxOffset;
                rowIndex += 1;
                reachedMaxScrolls = !reachedBottom && rowIndex >= maxScrolls;
            }
            if (reachedMaxScrolls) {
                warnings.push(`Dynamic capture stopped after ${maxScrolls} vertical viewport captures. Increase Max dynamic scrolls to capture more.`);
            }
            if (chunks.length === 0) {
                throw new Error("No screenshot chunks were captured");
            }
            const totalWidth = Math.max(...chunks.map(chunk => chunk.x + chunk.width));
            const totalHeight = Math.max(...chunks.map(chunk => chunk.y + chunk.height));
            const dpr = 1;
            if (!window.isWithinImageLimits(Math.ceil(totalWidth * dpr), Math.ceil(totalHeight * dpr))) {
                throw new Error(`Captured image (${Math.ceil(totalWidth * dpr)}x${Math.ceil(totalHeight * dpr)}) exceeds safe browser canvas limits`);
            }
            const dataUrl = await window.stitchImageChunks(chunks, totalWidth, totalHeight, dpr);
            return {
                dataUrl: dataUrl,
                warnings: warnings,
                chunks: chunks.length,
                cancelled: cancelled
            };
        } catch (error) {
            if (isCancellationError(error)) {
                cancelled = true;
                warnings.push("Dynamic capture was cancelled. The partial screenshot captured so far is shown.");
                if (chunks.length > 0) {
                    const totalWidth = Math.max(...chunks.map(chunk => chunk.x + chunk.width));
                    const totalHeight = Math.max(...chunks.map(chunk => chunk.y + chunk.height));
                    const dpr = 1;
                    const dataUrl = await window.stitchImageChunks(chunks, totalWidth, totalHeight, dpr);
                    return {
                        dataUrl: dataUrl,
                        warnings: warnings,
                        chunks: chunks.length,
                        cancelled: cancelled
                    };
                }
            }
            console.error("Failed to capture by scrolling:", error);
            throw error;
        } finally {
            try {
                await browser.tabs.sendMessage(tabId, {
                    action: "restoreDynamicCapture"
                });
            } catch (restoreError) {
                console.error("Failed to restore page after dynamic capture:", restoreError);
            }
        }
    }
    function throwIfCancelled(options) {
        if (typeof options.shouldCancel === "function" && options.shouldCancel()) {
            throw new Error("CAPTURE_CANCELLED");
        }
    }
    function isCancellationError(error) {
        return error && error.message === "CAPTURE_CANCELLED";
    }
    function isValidDimensions(dimensions) {
        return !!(dimensions && dimensions.width > 0 && dimensions.height > 0 && dimensions.viewportWidth > 0 && dimensions.viewportHeight > 0);
    }
    async function captureFullPage(pageInfo, options = {}) {
        try {
            if (!pageInfo.success) {
                throw new Error(`Failed to get page dimensions: ${pageInfo.error}`);
            }
            if (options.mode !== "dynamic" && pageInfo.singleCapturePossible) {
                const dataUrl = await captureWithRect(pageInfo.rect);
                return {
                    dataUrl: dataUrl,
                    warnings: []
                };
            } else {
                return await captureByScrollAndStitch(pageInfo.dimensions, options);
            }
        } catch (error) {
            console.error("Full page capture failed:", error);
            throw error;
        }
    }
    if (typeof window !== "undefined") {
        window.captureWithRect = captureWithRect;
        window.captureViewport = captureViewport;
        window.captureByScrollAndStitch = captureByScrollAndStitch;
        window.captureFullPage = captureFullPage;
    }
    if (typeof module !== "undefined" && module.exports) {
        module.exports = {
            captureWithRect: captureWithRect,
            captureViewport: captureViewport,
            captureByScrollAndStitch: captureByScrollAndStitch,
            captureFullPage: captureFullPage,
            isValidDimensions: isValidDimensions
        };
    }
} catch (error) {
    console.error("Capture script failed to load:", error);
}