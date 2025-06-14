const puppeteer = require("puppeteer");
const path = require("path");

async function downloadResumeAsPDF() {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=VizDisplayCompositor",
        "--disable-web-security",
        "--disable-features=TranslateUI",
        "--disable-ipc-flooding-protection",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
        "--disable-client-side-phishing-detection",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-default-apps",
        "--disable-popup-blocking",
        "--disable-translate",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-field-trial-config",
        "--disable-back-forward-cache",
        "--disable-background-networking",
        "--enable-features=NetworkService,NetworkServiceInProcess",
        "--disable-component-update",
        "--disable-default-apps",
        "--disable-domain-reliability",
        "--disable-extensions",
        "--disable-print-preview",
        "--disable-speech-api",
        "--disable-sync",
        "--hide-scrollbars",
        "--mute-audio",
        "--no-pings",
        "--use-mock-keychain",
        "--disable-gpu",
      ],
      ignoreDefaultArgs: ["--enable-automation"],
      defaultViewport: null,
    });

    const page = await browser.newPage();

    // Remove automation indicators
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
    });

    // Set realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Set additional headers
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "max-age=0",
    });

    await page.setViewport({
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
    });

    console.log("Navigating to the resume page...");

    await page.goto(
      "https://talent.toptal.com/resume/developers/guilherme-natal",
      {
        waitUntil: "domcontentloaded",
        timeout: 120000, // 2 minutes
      }
    );

    console.log("Page loaded, checking for Cloudflare challenge...");

    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Check if we're on a Cloudflare challenge page
    const title = await page.title();
    const url = await page.url();

    console.log(`Current page title: ${title}`);
    console.log(`Current URL: ${url}`);

    // If we detect Cloudflare challenge, wait longer
    if (
      title.includes("Just a moment") ||
      title.includes("Cloudflare") ||
      url.includes("cf-browser-verification")
    ) {
      console.log("Cloudflare challenge detected, waiting for completion...");

      // Wait up to 30 seconds for Cloudflare to complete
      await page
        .waitForFunction(
          () =>
            !document.title.includes("Just a moment") &&
            !document.title.includes("Cloudflare"),
          { timeout: 30000 }
        )
        .catch(() => {
          console.log(
            "Cloudflare challenge may still be active, proceeding anyway..."
          );
        });

      // Additional wait after challenge
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Check if we successfully reached the resume page
    const finalUrl = await page.url();
    if (!finalUrl.includes("talent.toptal.com/resume")) {
      throw new Error(
        "Failed to reach the resume page, might be blocked by Cloudflare"
      );
    }

    console.log(
      "Successfully bypassed protection, handling page interactions..."
    );

    try {
      console.log("Looking for cookie banner...");
      await page.waitForSelector('[data-testid="Banner:PRIVACY_SHIELD"]', {
        timeout: 5000,
      });
      console.log("Cookie banner found, dismissing...");

      await page.click('[data-testid="Banner:PRIVACY_SHIELD"] button');
      console.log("Cookie banner dismissed");

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log("No cookie banner found or already dismissed");
    }

    await page.evaluate(() => {
      const footerElement = document.querySelector(
        ".Layout___StyledPageFooter-sc-1uaeije-5"
      );
      if (footerElement) {
        footerElement.remove();
        console.log("Removed footer element");
      }

      const muiElement = document.querySelector(".mui-fixed");
      if (muiElement) {
        muiElement.remove();
        console.log("Removed mui-fixed element");
      }

      const tabsElement = document.querySelector(
        '[data-testid="resume-page-tabs"]'
      );
      if (tabsElement) {
        tabsElement.remove();
        console.log("Removed tabs element by data-testid");
      } else {
        console.log("Tabs element not found");
      }
    });
    console.log("Scrolling to load all content...");

    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    console.log("Finished scrolling, waiting for lazy content to load...");

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Scroll back to top for better PDF appearance
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    // Wait a moment after scrolling back to top
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Click all "See More" buttons to expand content
    console.log('Looking for "See More" buttons to expand all content...');

    // Custom function to find and click all expansion buttons
    const expandAllSections = await page.evaluate(() => {
      const clickedButtons = [];

      // Find all buttons, links, and clickable elements
      const allClickableElements = document.querySelectorAll(
        'button, a, [role="button"], span[class*="clickable"], div[class*="clickable"], [onclick]'
      );

      for (const element of allClickableElements) {
        const text = element.textContent || element.innerText || "";

        // Check for "See X More" buttons
        if (
          (text.toLowerCase().includes("see") &&
            text.toLowerCase().includes("more")) ||
          // Check for "+X more" buttons (like "+11 more", "+7 more", etc.)
          /^\+\d+\s+more$/i.test(text.trim()) ||
          // Check for other expansion patterns
          text.toLowerCase().includes("show more") ||
          text.toLowerCase().includes("expand") ||
          text.toLowerCase().includes("view more")
        ) {
          try {
            // Scroll element into view first
            element.scrollIntoView({ behavior: "smooth", block: "center" });

            // Wait a moment for scroll
            setTimeout(() => {
              element.click();
              clickedButtons.push(text.trim());
            }, 100);
          } catch (error) {
            console.log(`Could not click element: ${text}`);
          }
        }
      }

      return new Promise((resolve) => {
        setTimeout(() => resolve(clickedButtons), 2000);
      });
    });

    const clickedButtons = await expandAllSections;

    if (clickedButtons.length > 0) {
      console.log(
        `Clicked ${clickedButtons.length} expansion buttons:`,
        clickedButtons
      );

      // Wait for content to load after clicking buttons
      await new Promise((resolve) => setTimeout(resolve, 4000));

      // Try clicking expansion buttons again (sometimes they appear after first expansion)
      console.log("Looking for additional expansion buttons...");

      const secondPassButtons = await page.evaluate(() => {
        const moreButtons = [];
        const elements = document.querySelectorAll(
          'button, a, [role="button"], span, div'
        );

        for (const element of elements) {
          const text = element.textContent || element.innerText || "";

          // Look specifically for "+number more" pattern
          if (/^\+\d+\s+more$/i.test(text.trim())) {
            try {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => {
                element.click();
                moreButtons.push(text.trim());
              }, 100);
            } catch (error) {
              console.log(`Could not click: ${text}`);
            }
          }
        }

        return new Promise((resolve) => {
          setTimeout(() => resolve(moreButtons), 2000);
        });
      });

      const secondPassClicked = await secondPassButtons;

      if (secondPassClicked.length > 0) {
        console.log(
          `Second pass clicked ${secondPassClicked.length} more buttons:`,
          secondPassClicked
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      await page.evaluate(() => {
        const allElements = document.querySelectorAll("span");
        let hiddenCount = 0;

        for (const element of allElements) {
          const text = element.textContent || element.innerText || "";
          if (text.includes("Show Less")) {
            element.style.display = "none";
            hiddenCount++;
          }
        }
        return hiddenCount;
      });

      // Scroll again to ensure all new content is loaded
      console.log("Re-scrolling to load all newly expanded content...");
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 150); // Slightly slower scroll to ensure content loads
        });
      });

      // Wait for lazy content and scroll back to top
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else {
      console.log("No expansion buttons found or all content already expanded");
    }

    console.log("All expansions complete, generating multi-page PDF...");

    // Generate PDF with standard multi-page format
    const pdfPath = path.join(__dirname, "guilherme-natal-resume-complete.pdf");

    await page.pdf({
      path: pdfPath,
      format: "A4", // Standard A4 format for multi-page
      printBackground: true,
      margin: {
        top: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
        right: "0.5in",
      },
      displayHeaderFooter: false,
      // Remove single page restrictions
      preferCSSPageSize: false,
    });

    console.log(`Complete multi-page resume PDF saved at: ${pdfPath}`);
  } catch (error) {
    console.error("Error occurred:", error.message);

    if (
      error.message.includes("Cloudflare") ||
      error.message.includes("blocked")
    ) {
      console.error("\nCloudflare Protection Tips:");
      console.error("1. Try running the script multiple times");
      console.error("2. Use a VPN or different IP address");
      console.error("3. Wait a few minutes between attempts");
      console.error(
        "4. The browser window will stay open - you can manually solve any challenges"
      );
    }
  } finally {
    // Keep browser open for manual intervention if needed
    if (browser) {
      console.log(
        "Browser will remain open for 30 seconds for manual intervention..."
      );
      await new Promise((resolve) => setTimeout(resolve, 30000));
      await browser.close();
    }
  }
}

