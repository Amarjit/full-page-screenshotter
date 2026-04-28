function hideCaptureOverlays(options = {}) {
    const cropRect = options.cropRect || getViewportRect();
    const scrollTarget = options.scrollTarget || null;
    const hidden = Array.isArray(options.hidden) ? options.hidden : [];
    const elements = collectOverlayCandidates();
    for (const element of elements) {
        if (isAlreadyHidden(element, hidden) || isInsideHiddenElement(element, hidden)) {
            continue;
        }
        if (shouldIgnoreElement(element, scrollTarget)) {
            continue;
        }
        const style = window.getComputedStyle(element);
        const rect = getViewportRectForElement(element);
        const isMessagingWidget = hasMessagingWidgetSemantics(element);
        if (!isCaptureOverlayCandidate(element, style, rect, cropRect)) {
            continue;
        }
        const target = isMessagingWidget ? findWidgetContainer(element, cropRect, scrollTarget) : element;
        if (!target) {
            continue;
        }
        if (isAlreadyHidden(target, hidden) || isInsideHiddenElement(target, hidden)) {
            continue;
        }
        if (shouldIgnoreElement(target, scrollTarget)) {
            continue;
        }
        hidden.push({
            element: target,
            visibility: target.style.visibility,
            pointerEvents: target.style.pointerEvents,
            opacity: target.style.opacity
        });
        target.style.visibility = "hidden";
        target.style.pointerEvents = "none";
        target.style.opacity = "0";
    }
    return hidden;
}

function isAlreadyHidden(element, hidden) {
    return hidden.some(entry => entry && entry.element === element);
}

function isInsideHiddenElement(element, hidden) {
    return hidden.some(entry => entry && entry.element && entry.element !== element && typeof entry.element.contains === "function" && entry.element.contains(element));
}

function restoreCaptureOverlays(hidden) {
    for (const entry of hidden || []) {
        if (!entry.element || !entry.element.style) {
            continue;
        }
        entry.element.style.visibility = entry.visibility;
        entry.element.style.pointerEvents = entry.pointerEvents;
        entry.element.style.opacity = entry.opacity;
    }
}

function shouldIgnoreElement(element, scrollTarget) {
    if (!element || !scrollTarget) {
        return false;
    }
    if (element === scrollTarget) {
        return true;
    }
    return typeof element.contains === "function" && element.contains(scrollTarget);
}

function isOverlayPosition(position) {
    return position === "fixed" || position === "sticky";
}

function isCaptureOverlayCandidate(element, style, rect, cropRect) {
    if (!rectsIntersect(rect, cropRect)) {
        return false;
    }
    if (hasMessagingWidgetSemantics(element) && isCornerWidget(rect, cropRect) && (isReasonableCornerWidgetSize(rect, cropRect) || isReasonableWidgetShellSize(rect, cropRect))) {
        return true;
    }
    if (isReasonableOverlaySize(rect, cropRect) && isOverlayPosition(style.position)) {
        return true;
    }
    return isReasonableOverlaySize(rect, cropRect) && hasOverlaySemantics(element) && isTopOrBottomBar(rect, cropRect);
}

function collectOverlayCandidates(root = document) {
    const elements = [];
    const seen = new Set;
    const roots = [ root ];
    while (roots.length > 0) {
        const currentRoot = roots.shift();
        const candidates = currentRoot && currentRoot.body ? Array.from(currentRoot.body.querySelectorAll("*")) : Array.from(currentRoot && typeof currentRoot.querySelectorAll === "function" ? currentRoot.querySelectorAll("*") : []);
        for (const element of candidates) {
            if (!element || seen.has(element)) {
                continue;
            }
            seen.add(element);
            elements.push(element);
            if (element.shadowRoot) {
                element.shadowRoot.host = element;
                roots.push(element.shadowRoot);
            }
        }
    }
    return elements;
}

function hasOverlaySemantics(element) {
    const tagName = String(element.tagName || "").toLowerCase();
    const role = lowerAttribute(element, "role");
    const ariaLabel = lowerAttribute(element, "aria-label");
    const className = lowerValue(element.className);
    const id = lowerValue(element.id);
    const text = `${tagName} ${role} ${ariaLabel} ${className} ${id}`;
    return tagName === "header" || tagName === "nav" || role === "banner" || role === "navigation" || /\b(header|navbar|nav|topbar|sticky|fixed|masthead|appbar|toolbar)\b/.test(text);
}

function hasMessagingWidgetSemantics(element) {
    const ariaLabel = lowerAttribute(element, "aria-label");
    const title = lowerAttribute(element, "title");
    const src = lowerAttribute(element, "src");
    const text = `${ariaLabel} ${title} ${src}`;
    return /\b(intercom|zendesk|drift|crisp|tawk|livechat|messenger|conversation)\b/.test(text);
}

function findWidgetContainer(element, cropRect, scrollTarget) {
    let best = getShadowHost(element) || element;
    let current = best === element ? getParentElement(element) : best;
    while (current && !isDocumentRoot(current)) {
        if (shouldIgnoreElement(current, scrollTarget)) {
            return null;
        }
        const rect = getViewportRectForElement(current);
        if (rectsIntersect(rect, cropRect) && isCornerWidget(rect, cropRect) && isReasonableWidgetShellSize(rect, cropRect)) {
            best = current;
            current = getParentElement(current);
            continue;
        }
        break;
    }
    return best;
}

function getShadowHost(element) {
    const root = element && typeof element.getRootNode === "function" ? element.getRootNode() : null;
    return root && root.host ? root.host : null;
}

