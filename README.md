<p align="center">
  <img src="https://github.com/Amarjit/Amarjit/blob/8fcf625e15375f3bc257127505c88e63d046f407/assets/fullscreen-shotter/fullscreen-shotter.png" alt="Full Page Screenshotter mascot" width="420">
</p>

<p align="center">
  Screenshotter turns any webpage into clean, full-page screenshots in just a few clicks.
</p>

<p align="center">
  <a href="https://addons.mozilla.org/en-GB/firefox/addon/fullpage-screenshotter/">
    <img src="https://img.shields.io/badge/Firefox-Add--on-FF7139?logo=firefox-browser&logoColor=white" alt="Firefox Add-on">
  </a>
</p>

<h1 align="center">Full Page Screenshotter</h1>

A Firefox WebExtension that captures full-page screenshots including horizontal and vertical scroll areas. Click the toolbar button to capture the entire page and view it in a new tab for easy saving.

## Features

- Fast Capture for quick screenshots of normal/static pages
- Dynamic Scroll Capture for long, lazy-loaded, and app-style pages
- Supports vertical, horizontal, and nested scroll areas
- Lossless PNG screenshots
- Opens screenshots in a new tab with a direct download button
- Copy finished screenshots to the clipboard
- Advanced dynamic options for tricky pages
- Stop an active Dynamic Scroll Capture from the popup
- Local-only capture with no tracking, analytics, uploads, or external services

## What It Does And Why It Helps

- **Fast Capture** takes a quick screenshot when the page can be captured in one pass. It is the simplest option for static pages, articles, dashboards, and normal websites.
- **Dynamic Scroll Capture** scrolls through the page, captures each view, and stitches the result together. This helps with long pages, lazy-loaded content, infinite-scroll style pages, and sites that do not expose the whole page in one normal browser screenshot.
- **Stop Capture** lets you cancel a Dynamic Scroll Capture while it is running. Click the toolbar icon again to reopen the popup, then click **Stop Capture**. If some screenshots were already captured, the extension may show the partial result.
- **Nested scroll container support** detects when a site scrolls inside its own page container instead of the main browser window. This is useful for app-style sites such as social feeds, code hosting pages, dashboards, and other modern web apps.
- **Horizontal and vertical capture** handles pages that scroll sideways as well as down, so wide layouts and large web apps are less likely to be cut off.
- **Lossless PNG output** keeps text, UI, and page details sharp without JPEG compression artifacts.
- **Automatic stitching** combines the captured screens into one image. The default gap is `0`, so screenshots are joined without intentional spacing.
- **Sticky header and overlay hiding** can temporarily hide repeated fixed elements such as sticky nav bars, headers, toolbars, and known chat/help widgets while Dynamic Scroll Capture runs. This reduces repeated bars appearing in every stitched section.
- **Advanced dynamic options** give control when a page is awkward:
  - **Max scrolls** limits how far Dynamic Scroll Capture will go.
  - **Delay** waits between scrolls so lazy-loaded content has time to appear.
  - **Gap / overlap** adjusts how screenshots are joined if a site needs compensation.
  - **Start from top** starts capture at the top of the page or scroll container.
  - **Hide page overlays** removes repeated sticky elements while capturing.
  - **Disable backgrounds** can simplify noisy or heavy backgrounds.
  - **Pause animations/transitions** helps keep moving content stable between captures.
- **Local dynamic settings** remember your advanced capture choices in Firefox local storage, so the same values are available the next time you open the popup.
- **Download, copy, and close controls** open with the finished screenshot so the image can be saved directly, copied to the clipboard, or closed from the result page. Filenames use the `screenshotter-YYYYMMDD-HHMMSS.png` format.
- **Friendly error page** explains common problems in plain language, including blocked Firefox pages, private browsing permission issues, and site permission problems.
- **Designed for modern websites** including static pages, React/SPAs, lazy-loaded layouts, and nested-scroll pages. Firefox-protected pages such as `about:` pages and sites that block capture may still be unavailable.
- **Private by design**: screenshots stay in your browser. The extension does not track you, does not run analytics, does not upload screenshots, does not call external services, and does not store screenshots remotely. Finished screenshots are handed to the result page in memory so they can be displayed, downloaded, or copied without being permanently stored by the extension.
- **Clean production package**: release builds use an allowlist and exclude tests, documentation, package metadata, repository files, and previous build artifacts.

## Installation

### Firefox Add-ons

Install or view the published Firefox extension here:
https://addons.mozilla.org/en-GB/firefox/addon/fullpage-screenshotter/

## Firefox Permissions

This extension requires the following permissions:

- **`activeTab`**: Temporary access to the current tab when you click the extension icon. This allows capturing screenshots without requiring permanent access to all tabs.
- **`storage`**: Saves your capture preferences locally in your browser.
- **`clipboardWrite`**: Allows the result page to copy the finished PNG screenshot to your clipboard when you click "Copy to Clipboard".
- **`<all_urls>`**: Required for the `captureVisibleTab()` API to work across regular websites. The extension only accesses pages when you actively start capture. Firefox-protected pages and sites that block capture may still be unavailable.
- **`tabs` (optional)**: For enhanced tab management features if needed in future updates.

**Security Note**: The extension only accesses tabs when you actively start a capture. No screenshot data is collected, transmitted externally, analyzed, uploaded, or stored beyond your local browser session and local browser settings.

## Private Browsing

To use this extension in Firefox Private Browsing windows:

1. Right-click the extension icon in your toolbar
2. Select "Manage Extension"
3. Under "Permissions", enable "Allow in Private Windows"

**Note**: Firefox requires explicit permission for extensions to work in private browsing mode for privacy reasons. This setting must be enabled manually by the user.

## Usage

1. Pin the extension to your Firefox toolbar
2. Navigate to a webpage
3. Click the camera icon in your toolbar
4. Choose **Fast Capture** for normal pages
5. Choose **Dynamic Scroll Capture** for long, lazy-loaded, or app-style pages
6. Open **Advanced options** if you need to adjust max scrolls, delay, gap/overlap, start position, overlay hiding, backgrounds, or animations
7. While Dynamic Scroll Capture is running, click the toolbar icon again and press **Stop Capture** if you need to cancel it
8. Use the result page buttons to download, copy, or close the screenshot tab

## Troubleshooting

### Screenshot doesn't capture full page
- Ensure you're using a supported Firefox version
- Try Dynamic Scroll Capture for long, lazy-loaded, or app-style pages
- Increase the dynamic delay if content loads slowly while scrolling
- Increase max scrolls if Dynamic Scroll Capture stops before the full page is captured
- Enable Hide page overlays if repeated sticky headers, navigation bars, or chat widgets appear in the stitched image
- Try disabling other extensions that might interfere

### Extension icon doesn't appear
- Right-click in the toolbar and select "Customize Toolbar"
- Drag the camera icon to your toolbar

### Permission errors
- The extension requires the listed permissions to function
- Review the permissions section above for details

## Browser Compatibility

- Firefox 142.0 or newer
- Manifest version 2

## License

This project is licensed under the MIT License.

Copyright (c) 2026 Amarjit Bharath
