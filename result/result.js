(function() {
    let screenshotDataUrl = "";
    let statusTimeout = null;
    document.addEventListener("DOMContentLoaded", initializeResultPage);
    async function initializeResultPage() {
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
            renderResult(response.result);
            document.getElementById("copyScreenshot").addEventListener("click", copyScreenshot);
            document.getElementById("closeTab").addEventListener("click", closeTab);
        } catch (error) {
            showError(error.message || "Could not load screenshot data. Try taking the screenshot again.");
        }
    }
    function renderResult(result) {
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
    async function copyScreenshot() {
        const copyButton = document.getElementById("copyScreenshot");
        copyButton.disabled = true;
        showStatus("Copying screenshot...", false, 0);
        try {
            const buffer = await dataUrlToArrayBuffer(screenshotDataUrl);
            await browser.clipboard.setImageData(buffer, "png");
            showStatus("Screenshot copied to clipboard.", false, 5e3);
        } catch (error) {
            showStatus("Could not copy the screenshot. Try downloading it instead.", true, 5e3);
        } finally {
            copyButton.disabled = false;
        }
    }
    async function closeTab() {
        showStatus("Closing tab...", false, 0);
        try {
            const response = await browser.runtime.sendMessage({
                action: "closeResultTab"
            });
            if (response && response.success) {
                return;
            }
        } catch (error) {}
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
})();