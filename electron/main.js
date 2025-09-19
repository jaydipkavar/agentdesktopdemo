import { app, BrowserWindow, ipcMain, Menu, dialog } from "electron";
import { platform } from "os";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import express from "express";
import pkg from 'electron-updater';
const { autoUpdater } = pkg;

let win;
let server;

const isDev = !app.isPackaged;

function createWindow() {
    const __dirname = dirname(fileURLToPath(import.meta.url));

    if (!isDev) {
        // Create express server for production
        const serverApp = express();
        const port = 3000;

        // Serve static files from dist directory
        serverApp.use(express.static(path.join(__dirname, "../dist")));

        // Handle React Router (fallback to index.html for SPA)
        serverApp.get("/", (req, res) => {
            res.sendFile(path.join(__dirname, "../dist/index.html"));
        });

        // Catch all other routes and serve index.html
        serverApp.use((req, res) => {
            res.sendFile(path.join(__dirname, "../dist/index.html"));
        });

        server = serverApp
            .listen(port, (err) => {
                if (err) {
                    console.error("Failed to start server:", err);
                    // Fallback to file loading if server fails
                    createBrowserWindow(
                        __dirname,
                        `file://${path.join(__dirname, "../dist/index.html")}`
                    );
                    return;
                }
                console.log(`Server running on http://localhost:${port}`);
                createBrowserWindow(__dirname, `http://localhost:${port}`);
            })
            .on("error", (err) => {
                console.error("Server error:", err);
                // Fallback to file loading if server fails
                createBrowserWindow(
                    __dirname,
                    `file://${path.join(__dirname, "../dist/index.html")}`
                );
            });
    } else {
        createBrowserWindow(__dirname, "http://localhost:5173");
    }
}

function createBrowserWindow(__dirname, loadUrl) {
    win = new BrowserWindow({
        menu: null,
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: true,
            partition: "persist:main",
            experimentalFeatures: true, // Enable experimental web features
        },
        icon: path.join(__dirname, "../assets/icon.png"),
        title: "AgentAct",
    });

    // Hide the menu bar in production
    if (!isDev) {
        win.setMenuBarVisibility(false);
        win.removeMenu();

        if (platform() === "darwin") {
            Menu.setApplicationMenu(Menu.buildFromTemplate([]));
        }
        // win.webContents.openDevTools(); // Remove this line when you're done testing
    }

    // Load the URL (either dev server or local express server)
    win.loadURL(loadUrl);
}

let playwrightBrowser, page, currentUrl;

// Handle Playwright playwrightBrowser launch
// Simple alternative approach for browser launch
import os from "os";
ipcMain.handle("launch-playwright", async (_event, url) => {
    try {
        const platform = os.platform();
        const isWindows = platform === "win32";
        const isLinux = platform === "linux";
        const isMac = platform === "darwin";

        let launchOptions = {
            headless: false,
            slowMo: 50,
        };

        // Configure launch options based on platform
        if (isWindows) {
            // Windows-specific configuration
            launchOptions.args = [
                "--disable-blink-features=AutomationControlled",
                "--disable-web-security",
                "--disable-features=VizDisplayCompositor",
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
            ];

            // For production on Windows, use system Chrome or bundled version
            if (!isDev) {
                // Option 1: Try to use system Chrome first
                try {
                    launchOptions.channel = "chrome";
                } catch (error) {
                    // Option 2: Use bundled browsers with environment variable
                    process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(
                        process.resourcesPath,
                        "playwright-browsers"
                    );

                    console.log(
                        "Using default Playwright browser resolution for Windows"
                    );
                }
            }
        } else if (isLinux) {
            // Linux-specific configuration
            launchOptions.width = 1106;
            launchOptions.height = 857;
        } else if (isMac) {
            // macOS-specific configuration
            launchOptions.args = [
                "--disable-blink-features=AutomationControlled",
                "--disable-web-security",
                "--disable-features=VizDisplayCompositor",
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
            ];

            // For production on macOS, try to use system Chrome
            if (!isDev) {
                try {
                    launchOptions.channel = "chrome";
                } catch (error) {
                    // Fallback to bundled browsers
                    process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(
                        process.resourcesPath,
                        "playwright-browsers"
                    );

                    console.log(
                        "Using default Playwright browser resolution for macOS"
                    );
                }
            }
        } else {
            // Other platforms - use basic configuration
            launchOptions.args = [
                "--disable-blink-features=AutomationControlled",
                "--disable-web-security",
                "--disable-features=VizDisplayCompositor",
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
            ];
        }

        console.log(`Platform: ${platform}`);
        console.log("Launch options:", launchOptions);

        if (!playwrightBrowser) {
            console.log("Launching Playwright browser...");

            // Try multiple approaches for Windows and macOS, simple approach for Linux
            if (isWindows || isMac) {
                try {
                    playwrightBrowser = await chromium.launch(launchOptions);
                } catch (error) {
                    console.log(
                        "First launch attempt failed, trying fallback..."
                    );

                    // Fallback: remove channel and try again
                    delete launchOptions.channel;
                    playwrightBrowser = await chromium.launch(launchOptions);
                }
            } else {
                // Linux and other platforms - direct launch
                playwrightBrowser = await chromium.launch(launchOptions);
            }

            if (!page) {
                page = await playwrightBrowser.newPage();

                // Set viewport size based on platform
                if (isWindows || isMac) {
                    await page.setViewportSize({ width: 1106, height: 857 });
                }
                // For Linux, viewport size is handled in launch options
            }
        }

        if (currentUrl !== url) {
            console.log(`Navigating to: ${url}`);

            // Use different navigation options based on platform
            if (isWindows || isMac) {
                await page.goto(url, {
                    waitUntil: "domcontentloaded",
                    timeout: 30000,
                });
            } else {
                // Linux - simpler navigation
                await page.goto(url);
            }
            currentUrl = url;
        }

        return {
            success: true,
            message: `Playwright browser launched successfully on ${platform}!`,
        };
    } catch (error) {
        console.error("Error launching Playwright:", error);

        // Clean up on error
        if (playwrightBrowser) {
            try {
                await playwrightBrowser.close();
            } catch (closeError) {
                console.error("Error closing browser:", closeError);
            }
            playwrightBrowser = null;
            page = null;
            currentUrl = null;
        }

        return {
            success: false,
            message: `Failed to launch browser on ${os.platform()}: ${
                error.message
            }`,
        };
    }
});

