try {
    let activeCapture = null;
    const screenshotResults = new Map;
    function escapeHtml(str) {
        if (str == null) return "";
        if (typeof str !== "string") str = String(str);
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
    function createScreenshotFilename(date = new Date) {
        const year = date.getFullYear();
        const month = padDatePart(date.getMonth() + 1);
        const day = padDatePart(date.getDate());
        const hours = padDatePart(date.getHours());
        const minutes = padDatePart(date.getMinutes());
        const seconds = padDatePart(date.getSeconds());
        return `screenshotter-${year}${month}${day}-${hours}${minutes}${seconds}.png`;
    }
    function padDatePart(value) {
        return String(value).padStart(2, "0");
    }
    async function getPageDimensions(tabId) {
        try {
            try {
                const existingResponse = await browser.tabs.sendMessage(tabId, {
                    action: "getPageDimensions"
                });
                return existingResponse;
            } catch (messageError) {}
            await browser.tabs.executeScript(tabId, {
                file: "/content/scroll-strategies.js"
            });
            await browser.tabs.executeScript(tabId, {
                file: "/content/overlay-manager.js"
            });
            await browser.tabs.executeScript(tabId, {
                file: "/content/background-manager.js"
            });
            await browser.tabs.executeScript(tabId, {
                file: "/content/motion-manager.js"
            });
            await browser.tabs.executeScript(tabId, {
                file: "/content/content.js"
            });
            const response = await browser.tabs.sendMessage(tabId, {
                action: "getPageDimensions"
            });
            return response;
        } catch (error) {
            console.error("Failed to get page dimensions:", error);
            throw error;
        }
    }
    async function displayScreenshot(imageDataUrl, warning = null) {
        try {
            const filename = createScreenshotFilename();
            const resultId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            screenshotResults.set(resultId, {
                imageDataUrl: imageDataUrl,
                warning: warning,
                filename: filename,
                openedAt: (new Date).toLocaleString()
            });
            setTimeout(() => {
                screenshotResults.delete(resultId);
            }, 5 * 60 * 1e3);
            const tab = await browser.tabs.create({
                url: browser.runtime.getURL(`result/result.html?id=${encodeURIComponent(resultId)}`),
                active: true
            });
            return tab;
        } catch (error) {
            console.error("Failed to display screenshot:", error);
            throw error;
        }
    }
    async function handleToolbarClick(options = {}) {
        const mode = options.mode || "fast";
        const maxScrolls = Math.max(1, parseInt(options.maxScrolls || 25, 10));
        const parsedWaitMs = parseInt(options.waitMs == null ? 450 : options.waitMs, 10);
        const waitMs = Number.isFinite(parsedWaitMs) ? Math.max(0, parsedWaitMs) : 450;
        const parsedGapPx = parseInt(options.gapPx == null ? 0 : options.gapPx, 10);
        const gapPx = Number.isFinite(parsedGapPx) ? Math.min(200, Math.max(-200, parsedGapPx)) : 0;
        try {
            const tabs = await browser.tabs.query({
                active: true,
                currentWindow: true
            });
            if (!tabs || tabs.length === 0) {
                throw new Error("No active tab found");
            }
            const currentTab = tabs[0];
            const pageInfo = await getPageDimensions(currentTab.id);
            const result = await captureFullPage(pageInfo, {
                mode: mode,
                tabId: currentTab.id,
                maxScrolls: maxScrolls,
                waitMs: waitMs,
                gapPx: gapPx,
                startFromTop: options.startFromTop !== false,
                hideOverlays: options.hideOverlays !== false,
                disableBackgrounds: options.disableBackgrounds === true,
                pauseAnimations: options.pauseAnimations !== false,
                shouldCancel: () => !!(activeCapture && activeCapture.cancelled),
                onProgress: progress => {
                    if (activeCapture) {
                        activeCapture.progress = `${progress.chunks} chunks`;
                    }
                }
            });
            const warnings = Array.isArray(result.warnings) ? result.warnings.slice() : [];
            if (mode !== "dynamic" && !pageInfo.singleCapturePossible) {
                const d = pageInfo.dimensions;
                const verticalOverflow = Math.max(0, d.scrollHeight - d.viewportHeight);
                const horizontalOverflow = Math.max(0, d.scrollWidth - d.viewportWidth);
                const overflowParts = [];
                if (verticalOverflow > 0) overflowParts.push(`${verticalOverflow.toLocaleString("en-US")}px vertical overflow`);
                if (horizontalOverflow > 0) overflowParts.push(`${horizontalOverflow.toLocaleString("en-US")}px horizontal overflow`);
                const overflowText = overflowParts.length > 0 ? ` [${overflowParts.join(", ")}]` : "";
                const limit = d.exceedsLimits ? 32767 : 3e4;
                const limitText = d.exceedsLimits ? `browser canvas limit (${limit.toLocaleString("en-US")}×${limit.toLocaleString("en-US")})` : `safe capture limit (${limit.toLocaleString("en-US")}×${limit.toLocaleString("en-US")})`;
                warnings.push(`Page dimensions (${d.width.toLocaleString("en-US")}×${d.height.toLocaleString("en-US")}) exceed ${limitText}. ` + `Scroll-and-stitch capture was used.${overflowText}`);
            }
            await displayScreenshot(result.dataUrl, warnings.length > 0 ? warnings.join(" ") : null);
        } catch (error) {
            console.error("Capture process failed:", error);
            try {
                const errorHtml = `\n        <!DOCTYPE html>\n        <html>\n        <head>\n          <title>Screenshot Help - Full Page Screenshot</title>\n          <style>\n            body {\n              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n              margin: 0;\n              padding: 32px;\n              color: #1f2933;\n              background: #f8f9fa;\n              line-height: 1.6;\n            }\n            .container {\n              max-width: 720px;\n              margin: 0 auto;\n              background: white;\n              padding: 32px;\n              border-radius: 12px;\n              box-shadow: 0 4px 20px rgba(0,0,0,0.08);\n            }\n            h1 {\n              margin: 0 0 10px;\n              color: #0f172a;\n              font-size: 26px;\n              line-height: 1.2;\n            }\n            h2 {\n              margin: 0 0 12px;\n              color: #243b53;\n              font-size: 17px;\n            }\n            p {\n              margin: 0 0 14px;\n            }\n            .intro {\n              color: #52606d;\n              font-size: 15px;\n            }\n            .help-section {\n              background: #eef6ff;\n              padding: 18px;\n              border-radius: 8px;\n              margin: 22px 0;\n              text-align: left;\n              border-left: 4px solid #3498db;\n            }\n            .steps {\n              margin: 0;\n              padding-left: 22px;\n            }\n            .steps li {\n              margin-bottom: 9px;\n            }\n            .technical-detail {\n              background: #f8fafc;\n              color: #52606d;\n              padding: 14px;\n              border-radius: 8px;\n              margin: 22px 0;\n              text-align: left;\n              border: 1px solid #e5e7eb;\n              font-size: 13px;\n            }\n            .technical-detail code {\n              display: block;\n              margin-top: 8px;\n              white-space: pre-wrap;\n              word-break: break-word;\n              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;\n            }\n            .close-help {\n              margin-top: 18px;\n              color: #52606d;\n              font-size: 14px;\n            }\n          </style>\n        </head>\n        <body>\n          <div class="container">\n            <h1>We couldn’t take the screenshot</h1>\n            <p class="intro">This can happen when Firefox or the website blocks screenshots, when the page is still loading, or when the page is very large.</p>\n\n            <div class="help-section">\n              <h2>Things to try</h2>\n              <ul class="steps">\n                <li>Refresh the page, wait a moment, then try again.</li>\n                <li>For long or complex pages, try Dynamic Scroll Capture.</li>\n                <li>Check that the extension has permission to run on this site.</li>\n                <li>If this is a private window, enable “Allow in Private Windows” for the extension.</li>\n                <li>Firefox may block protected pages such as <code>about:</code> pages by default. If Firefox offers an extension option for this, enable that permission before trying again.</li>\n              </ul>\n            </div>\n\n            <div class="technical-detail">\n              <strong>Technical detail</strong>\n              <code>${escapeHtml(error.message)}</code>\n            </div>\n\n            <p class="close-help">You can close this tab with <kbd>Ctrl</kbd> + <kbd>W</kbd> on Windows/Linux or <kbd>Cmd</kbd> + <kbd>W</kbd> on Mac.</p>\n          </div>\n        </body>\n        </html>\n      `;
                const blob = new Blob([ errorHtml ], {
                    type: "text/html;charset=utf-8"
                });
                const blobUrl = URL.createObjectURL(blob);
                await browser.tabs.create({
                    url: blobUrl,
                    active: true
                });
            } catch (displayError) {
                console.error("Failed to display error:", displayError);
            }
        }
    }
    function startCaptureFromMessage(message, sendResponse) {
        if (activeCapture && activeCapture.active) {
            sendResponse({
                success: false,
                error: "A capture is already running"
            });
            return false;
        }
        activeCapture = {
            active: true,
            cancelled: false,
            mode: message.mode || "fast",
            progress: ""
        };
        handleToolbarClick({
            mode: activeCapture.mode,
            maxScrolls: message.maxScrolls,
            waitMs: message.waitMs,
            gapPx: message.gapPx,
            startFromTop: message.startFromTop,
            hideOverlays: message.hideOverlays,
            disableBackgrounds: message.disableBackgrounds,
            pauseAnimations: message.pauseAnimations
        }).catch(error => {
            console.error("Capture process failed outside handler:", error);
        }).finally(() => {
            activeCapture = null;
        });
        sendResponse({
            success: true
        });
        return false;
    }
    function closeResultTab(sender, sendResponse) {
        if (!sender || !sender.tab || sender.tab.id == null) {
            sendResponse({
                success: false,
                error: "No result tab found"
            });
            return false;
        }
        browser.tabs.remove(sender.tab.id).then(() => {
            sendResponse({
                success: true
            });
        }).catch(error => {
            sendResponse({
                success: false,
                error: error.message
            });
        });
        return true;
    }
    function getScreenshotResult(message, sendResponse) {
        const resultId = message && message.resultId;
        const result = screenshotResults.get(resultId);
        if (!result) {
            sendResponse({
                success: false,
                error: "Screenshot data is no longer available"
            });
            return false;
        }
        screenshotResults.delete(resultId);
        sendResponse({
            success: true,
            result: result
        });
        return false;
    }
    async function initialize() {
        browser.browserAction.onClicked.addListener(() => {
            if (!activeCapture) {
                activeCapture = {
                    active: true,
                    cancelled: false,
                    mode: "fast",
                    progress: ""
                };
                handleToolbarClick({
                    mode: "fast"
                }).finally(() => {
                    activeCapture = null;
                });
            }
        });
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === "ping") {
                sendResponse({
                    status: "alive",
                    timestamp: (new Date).toISOString()
                });
            }
            if (message.action === "startCapture") {
                return startCaptureFromMessage(message, sendResponse);
            }
            if (message.action === "cancelCapture") {
                if (activeCapture) {
                    activeCapture.cancelled = true;
                }
                sendResponse({
                    success: true
                });
            }
            if (message.action === "getCaptureStatus") {
                sendResponse(activeCapture ? {
                    active: activeCapture.active,
                    mode: activeCapture.mode,
                    progress: activeCapture.progress
                } : {
                    active: false
                });
            }
            if (message.action === "closeResultTab") {
                return closeResultTab(sender, sendResponse);
            }
            if (message.action === "getScreenshotResult") {
                return getScreenshotResult(message, sendResponse);
            }
            return false;
        });
    }
    initialize().catch(error => {
        console.error("Failed to initialize extension:", error);
    });
} catch (error) {
    console.error("CRITICAL: Background script failed to load:", error);
    console.error("Error stack:", error.stack);
}