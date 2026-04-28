# Full Page Screenshotter

Full Page Screenshotter is a Firefox extension for taking screenshots of whole web pages. It can capture normal pages quickly, and it can also work through longer or more awkward pages by scrolling, capturing each visible part, and joining the pieces into one image.

## What it does

- Captures full-page screenshots from Firefox.
- Handles pages that scroll down, across, or inside a page panel.
- Offers Fast Capture for simple pages.
- Offers Dynamic Scroll Capture for long pages, lazy-loaded pages, and web apps.
- Can temporarily hide repeated sticky headers, navigation bars, and common help/chat widgets while capturing.
- Can pause page animations and simplify backgrounds during dynamic capture.
- Opens the finished screenshot in a new tab.
- Lets you download the screenshot as a PNG or copy it to the clipboard.
- Keeps screenshot data local in your browser.

## Why there are two capture modes

Fast Capture is the best first choice for normal pages. It is quick and simple.

Dynamic Scroll Capture is for pages that are too long, load more content as you scroll, or keep their own scrolling area inside the page. It scrolls through the page, takes multiple captures, and stitches them together.

## Privacy

The extension does not upload your screenshots. It does not use tracking, analytics, or external services. Screenshot data stays in Firefox and is shown on the result page so you can save or copy it.

The extension stores only local capture preferences, such as dynamic capture delay and overlay options.

## Firefox permissions

Firefox asks for permissions so the extension can do its job:

- activeTab: lets the extension work with the tab you choose when you click the toolbar button.
- storage: saves your capture preferences locally.
- clipboardWrite: lets the result page copy the finished screenshot when you click the copy button.
- all website access: needed by Firefox's screenshot capture API so captures work across normal websites.

The extension starts capturing only when you click its button.

## Private browsing

Firefox requires you to allow extensions manually in private windows. To use this extension in a private window, open the extension settings in Firefox and enable Allow in Private Windows.

## Basic use

1. Install the extension in Firefox.
2. Pin it to the Firefox toolbar if needed.
3. Open the page you want to capture.
4. Click the extension button.
5. Choose Fast Capture for normal pages, or Dynamic Scroll Capture for long or app-style pages.
6. Use the result page to download or copy the screenshot.

## Troubleshooting

Firefox may block protected internal pages, such as about: pages, by default. Where Firefox offers an extension setting for this, enable that permission in the extension options before capturing those pages. Some websites may also block capture or behave differently while scrolling.

If a screenshot is cut off, try Dynamic Scroll Capture. If content is missing, increase the delay so the page has more time to load while scrolling. If repeated headers or floating widgets appear in the image, enable the option to hide page overlays.

## License

This project is licensed under the MIT License.

Copyright (c) 2026 Amarjit Bharath