ipcMain.handle("capture-screenshot", async () => {
    if (page) {
        const screenshotBuffer = await page.screenshot({ type: "png" });
        console.log(screenshotBuffer);
        return screenshotBuffer.toString("base64");
    }
    return null;
});

ipcMain.handle("set-viewport-size", async (_event, viewport) => {
    try {
        console.log("🔍 [MAIN] set-viewport-size called with:", viewport);
        if (!page) {
            console.log("❌ [MAIN] Page not initialized");
            return { success: false, message: "Page not initialized" };
        }

        await page.setViewportSize(viewport);
        console.log(
            `✅ [MAIN] Viewport size set to: ${viewport.width}x${viewport.height}`
        );

        return {
            success: true,
            message: `Viewport set to ${viewport.width}x${viewport.height}`,
        };
    } catch (error) {
        console.error("❌ [MAIN] Error setting viewport size:", error);
        return { success: false, message: error.message };
    }
});
// Handle fetching page content using Playwright
// @ts-ignore
ipcMain.handle("getPageContent", async (event) => {
    if (!page) throw new Error("Page not initialized");
    const width = await page.evaluate(
        () => document.documentElement.scrollWidth
    );
    const height = await page.evaluate(
        () => document.documentElement.scrollHeight
    );
    async function savePageWithAllResourcesFixed(page) {
        /**
         * Handles ALL resource types including CSS background-images in style attributes
         */

        const currentUrl = page.url();
        let htmlContent = await page.content();

        // Helper function to join URLs (equivalent to Python's urljoin)
        function urlJoin(base, relative) {
            try {
                return new URL(relative, base).href;
            } catch (e) {
                return relative; // Return as-is if URL construction fails
            }
        }

        // Helper function to decode HTML entities (equivalent to Python's html.unescape)
        function htmlUnescape(str) {
            const htmlEntities = {
                "&amp;": "&",
                "&lt;": "<",
                "&gt;": ">",
                "&quot;": '"',
                "&#x27;": "'",
                "&#39;": "'",
                "&apos;": "'",
                "&nbsp;": " ",
                "&copy;": "©",
                "&reg;": "®",
                "&trade;": "™",
            };

            return str.replace(/&[#\w]+;/g, (entity) => {
                return htmlEntities[entity] || entity;
            });
        }

        // Helper function to encode HTML entities (equivalent to Python's html.escape)
        function htmlEscape(str, quote = true) {
            let result = str
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

            if (quote) {
                result = result.replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
            }

            return result;
        }

        // 1. Fix protocol-relative URLs in src/href attributes
        htmlContent = htmlContent.replace(
            /(src|href)="\/\/([^"]+)"/g,
            '$1="https://$2"'
        );

        // 2. Fix relative URLs in src/href attributes
        htmlContent = htmlContent.replace(
            /(src|href)="(\/[^"]+)"/g,
            (match, attr, url) => {
                return `${attr}="${urlJoin(currentUrl, url)}"`;
            }
        );

        // 3. Fix CSS url() in <style> tags and external CSS
        htmlContent = htmlContent.replace(
            /url\(["']?\/\/([^"')]+)["']?\)/g,
            'url("https://$1")'
        );

        // 4. Fix CSS url() in style attributes with HTML-encoded quotes
        function fixStyleUrls(match, styleContent) {
            // Decode HTML entities first
            styleContent = htmlUnescape(styleContent);

            // Fix protocol-relative URLs in CSS url()
            styleContent = styleContent.replace(
                /url\(["']?\/\/([^"')]+)["']?\)/g,
                'url("https://$1")'
            );

            // Fix relative URLs in CSS url()
            styleContent = styleContent.replace(
                /url\(["']?\/([^"')]+)["']?\)/g,
                (match, url) => {
                    return `url("${urlJoin(currentUrl, url)}")`;
                }
            );

            // Re-encode for HTML
            styleContent = htmlEscape(styleContent, true);

            return `style="${styleContent}"`;
        }

        // Apply the style attribute fix for double quotes
        htmlContent = htmlContent.replace(/style="([^"]*)"/g, fixStyleUrls);

        // 5. Handle style attributes with single quotes (FIXED VERSION)
        function fixSingleQuoteStyle(match, styleContent) {
            // Decode HTML entities first
            styleContent = htmlUnescape(styleContent);

            // Fix protocol-relative URLs in CSS url()
            styleContent = styleContent.replace(
                /url\(["']?\/\/([^"')]+)["']?\)/g,
                'url("https://$1")'
            );

            // Fix relative URLs in CSS url()
            styleContent = styleContent.replace(
                /url\(["']?\/([^"')]+)["']?\)/g,
                (match, url) => {
                    return `url("${urlJoin(currentUrl, url)}")`;
                }
            );

            // Re-encode for HTML but keep single quotes
            styleContent = htmlEscape(styleContent, false);

            return `style='${styleContent}'`;
        }

        // Apply single quote style fix
        htmlContent = htmlContent.replace(
            /style='([^']*)'/g,
            fixSingleQuoteStyle
        );

        return htmlContent;
    }
    const content = savePageWithAllResourcesFixed(page);

    // Capture MHTML snapshot using CDP
    const client = await page.context().newCDPSession(page);
    const snapshotResult = await client.send("Page.captureSnapshot", {
        format: "mhtml", // Explicitly specify MHTML format
    });
    const mhtml = snapshotResult.data;
    console.log("I have considered mhtml data...");

    return {
        content: mhtml,
        url: await page.url(),
        width,
        height,
    };
});
/**
 * Wait for page content to stabilize by checking DOM changes
 */
