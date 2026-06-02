(function() {
    function debugLog(event, details) {
        if (typeof ScreenshotDiagnostics !== "undefined") {
            ScreenshotDiagnostics.log(event, details);
        }
    }
    function debugError(event, error, details) {
        if (typeof ScreenshotDiagnostics !== "undefined") {
            ScreenshotDiagnostics.error(event, error, details);
        }
    }
    let screenshotDataUrl = "";
    let statusTimeout = null;
    document.addEventListener("DOMContentLoaded", initializeResultPage);
    async function initializeResultPage() {
        debugLog("result page initialize start", {});
        const resultId = new URLSearchParams(window.location.search).get("id");
        if (!resultId) {
            showError("Could not load screenshot data. Try taking the screenshot again.");
            return;
        }
        try {
            const response = await browser.runtime.sendMessage({
                action: "getScreenshotResult",
                resultId: resultId
            });
            if (!response || !response.success || !response.result) {
                throw new Error(response && response.error ? response.error : "Screenshot data is no longer available");
            }
            debugLog("result data loaded", {
                hasWarning: !!response.result.warning,
                filename: response.result.filename,
                autoActions: response.result.autoActions
            });
            renderResult(response.result);
            document.getElementById("copyScreenshot").addEventListener("click", copyScreenshot);
            document.getElementById("closeTab").addEventListener("click", closeTab);
            await runAutomaticActions(response.result.autoActions);
        } catch (error) {
            debugError("result page initialize failed", error);
            showError(error.message || "Could not load screenshot data. Try taking the screenshot again.");
        }
    }
    function renderResult(result) {
        debugLog("result render", {
            filename: result.filename,
            hasWarning: !!result.warning
        });
        screenshotDataUrl = result.imageDataUrl;
        const downloadLink = document.getElementById("downloadScreenshot");
        downloadLink.href = screenshotDataUrl;
        downloadLink.download = result.filename || "screenshotter.png";
        document.getElementById("screenshotImage").src = screenshotDataUrl;
        document.getElementById("openedAt").textContent = result.openedAt || (new Date).toLocaleString();
        if (result.warning) {
            document.getElementById("warningText").textContent = result.warning;
            document.getElementById("warning").hidden = false;
        }
        document.getElementById("result").hidden = false;
    }
    async function runAutomaticActions(autoActions) {
        debugLog("automatic result actions start", {
            autoActions: autoActions
        });
        const actions = normalizeAutoActions(autoActions);
        if (!actions.download && !actions.copy) {
            debugLog("automatic result actions skipped", {
                actions: actions
            });
            return;
        }
        const failures = [];
        if (actions.download) {
            try {
                downloadScreenshot();
                debugLog("automatic download triggered", {});
                showStatus("Screenshot downloaded.", false, 5e3);
            } catch (error) {
                failures.push(error);
                debugError("automatic download failed", error);
                showStatus("Could not download the screenshot.", true, 5e3);
            }
        }
        if (actions.copy) {
            try {
                await copyScreenshot({
                    keepButtonEnabled: true,
                    automatic: true
                });
                debugLog("automatic copy completed", {});
            } catch (error) {
                failures.push(error);
                debugError("automatic copy failed", error);
            }
        }
        if (actions.closeWhenDone && failures.length === 0) {
            debugLog("automatic actions closing result tab", {});
            await delay(750);
            await closeTab();
        }
    }
    function normalizeAutoActions(autoActions) {
        return {
            download: !!(autoActions && autoActions.download),
            copy: !!(autoActions && autoActions.copy),
            closeWhenDone: !!(autoActions && autoActions.closeWhenDone)
        };
    }
    function downloadScreenshot() {
        debugLog("download link click", {});
        document.getElementById("downloadScreenshot").click();
    }
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async function copyScreenshot(options = {}) {
        debugLog("copy start", {
            automatic: options.automatic === true
        });
        const copyButton = document.getElementById("copyScreenshot");
        if (!options.keepButtonEnabled) {
            copyButton.disabled = true;
        }
        showStatus("Copying screenshot...", false, 0);
        try {
            const buffer = await dataUrlToArrayBuffer(screenshotDataUrl);
            await browser.clipboard.setImageData(buffer, "png");
            debugLog("copy success", {
                automatic: options.automatic === true
            });
            showStatus("Screenshot copied to clipboard.", false, 5e3);
        } catch (error) {
            debugError("copy failed", error, {
                automatic: options.automatic === true
            });
            showStatus("Could not copy the screenshot. Try downloading it instead.", true, 5e3);
            throw error;
        } finally {
            if (!options.keepButtonEnabled) {
                copyButton.disabled = false;
            }
        }
    }
    async function closeTab() {
        debugLog("close tab start", {});
        showStatus("Closing tab...", false, 0);
        try {
            const response = await browser.runtime.sendMessage({
                action: "closeResultTab"
            });
            if (response && response.success) {
                debugLog("close tab via background success", {});
                return;
            }
        } catch (error) {
            debugError("close tab via background failed", error);
        }
        debugLog("close tab window fallback", {});
        window.close();
        setTimeout(() => {
            showStatus("If this tab did not close, use Ctrl+W or Cmd+W.", true, 5e3);
        }, 300);
    }
    async function dataUrlToArrayBuffer(dataUrl) {
        const response = await fetch(dataUrl);
        return response.arrayBuffer();
    }
    function showStatus(message, isError, timeoutMs) {
        const status = document.getElementById("actionStatus");
        clearTimeout(statusTimeout);
        status.textContent = message;
        status.classList.toggle("error", !!isError);
        if (timeoutMs > 0) {
            statusTimeout = setTimeout(() => {
                status.textContent = "";
                status.classList.remove("error");
            }, timeoutMs);
        }
    }
    function showError(message) {
        document.getElementById("errorMessage").textContent = message;
        document.getElementById("errorPanel").hidden = false;
    }
    if (typeof module !== "undefined" && module.exports) {
        module.exports = {
            renderResult: renderResult,
            runAutomaticActions: runAutomaticActions,
            normalizeAutoActions: normalizeAutoActions,
            downloadScreenshot: downloadScreenshot,
            copyScreenshot: copyScreenshot,
            closeTab: closeTab,
            dataUrlToArrayBuffer: dataUrlToArrayBuffer,
            showStatus: showStatus,
            showError: showError
        };
    }
})();