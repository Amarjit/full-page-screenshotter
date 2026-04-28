const SCROLL_TOLERANCE = 8;

function getDocumentDimensions() {
    const body = document.body;
    const html = document.documentElement;
    const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth, body.offsetWidth, html.offsetWidth, body.clientWidth, html.clientWidth);
    const scrollHeight = Math.max(body.scrollHeight, html.scrollHeight, body.offsetHeight, html.offsetHeight, body.clientHeight, html.clientHeight);
    const viewportWidth = window.innerWidth || html.clientWidth;
    const viewportHeight = window.innerHeight || html.clientHeight;
    const width = Math.max(scrollWidth, viewportWidth);
    const height = Math.max(scrollHeight, viewportHeight);
    const maxDimension = 32767;
    return {
        width: width,
        height: height,
        viewportWidth: viewportWidth,
        viewportHeight: viewportHeight,
        scrollWidth: scrollWidth,
        scrollHeight: scrollHeight,
        scrollTargetType: "window",
        cropRect: {
            x: 0,
            y: 0,
            width: viewportWidth,
            height: viewportHeight
        },
        devicePixelRatio: window.devicePixelRatio || 1,
        exceedsLimits: width > maxDimension || height > maxDimension,
        maxDimension: maxDimension
    };
}

function createScrollCaptureState(options = {}) {
    const target = selectScrollTarget();
    const startFromTop = options.startFromTop !== false;
    if (target.type === "element") {
        const originalScrollX = target.element.scrollLeft || 0;
        const originalScrollY = target.element.scrollTop || 0;
        if (startFromTop) {
            setElementScroll(target.element, 0, 0);
        }
        return {
            type: "element",
            element: target.element,
            scrollTarget: target.element,
            scrollX: originalScrollX,
            scrollY: originalScrollY,
            captureStartX: startFromTop ? 0 : originalScrollX,
            captureStartY: startFromTop ? 0 : originalScrollY
        };
    }
    const originalScrollX = window.scrollX || window.pageXOffset || 0;
    const originalScrollY = window.scrollY || window.pageYOffset || 0;
    if (startFromTop) {
        window.scrollTo(0, 0);
    }
    return {
        type: "window",
        scrollTarget: null,
        scrollX: originalScrollX,
        scrollY: originalScrollY,
        captureStartX: startFromTop ? 0 : originalScrollX,
        captureStartY: startFromTop ? 0 : originalScrollY
    };
}

function selectScrollTarget() {
    if (isDocumentScrollable()) {
        return {
            type: "window"
        };
    }
    const element = findBestScrollableElement();
    return element ? {
        type: "element",
        element: element
    } : {
        type: "window"
    };
}

function isDocumentScrollable() {
    const scrollingElement = document.scrollingElement || document.documentElement;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const verticalScrolls = scrollingElement.scrollHeight > viewportHeight + SCROLL_TOLERANCE;
    const horizontalScrolls = scrollingElement.scrollWidth > viewportWidth + SCROLL_TOLERANCE;
    if (!verticalScrolls && !horizontalScrolls) {
        return false;
    }
    const htmlStyle = window.getComputedStyle(document.documentElement);
    const bodyStyle = document.body ? window.getComputedStyle(document.body) : htmlStyle;
    return verticalScrolls && allowsDocumentScroll(htmlStyle.overflowY, bodyStyle.overflowY) || horizontalScrolls && allowsDocumentScroll(htmlStyle.overflowX, bodyStyle.overflowX);
}

function findBestScrollableElement() {
    const elements = Array.from(document.body ? document.body.querySelectorAll("*") : []);
    let best = null;
    let bestScore = 0;
    for (const element of elements) {
        if (!isScrollableElement(element)) {
            continue;
        }
        const rect = getVisibleRect(element);
        if (rect.width <= 0 || rect.height <= 0) {
            continue;
        }
        const visibleArea = rect.width * rect.height;
        const scrollOverflow = Math.max(0, element.scrollHeight - element.clientHeight) + Math.max(0, element.scrollWidth - element.clientWidth);
        const score = visibleArea + scrollOverflow;
        if (score > bestScore) {
            best = element;
            bestScore = score;
        }
    }
    return best;
}