async function _waitForContentStability(page, remainingTime = 30) {
    if (remainingTime <= 0) {
        return;
    }

    const maxChecks = Math.min(Math.floor(remainingTime), 20); // Check every ~1.5 seconds
    let stableCount = 0;
    const requiredStableChecks = 3; // Need 3 consecutive stable checks

    let previousContentHash = null;

    for (let check = 0; check < maxChecks; check++) {
        try {
            // Get a hash of key page content indicators
            const contentIndicators = await page.evaluate(() => {
                const body = document.body;
                const images = document.querySelectorAll("img");
                const loadedImages = Array.from(images).filter(
                    (img) => img.complete
                );

                return {
                    bodyHeight: body ? body.scrollHeight : 0,
                    imageCount: images.length,
                    loadedImageCount: loadedImages.length,
                    readyState: document.readyState,
                    hasMainContent: !!document.querySelector(
                        "main, #main, .main, #content, .content, article"
                    ),
                };
            });

            // Create a simple hash of the content state
            const contentHash = `${contentIndicators.bodyHeight}_${contentIndicators.imageCount}_${contentIndicators.loadedImageCount}_${contentIndicators.readyState}`;

            if (contentHash === previousContentHash) {
                stableCount += 1;
                console.log(
                    `Content stable check ${stableCount}/${requiredStableChecks}`
                );

                if (stableCount >= requiredStableChecks) {
                    console.log("Content stability achieved");
                    return;
                }
            } else {
                stableCount = 0; // Reset counter if content changed
                console.log("Content changed, resetting stability counter");
            }

            previousContentHash = contentHash;

            // Wait before next check
            await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
            console.log(`Content stability check failed: ${error}`);
            break;
        }
    }
}

