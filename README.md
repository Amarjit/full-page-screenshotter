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
- Configurable after-capture actions for opening, downloading, and copying screenshots
- Advanced dynamic options for tricky pages
- Optional single-click toolbar capture using a saved static or dynamic default
- Assignable extension shortcuts for Fast Capture and Dynamic Scroll Capture
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
- **Single-click toolbar capture** can be enabled from the extension options page. When enabled, clicking the toolbar button immediately captures with your saved Static Capture or Dynamic Scroll Capture default instead of opening the popup. Clicking the toolbar button again cancels an active Dynamic Scroll Capture. Turning single-click capture off restores the normal popup workflow.
- **Extension shortcuts** expose separate Fast Capture and Dynamic Scroll Capture commands in Firefox's extension shortcut settings. You can open shortcut setup from the Keyboard Shortcuts section in the extension options page, or manually from Firefox's **Manage Extension Shortcuts** page. No default keys are assigned, so you can choose shortcuts that do not conflict with Firefox, websites, or other add-ons.
- **After-capture actions** can be configured from the extension options page. A finished screenshot can open in the result tab, download automatically as a PNG, copy to the clipboard, or run any combination of those actions. Opening the result tab is enabled by default. Filenames use the `screenshotter-YYYYMMDD-HHMMSS.png` format.
- **Download, copy, and close controls** are still available on the result page when the open result tab action is enabled.
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
- **`clipboardWrite`**: Allows the extension to copy the finished PNG screenshot to your clipboard when you click "Copy to Clipboard" or enable the Copy to clipboard after-capture action.
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

### Capture From The Toolbar

1. Pin the extension to your Firefox toolbar
2. Navigate to a webpage
3. Click the camera icon in your toolbar
4. Choose **Fast Capture** for normal pages
5. Choose **Dynamic Scroll Capture** for long, lazy-loaded, or app-style pages
6. Open **Advanced options** if you need to adjust max scrolls, delay, gap/overlap, start position, overlay hiding, backgrounds, or animations
7. While Dynamic Scroll Capture is running, click the toolbar icon again to cancel it in single-click mode, or press **Stop Capture** when the popup workflow is enabled
8. The saved after-capture actions run when the screenshot finishes
9. Use the result page buttons to download, copy, or close the screenshot tab when the result page opens

### Configure After-Capture Actions

1. Open `about:addons` in Firefox
2. Select **Extensions**
3. Find **Fullscreen Shotter**
4. Open the extension menu or details page
5. Open **Preferences** or **Options**
6. In **After Capture**, choose **Open result tab**, **Download PNG**, **Copy to clipboard**, or any combination
7. Leave at least one action enabled; the options page keeps **Open result tab** enabled if all actions are turned off

### Enable Single-Click Toolbar Capture

1. Open `about:addons` in Firefox
2. Select **Extensions**
3. Find **Fullscreen Shotter**
4. Open the extension menu or details page
5. Open **Preferences** or **Options**
6. Enable **Use single-click capture**
7. Choose **Static Capture** or **Dynamic Scroll Capture** as the default toolbar action
8. If you choose Dynamic Scroll Capture, adjust the dynamic settings shown below the default mode
9. Return to a webpage and click the toolbar icon to capture immediately without opening the popup

### Create Keyboard Shortcuts

You can set shortcuts either from the extension settings link or directly from Firefox's shortcut manager.

#### From Extension Settings

1. Open `about:addons` in Firefox
2. Select **Extensions**
3. Find **Fullscreen Shotter**
4. Open the extension menu or details page
5. Open **Preferences** or **Options**
6. In **Keyboard Shortcuts**, click **Manage keyboard shortcuts**
7. Assign a key combination to **Capture the current page with Fast Capture**
8. Assign a key combination to **Capture the current page with Dynamic Scroll Capture** if you want a separate dynamic shortcut
9. Close the shortcut assignment window after setting shortcuts so Firefox activates the new assignments
10. Firefox, websites, and other add-ons can have their own shortcuts, so choose key combinations that do not conflict

#### From Firefox Shortcuts

1. Open `about:addons` in Firefox
2. Click the gear icon near the top of the Add-ons Manager
3. Choose **Manage Extension Shortcuts**
4. Find **Fullscreen Shotter**
5. Assign shortcuts for Fast Capture and/or Dynamic Scroll Capture
6. Close the shortcut assignment window after setting shortcuts so Firefox activates the new assignments
7. Firefox, websites, and other add-ons can have their own shortcuts, so choose key combinations that do not conflict

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
