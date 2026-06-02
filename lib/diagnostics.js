(function(root) {
    const STORAGE_KEY = "debugModeEnabled";
    const LOG_PREFIX = "[Fullscreen Shotter debug]";
    let cachedEnabled = null;
    let cachePromise = null;
    function safeConsole(method, args) {
        try {
            const logger = console && console[method] ? console[method] : console.log;
            logger.call(console, LOG_PREFIX, ...args);
        } catch (error) {}
    }
    function sanitizeValue(value, depth = 0) {
        if (depth > 3) {
            return "[depth-limit]";
        }
        if (value == null || typeof value === "boolean" || typeof value === "number") {
            return value;
        }
        if (typeof value === "string") {
            if (value.startsWith("data:")) {
                return `[data-url:${value.length}]`;
            }
            return value.length > 300 ? `${value.slice(0, 300)}...` : value;
        }
        if (value instanceof Error) {
            return {
                name: value.name,
                message: value.message,
                stack: value.stack ? value.stack.split("\n").slice(0, 4).join("\n") : ""
            };
        }
        if (Array.isArray(value)) {
            return value.slice(0, 20).map(item => sanitizeValue(item, depth + 1));
        }
        if (typeof value === "object") {
            const output = {};
            for (const key of Object.keys(value).slice(0, 30)) {
                if (/dataUrl|imageData|imageDataUrl|screenshotDataUrl|buffer|arrayBuffer|bytes/i.test(key)) {
                    output[key] = "[redacted]";
                } else {
                    output[key] = sanitizeValue(value[key], depth + 1);
                }
            }
            return output;
        }
        return String(value);
    }
    async function readEnabled() {
        if (!root.browser || !browser.storage || !browser.storage.local) {
            return false;
        }
        const stored = await browser.storage.local.get(STORAGE_KEY);
        return stored[STORAGE_KEY] === true;
    }
    function isEnabled() {
        if (cachedEnabled !== null) {
            return Promise.resolve(cachedEnabled);
        }
        if (!cachePromise) {
            cachePromise = readEnabled().then(enabled => {
                cachedEnabled = enabled;
                return enabled;
            }).catch(error => {
                cachedEnabled = false;
                safeConsole("error", [ "Failed to read debug mode setting", sanitizeValue(error) ]);
                return false;
            }).finally(() => {
                cachePromise = null;
            });
        }
        return cachePromise;
    }
    function setEnabled(enabled) {
        cachedEnabled = enabled === true;
    }
    function invalidate() {
        cachedEnabled = null;
    }
    function log(event, details) {
        isEnabled().then(enabled => {
            if (enabled) {
                safeConsole("log", [ event, sanitizeValue(details || {}) ]);
            }
        });
    }
    function error(event, err, details) {
        isEnabled().then(enabled => {
            if (enabled) {
                safeConsole("error", [ event, sanitizeValue({
                    error: err,
                    details: details || {}
                }) ]);
            }
        });
    }
    const diagnostics = {
        STORAGE_KEY: STORAGE_KEY,
        log: log,
        error: error,
        isEnabled: isEnabled,
        setEnabled: setEnabled,
        invalidate: invalidate,
        sanitizeValue: sanitizeValue
    };
    root.ScreenshotDiagnostics = diagnostics;
    if (typeof module !== "undefined" && module.exports) {
        module.exports = diagnostics;
    }
})(typeof globalThis !== "undefined" ? globalThis : this);