function getParentElement(element) {
    if (!element) {
        return null;
    }
    if (element.parentElement) {
        return element.parentElement;
    }
    const parentNode = element.parentNode;
    return parentNode && parentNode.nodeType === 1 ? parentNode : null;
}

function isDocumentRoot(element) {
    return element === document.body || element === document.documentElement;
}

function lowerAttribute(element, name) {
    if (!element || typeof element.getAttribute !== "function") {
        return "";
    }
    return lowerValue(element.getAttribute(name));
}

function lowerValue(value) {
    if (value == null) {
        return "";
    }
    if (typeof value === "string") {
        return value.toLowerCase();
    }
    if (typeof value === "object" && typeof value.baseVal === "string") {
        return value.baseVal.toLowerCase();
    }
    return String(value).toLowerCase();
}

function isTopOrBottomBar(rect, cropRect) {
    const topLimit = cropRect.y + Math.max(80, cropRect.height * .2);
    const bottomLimit = cropRect.y + cropRect.height - Math.max(80, cropRect.height * .2);
    const rectTop = rect.y;
    const rectBottom = rect.y + rect.height;
    return rectTop <= topLimit || rectBottom >= bottomLimit;
}

function isCornerWidget(rect, cropRect) {
    const edgeBuffer = Math.max(80, cropRect.width * .12);
    const bottomBuffer = Math.max(100, cropRect.height * .25);
    const cropRight = cropRect.x + cropRect.width;
    const cropBottom = cropRect.y + cropRect.height;
    const rectRight = rect.x + rect.width;
    const rectBottom = rect.y + rect.height;
    const nearBottom = rectBottom >= cropBottom - bottomBuffer;
    const nearLeft = rect.x <= cropRect.x + edgeBuffer;
    const nearRight = rectRight >= cropRight - edgeBuffer;
    return nearBottom && (nearLeft || nearRight);
}

function isReasonableOverlaySize(rect, cropRect) {
    const maxHeight = Math.max(120, cropRect.height * .35);
    const minWidth = Math.min(cropRect.width * .25, 240);
    return rect.width > 0 && rect.height > 0 && rect.height <= maxHeight && rect.width >= minWidth;
}

function isReasonableCornerWidgetSize(rect, cropRect) {
    const maxWidth = Math.max(120, cropRect.width * .55);
    const maxHeight = Math.max(120, cropRect.height * .75);
    const minSize = 24;
    return rect.width >= minSize && rect.height >= minSize && rect.width <= maxWidth && rect.height <= maxHeight;
}

function isReasonableWidgetShellSize(rect, cropRect) {
    const maxWidth = Math.max(180, cropRect.width * .7);
    const maxHeight = Math.max(180, cropRect.height * .9);
    const minSize = 24;
    const nearlyFullWidth = rect.width >= cropRect.width * .9;
    return rect.width >= minSize && rect.height >= minSize && rect.width <= maxWidth && rect.height <= maxHeight && !nearlyFullWidth;
}

function getViewportRectForElement(element) {
    const rect = element.getBoundingClientRect();
    return {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.max(0, Math.round(rect.right - rect.left)),
        height: Math.max(0, Math.round(rect.bottom - rect.top))
    };
}

function getViewportRect() {
    return {
        x: 0,
        y: 0,
        width: window.innerWidth || document.documentElement.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight
    };
}

function rectsIntersect(a, b) {
    return a.width > 0 && a.height > 0 && b.width > 0 && b.height > 0 && a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

if (typeof window !== "undefined") {
    window.captureOverlayManager = {
        hideCaptureOverlays: hideCaptureOverlays,
        restoreCaptureOverlays: restoreCaptureOverlays,
        rectsIntersect: rectsIntersect,
        shouldIgnoreElement: shouldIgnoreElement,
        isAlreadyHidden: isAlreadyHidden,
        isInsideHiddenElement: isInsideHiddenElement,
        isCaptureOverlayCandidate: isCaptureOverlayCandidate,
        collectOverlayCandidates: collectOverlayCandidates,
        hasOverlaySemantics: hasOverlaySemantics,
        hasMessagingWidgetSemantics: hasMessagingWidgetSemantics,
        findWidgetContainer: findWidgetContainer,
        isTopOrBottomBar: isTopOrBottomBar,
        isCornerWidget: isCornerWidget,
        isReasonableOverlaySize: isReasonableOverlaySize,
        isReasonableCornerWidgetSize: isReasonableCornerWidgetSize,
        isReasonableWidgetShellSize: isReasonableWidgetShellSize
    };
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        hideCaptureOverlays: hideCaptureOverlays,
        restoreCaptureOverlays: restoreCaptureOverlays,
        rectsIntersect: rectsIntersect,
        shouldIgnoreElement: shouldIgnoreElement,
        isAlreadyHidden: isAlreadyHidden,
        isInsideHiddenElement: isInsideHiddenElement,
        isCaptureOverlayCandidate: isCaptureOverlayCandidate,
        collectOverlayCandidates: collectOverlayCandidates,
        hasOverlaySemantics: hasOverlaySemantics,
        hasMessagingWidgetSemantics: hasMessagingWidgetSemantics,
        findWidgetContainer: findWidgetContainer,
        isTopOrBottomBar: isTopOrBottomBar,
        isCornerWidget: isCornerWidget,
        isReasonableOverlaySize: isReasonableOverlaySize,
        isReasonableCornerWidgetSize: isReasonableCornerWidgetSize,
        isReasonableWidgetShellSize: isReasonableWidgetShellSize
    };
}