ipcMain.handle("waitForPage", async () => {
    try {
        if (!page) return { success: false, message: "Page not initialized" };

        // Initial wait
        await page.waitForTimeout(2000);

        // Progressive strategy with fallbacks
        const strategies = [
            { state: "domcontentloaded", timeout: 10000 },
            { state: "load", timeout: 10000 },
            { state: "networkidle", timeout: 10000 },
        ];

        let lastError = null;
        let successfulStrategy = null;

        for (let i = 0; i < strategies.length; i++) {
            const strategy = strategies[i];
            const t0 = Date.now();

            try {
                await page.waitForLoadState(strategy.state, {
                    timeout: strategy.timeout,
                });
                const loadTime = Date.now() - t0;
                console.log(
                    `Page loaded using strategy ${i + 1}, ${
                        strategy.state
                    }, ${loadTime}ms`
                );
                successfulStrategy = `${strategy.state} (${loadTime}ms)`;
                break; // Success, exit the loop
            } catch (error) {
                console.log(`Strategy ${i + 1} failed: ${error.message}`);
                if (strategy.state === "networkidle") {
                    console.log("Falling back to content stability check...");
                    await _waitForContentStability(page);
                }
                lastError = error;
            }
        }

        return {
            success: true,
            message: successfulStrategy
                ? `Loaded with ${successfulStrategy}`
                : "Loaded with content stability fallback",
        };
    } catch (err) {
        console.error("waitForPage error:", err);
        return { success: false, message: err.message };
    }
});

// ipcMain.handle("waitForPage", async () => {
//     try {
//         if (!page) return { success: false, message: "Page not initialized" };

//         await page.waitForTimeout(2000);
//         await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
//         await page.waitForLoadState("load", { timeout: 10000 });
//         await page.waitForLoadState("networkidle", { timeout: 10000 });

//         return { success: true };
//     } catch (err) {
//         return { success: false, message: err.message };
//     }
// });
// @ts-ignore
/**
 * Perform the recorded action on the found element with fallback mechanisms
 */
const performClick = async (element, page) => {
    // first hover the element, then click to make it look like human
    const box = await element.boundingBox();
    let x, y;
    if (box) {
        x = box.x + box.width / 2;
        y = box.y + box.height / 2;
        await page.mouse.move(x, y);
    }

    try {
        await element.click({ force: true, timeout: 5000 });
        console.log("Clicked via ElementHandle.click()");
        return true;
    } catch (err) {
        console.log(
            `Direct click failed (${err}); falling back to mouse coords`
        );
        if (box) {
            await page.mouse.click(x, y);
            console.log(`Clicked at page coords (${x}, ${y})`);
            return true;
        } else {
            console.log("call click----------");
            await element.evaluate("el => { el.focus(); el.click(); }");
            console.log("Clicked via focus + DOM click");
            return true;
        }
    }
    return false;
};
const performTyped = async (element, page, keyboard_input) => {
    // first click the element and make it focused
    await performClick(element, page);
    await new Promise((resolve) => setTimeout(resolve, 500)); // sleep 1 second

    try {
        // Use platform-appropriate select all
        if (os.platform() === "darwin") {
            // macOS
            await page.keyboard.press("Meta+a"); // Use Meta instead of Command
        } else {
            // Windows/Linux
            await page.keyboard.press("Control+a");
        }

        await new Promise((resolve) => setTimeout(resolve, 500)); // sleep 1 second
        await page.keyboard.press("Backspace");
        await new Promise((resolve) => setTimeout(resolve, 500)); // sleep 1 second

        // Type the new content
        await page.keyboard.type(keyboard_input, { delay: 50 });
        console.log(`Typed '${keyboard_input}' via keyboard fallback`);
        return true;
    } catch (fallback_err) {
        console.log(`Keyboard fallback also failed: ${fallback_err}`);
        return false;
    }
};
const performEnter = async (element, page) => {
    try {
        // first click on the element to make it focused
        await performClick(element, page);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // sleep 1 second
        await page.keyboard.press("Enter");
        console.log("Pressed Enter on element");
        return true;
    } catch (err) {
        console.log(`Direct enter failed (${err}); falling back to keyboard`);
        // pass - no fallback action, just log the error
    }
    return false;
};