async function downloadWithManualBypass() {
  const browser = await puppeteer.launch({
    headless: false, // Must be false for manual intervention
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();

  console.log("Browser opened. Please manually:");
  console.log(
    "1. Navigate to: https://talent.toptal.com/resume/developers/guilherme-natal"
  );
  console.log("2. Complete any Cloudflare challenges");
  console.log("3. Wait for the resume page to load completely");
  console.log("4. Press Enter in this terminal when ready...");

  // Wait for user input
  await new Promise((resolve) => {
    process.stdin.once("data", () => {
      resolve();
    });
  });

  console.log("Processing page...");

  // Dismiss cookie banner if present
  try {
    console.log("Checking for cookie banner...");
    const cookieBanner = await page.$('[data-testid="Banner:PRIVACY_SHIELD"]');
    if (cookieBanner) {
      console.log("Dismissing cookie banner...");
      await page.click('[data-testid="Banner:PRIVACY_SHIELD"] button');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.log("No cookie banner to dismiss");
  }

  // Scroll to load all lazy content
  console.log("Scrolling to load all content...");
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });

  // Wait for content to load then scroll back to top
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Expand all "See More" sections and "+X more" buttons
  console.log("Expanding all sections...");
  const expandedSections = await page.evaluate(() => {
    const clickedButtons = [];
    const allElements = document.querySelectorAll(
      'button, a, [role="button"], span, div'
    );

    for (const element of allElements) {
      const text = element.textContent || element.innerText || "";

      // Look for various expansion patterns
      if (
        (text.toLowerCase().includes("see") &&
          text.toLowerCase().includes("more")) ||
        /^\+\d+\s+more$/i.test(text.trim()) ||
        text.toLowerCase().includes("show more") ||
        text.toLowerCase().includes("expand")
      ) {
        try {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => {
            element.click();
            clickedButtons.push(text.trim());
          }, 100);
        } catch (error) {
          console.log(`Could not click: ${text}`);
        }
      }
    }

    return new Promise((resolve) => {
      setTimeout(() => resolve(clickedButtons), 2000);
    });
  });

  const firstPassButtons = await expandedSections;

  if (firstPassButtons.length > 0) {
    console.log(
      `First pass - expanded ${firstPassButtons.length} sections:`,
      firstPassButtons
    );
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Second pass for any newly appeared buttons
    const secondPass = await page.evaluate(() => {
      const moreButtons = [];
      const elements = document.querySelectorAll(
        'button, a, [role="button"], span, div'
      );

      for (const element of elements) {
        const text = element.textContent || element.innerText || "";
        if (/^\+\d+\s+more$/i.test(text.trim())) {
          try {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => {
              element.click();
              moreButtons.push(text.trim());
            }, 100);
          } catch (error) {
            console.log(`Could not click: ${text}`);
          }
        }
      }

      return new Promise((resolve) => {
        setTimeout(() => resolve(moreButtons), 2000);
      });
    });

    const secondPassButtons = await secondPass;

    if (secondPassButtons.length > 0) {
      console.log(
        `Second pass - expanded ${secondPassButtons.length} more sections:`,
        secondPassButtons
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Hide "Show Less" buttons
    console.log('Hiding "Show Less" buttons for clean PDF...');
    await page.evaluate(() => {
      const allElements = document.querySelectorAll("span");
      let hiddenCount = 0;

      for (const element of allElements) {
        const text = element.textContent || element.innerText || "";
        if (text.includes("Show Less")) {
          element.style.display = "none";
          hiddenCount++;
        }
      }
      return hiddenCount;
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Final scroll to ensure all content is loaded
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 150);
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("Generating multi-page PDF...");

  const pdfPath = path.join(
    __dirname,
    "guilherme-natal-resume-manual-complete.pdf"
  );
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "0.5in",
      bottom: "0.5in",
      left: "0.5in",
      right: "0.5in",
    },
    displayHeaderFooter: false,
    preferCSSPageSize: false,
  });

  console.log(`PDF saved at: ${pdfPath}`);
  await browser.close();
}

// Run the function
if (require.main === module) {
  console.log("Choose bypass method:");
  console.log("1. Automatic bypass (default)");
  console.log("2. Manual bypass (recommended for Cloudflare)");

  const method = process.argv[2] || "1";

  if (method === "2") {
    downloadWithManualBypass()
      .then(() => console.log("Manual bypass completed"))
      .catch(console.error);
  } else {
    downloadResumeAsPDF()
      .then(() => console.log("Automatic bypass completed"))
      .catch(console.error);
  }
}

module.exports = {
  downloadResumeAsPDF,
  downloadWithManualBypass,
};
