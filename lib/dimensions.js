try {
    function getPageDimensions() {
        const body = document.body;
        const html = document.documentElement;
        const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth, body.offsetWidth, html.offsetWidth, body.clientWidth, html.clientWidth);
        const scrollHeight = Math.max(body.scrollHeight, html.scrollHeight, body.offsetHeight, html.offsetHeight, body.clientHeight, html.clientHeight);
        const viewportWidth = window.innerWidth || html.clientWidth;
        const viewportHeight = window.innerHeight || html.clientHeight;
        const width = Math.max(scrollWidth, viewportWidth);
        const height = Math.max(scrollHeight, viewportHeight);
        const maxDimension = 32767;
        const exceedsLimits = width > maxDimension || height > maxDimension;
        return {
            width: width,
            height: height,
            viewportWidth: viewportWidth,
            viewportHeight: viewportHeight,
            scrollWidth: scrollWidth,
            scrollHeight: scrollHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            exceedsLimits: exceedsLimits,
            maxDimension: maxDimension
        };
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
    if (typeof window !== "undefined") {
        window.getPageDimensions = getPageDimensions;
        window.calculateCaptureRect = calculateCaptureRect;
        window.canCaptureSingleRect = canCaptureSingleRect;
    }
    if (typeof module !== "undefined" && module.exports) {
        module.exports = {
            getPageDimensions: getPageDimensions,
            calculateCaptureRect: calculateCaptureRect,
            canCaptureSingleRect: canCaptureSingleRect
        };
    }
} catch (error) {
    console.error("DIMENSIONS_JS: Load error:", error);
}