const scrollToElement = async (ele) => {
    const box = await ele.boundingBox();

    const inViewport = await ele.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );
    });
    console.log(`Element in viewport: ${inViewport}`);

    // await ele.scrollIntoViewIfNeeded({timeout: 5000});
    if (!inViewport) {
        await ele.evaluate((el) => {
            const rect = el.getBoundingClientRect();
            window.scrollTo(0, window.pageYOffset + rect.top - 500); // 100px offset
        });
    }
};
async function performActionNew(event, actionObj) {
    try {
        let screenshotBuffer = await page.screenshot({
            type: "png",
        });
        if (!actionObj.final_xpath) {
            return {
                success: false,
                reason: "no_xpath",
                message: "No XPath provided",
                elementInfo: null,
                img: screenshotBuffer.toString("base64"),
            };
        }

        const elements = await page
            .locator(actionObj.final_xpath)
            .elementHandles();

        if (elements.length === 0) {
            return {
                success: false,
                reason: "no_elements",
                message: "No elements matched the given XPath",
                elementInfo: null,
                img: screenshotBuffer.toString("base64"),
            };
        }
        console.log("finalxpath--->", actionObj.final_xpath);
        console.log("total element", elements.length);
        for (const ele of elements) {
            if (await ele.isEnabled()) {
                const box = await ele.boundingBox();
                scrollToElement(ele);
                const actionType = actionObj.action;
                const keyboardInput = actionObj.keyboard_input || "";
                if (actionType === "click") {
                    performClick(ele, page);
                    console.log("click");
                } else if (actionType === "typed" || actionType === "type") {
                    performTyped(ele, page, keyboardInput);
                    console.log("type");
                } else if (actionType === "enter") {
                    performEnter(ele, page);
                    console.log("enter");
                }
                //      else if (actionType === "scroll") {
                // }
                else {
                    console.log(actionType, "not typed support");
                }
                console.log("-------------", box);

                return { elementInfo: { box }, success: true };
            }
        }
    } catch {}
}
ipcMain.handle("performActionNew", async (event, actionObj) => {
    const actionResponse = await performActionNew(event, actionObj);
    return actionResponse;
});

ipcMain.handle("close-playwright", async () => {
    try {
        if (playwrightBrowser) {
            await playwrightBrowser.close();
            playwrightBrowser = null;
            currentUrl = null;
            page = null;
            return { success: true, message: "Playwright browser closed" };
        }
        return { success: false, message: "No browser to close" };
    } catch (error) {
        console.error("Error closing Playwright:", error);
        return { success: false, message: error.message };
    }
});

app.setName("AgentAct");
app.whenReady().then(() => {
    win.once("ready-to-show", () => {
        if (!isDev) {
            autoUpdater.checkForUpdatesAndNotify();
        }
    });

    autoUpdater.on("checking-for-update", () => {
        console.log("Checking for updates...");
    });

    autoUpdater.on("update-available", (info) => {
        console.log("Update available:", info.version);
        dialog.showMessageBox(win, {
            type: "info",
            title: "Update Available",
            message: `A new version (${info.version}) is available. Downloading now...`,
        });
    });

    autoUpdater.on("update-not-available", (info) => {
        console.log("Update not available:", info.version);
    });

    autoUpdater.on("error", (err) => {
        console.error("Error in auto-updater:", err);
        dialog.showMessageBox(win, {
            type: "error",
            title: "Update Error",
            message: `Failed to check for updates: ${err.message}`,
        });
    });

    autoUpdater.on("download-progress", (progress) => {
        console.log(
            `Download speed: ${
                progress.bytesPerSecond
            } - Downloaded ${progress.percent.toFixed(2)}%`
        );
    });

    autoUpdater.on("update-downloaded", (info) => {
        console.log("Update downloaded:", info.version);
        dialog
            .showMessageBox(win, {
                type: "info",
                title: "Update Ready",
                message: "Update downloaded. Restart app to apply the update?",
                buttons: ["Restart", "Later"],
            })
            .then((result) => {
                if (result.response === 0) {
                    autoUpdater.quitAndInstall();
                }
            });
    });
    createWindow();
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        // Close the express server when app quits
        if (server) {
            server.close();
        }
        app.quit();
    }
});

app.on("before-quit", () => {
    if (server) {
        server.close();
    }
});

ipcMain.on("ping", (event, arg) => {
    event.reply("pong", "Pong received: " + arg);
});

ipcMain.handle("api-fetch", async (_event, url, options) => {
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return { ok: true, data };
    } catch (error) {
        return { ok: false, error: error.message };
    }
});