function isScrollableElement(element) {
    if (!element || element === document.body || element === document.documentElement) {
        return false;
    }
    const verticalScrolls = element.scrollHeight > element.clientHeight + SCROLL_TOLERANCE;
    const horizontalScrolls = element.scrollWidth > element.clientWidth + SCROLL_TOLERANCE;
    if (!verticalScrolls && !horizontalScrolls) {
        return false;
    }
    const style = window.getComputedStyle(element);
    return verticalScrolls && allowsScroll(style.overflowY) || horizontalScrolls && allowsScroll(style.overflowX);
}

function allowsScroll(value) {
    return value === "auto" || value === "scroll" || value === "overlay";
}

function allowsDocumentScroll(htmlValue, bodyValue) {
    return !isScrollBlocked(htmlValue) && !isScrollBlocked(bodyValue);
}

function isScrollBlocked(value) {
    return value === "hidden" || value === "clip";
}

function getDimensionsForState(state) {
    if (!state || state.type !== "element" || !state.element) {
        return getDocumentDimensions();
    }
    return getElementDimensions(state.element);
}

function getElementDimensions(element) {
    const cropRect = getVisibleRect(element);
    const viewportWidth = Math.max(1, Math.round(cropRect.width));
    const viewportHeight = Math.max(1, Math.round(cropRect.height));
    const scrollWidth = Math.max(element.scrollWidth, element.clientWidth, viewportWidth);
    const scrollHeight = Math.max(element.scrollHeight, element.clientHeight, viewportHeight);
    const width = Math.max(scrollWidth, viewportWidth);
    const height = Math.max(scrollHeight, viewportHeight);
    const maxDimension = 32767;
    return {
        width: width,
        height: height,
        viewportWidth: viewportWidth,
        viewportHeight: viewportHeight,
        scrollWidth: scrollWidth,
        scrollHeight: scrollHeight,
        scrollTargetType: "element",
        cropRect: cropRect,
        devicePixelRatio: window.devicePixelRatio || 1,
        exceedsLimits: width > maxDimension || height > maxDimension,
        maxDimension: maxDimension
    };
}

function getVisibleRect(element) {
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const left = Math.max(0, rect.left);
    const top = Math.max(0, rect.top);
    const right = Math.min(viewportWidth, rect.right);
    const bottom = Math.min(viewportHeight, rect.bottom);
    return {
        x: Math.round(left),
        y: Math.round(top),
        width: Math.max(0, Math.round(right - left)),
        height: Math.max(0, Math.round(bottom - top))
    };
}

function restoreScrollState(state) {
    if (!state) {
        return;
    }
    if (state.type === "element" && state.element) {
        setElementScroll(state.element, state.scrollX, state.scrollY);
        return;
    }
    window.scrollTo(state.scrollX, state.scrollY);
}

function scrollCaptureTargetTo(state, x, y) {
    if (!state || state.type !== "element" || !state.element) {
        window.scrollTo(x, y);
        return {
            scrollX: window.scrollX || window.pageXOffset || 0,
            scrollY: window.scrollY || window.pageYOffset || 0,
            dimensions: getDocumentDimensions()
        };
    }
    setElementScroll(state.element, x, y);
    return {
        scrollX: state.element.scrollLeft || 0,
        scrollY: state.element.scrollTop || 0,
        dimensions: getElementDimensions(state.element)
    };
}

function setElementScroll(element, x, y) {
    if (typeof element.scrollTo === "function") {
        element.scrollTo(x, y);
    } else {
        element.scrollLeft = x;
        element.scrollTop = y;
    }
}

if (typeof window !== "undefined") {
    window.scrollCaptureStrategies = {
        createScrollCaptureState: createScrollCaptureState,
        getDimensionsForState: getDimensionsForState,
        restoreScrollState: restoreScrollState,
        scrollCaptureTargetTo: scrollCaptureTargetTo,
        selectScrollTarget: selectScrollTarget,
        findBestScrollableElement: findBestScrollableElement,
        getVisibleRect: getVisibleRect,
        isDocumentScrollable: isDocumentScrollable
    };
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        createScrollCaptureState: createScrollCaptureState,
        getDimensionsForState: getDimensionsForState,
        restoreScrollState: restoreScrollState,
        scrollCaptureTargetTo: scrollCaptureTargetTo,
        selectScrollTarget: selectScrollTarget,
        findBestScrollableElement: findBestScrollableElement,
        getVisibleRect: getVisibleRect,
        isDocumentScrollable: isDocumentScrollable,
        getDocumentDimensions: getDocumentDimensions
    };
}