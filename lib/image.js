try {
    function loadImage(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image;
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = dataUrl;
        });
    }
    function createCanvas(width, height) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
    async function stitchImageChunks(chunks, totalWidth, totalHeight, devicePixelRatio = 1) {
        try {
            const loadedChunks = [];
            let outputDpr = Math.max(1, devicePixelRatio || 1);
            for (const chunk of chunks) {
                const img = await loadImage(chunk.dataUrl);
                const sourceScale = getChunkSourceScale(chunk, img.width, img.height);
                outputDpr = Math.max(outputDpr, sourceScale);
                loadedChunks.push({
                    chunk: chunk,
                    img: img,
                    sourceScale: sourceScale
                });
            }
            const canvasWidth = Math.ceil(totalWidth * outputDpr);
            const canvasHeight = Math.ceil(totalHeight * outputDpr);
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext("2d");
            for (const loaded of loadedChunks) {
                const {chunk: chunk, img: img} = loaded;
                try {
                    const draw = calculateChunkDrawRect(chunk, img.width, img.height, outputDpr);
                    const destX = Math.round(chunk.x * outputDpr);
                    const destY = Math.round(chunk.y * outputDpr);
                    ctx.drawImage(img, draw.sourceX, draw.sourceY, draw.sourceWidth, draw.sourceHeight, destX, destY, draw.destWidth, draw.destHeight);
                } catch (error) {
                    console.error(`Failed to load/draw chunk at ${chunk.x},${chunk.y}:`, error);
                }
            }
            const dataUrl = canvas.toDataURL("image/png", 1);
            return dataUrl;
        } catch (error) {
            console.error("Failed to stitch image chunks:", error);
            throw error;
        }
    }
    function calculateChunkDrawRect(chunk, imageWidth, imageHeight, outputDpr = 1) {
        const sourceScale = getChunkSourceScale(chunk, imageWidth, imageHeight);
        const sourceX = clamp(Math.round((chunk.cropX || 0) * sourceScale), 0, Math.max(0, imageWidth - 1));
        const sourceY = clamp(Math.round((chunk.cropY || 0) * sourceScale), 0, Math.max(0, imageHeight - 1));
        const cropWidth = Math.max(1, chunk.cropWidth || chunk.width);
        const cropHeight = Math.max(1, chunk.cropHeight || chunk.height);
        const availableSourceWidth = Math.max(1, imageWidth - sourceX);
        const availableSourceHeight = Math.max(1, imageHeight - sourceY);
        const desiredSourceWidth = Math.max(1, Math.ceil(cropWidth * sourceScale));
        const desiredSourceHeight = Math.max(1, Math.ceil(cropHeight * sourceScale));
        const sourceWidth = Math.min(availableSourceWidth, desiredSourceWidth);
        const sourceHeight = Math.min(availableSourceHeight, desiredSourceHeight);
        const cssWidth = Math.max(1, sourceWidth / sourceScale);
        const cssHeight = Math.max(1, sourceHeight / sourceScale);
        return {
            sourceX: sourceX,
            sourceY: sourceY,
            sourceWidth: sourceWidth,
            sourceHeight: sourceHeight,
            destWidth: Math.round(cssWidth * outputDpr),
            destHeight: Math.round(cssHeight * outputDpr)
        };
    }
    function getChunkSourceScale(chunk, imageWidth, imageHeight) {
        const candidates = [];
        if (chunk.viewportWidth > 0) {
            candidates.push(imageWidth / chunk.viewportWidth);
        }
        if (chunk.viewportHeight > 0) {
            candidates.push(imageHeight / chunk.viewportHeight);
        }
        const validCandidates = candidates.filter(value => Number.isFinite(value) && value > 0);
        if (validCandidates.length === 0) {
            return Math.max(1, chunk.dpr || 1);
        }
        return Math.max(.1, Math.min(...validCandidates));
    }
    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }
    function calculateChunkPositions(dimensions, chunkWidth, chunkHeight) {
        const {width: width, height: height} = dimensions;
        const chunks = [];
        for (let y = 0; y < height; y += chunkHeight) {
            for (let x = 0; x < width; x += chunkWidth) {
                const chunkW = Math.min(chunkWidth, width - x);
                const chunkH = Math.min(chunkHeight, height - y);
                chunks.push({
                    x: x,
                    y: y,
                    width: chunkW,
                    height: chunkH
                });
            }
        }
        return chunks;
    }
    function calculateViewportGrid(dimensions, viewportWidth, viewportHeight, maxVerticalRows = Infinity, gapPx = 0, startX = 0, startY = 0) {
        const width = Math.max(viewportWidth, dimensions.width || dimensions.scrollWidth || 0);
        const height = Math.max(viewportHeight, dimensions.height || dimensions.scrollHeight || 0);
        const overlap = Math.max(0, -normalizeGapPx(gapPx));
        const gap = Math.max(0, normalizeGapPx(gapPx));
        const xPositions = buildAxisPositions(width, viewportWidth, Infinity, 0, 0, startX);
        const yPositions = buildAxisPositions(height, viewportHeight, maxVerticalRows, overlap, gap, startY);
        return {
            xPositions: xPositions,
            yPositions: yPositions,
            reachedMaxScrolls: yPositions.length < buildAxisPositions(height, viewportHeight, Infinity, overlap, gap, startY).length
        };
    }
    function buildAxisPositions(total, viewport, maxPositions, overlap = 0, gap = 0, start = 0) {
        const maxOffset = Math.max(0, total - viewport);
        const first = clamp(Math.round(start || 0), 0, maxOffset);
        const positions = [ first ];
        if (viewport <= 0 || total <= viewport || maxPositions <= 1) {
            return positions;
        }
        const step = Math.max(1, viewport - Math.max(0, overlap) + Math.max(0, gap));
        let next = first + step;
        while (next < total && positions.length < maxPositions) {
            const value = Math.min(next, maxOffset);
            if (positions[positions.length - 1] !== value) {
                positions.push(value);
            }
            if (value >= maxOffset) {
                break;
            }
            next += step;
        }
        return positions;
    }
    function normalizeGapPx(value) {
        const parsed = parseInt(value, 10);
        return Number.isFinite(parsed) ? Math.min(200, Math.max(-200, parsed)) : 0;
    }
    function isWithinImageLimits(width, height) {
        const maxCanvasSize = 32767;
        const maxSafePixels = 268435456;
        return width <= maxCanvasSize && height <= maxCanvasSize && width * height <= maxSafePixels;
    }
    if (typeof window !== "undefined") {
        window.loadImage = loadImage;
        window.createCanvas = createCanvas;
        window.stitchImageChunks = stitchImageChunks;
        window.calculateChunkPositions = calculateChunkPositions;
        window.calculateViewportGrid = calculateViewportGrid;
        window.isWithinImageLimits = isWithinImageLimits;
    }
    if (typeof module !== "undefined" && module.exports) {
        module.exports = {
            loadImage: loadImage,
            createCanvas: createCanvas,
            stitchImageChunks: stitchImageChunks,
            calculateChunkPositions: calculateChunkPositions,
            calculateViewportGrid: calculateViewportGrid,
            isWithinImageLimits: isWithinImageLimits,
            calculateChunkDrawRect: calculateChunkDrawRect,
            buildAxisPositions: buildAxisPositions,
            getChunkSourceScale: getChunkSourceScale
        };
    }
} catch (error) {
    console.error("Image script failed to load:", error);
}