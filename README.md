# toptal-resume-downloader

A powerful Node.js script that downloads clean, professional PDFs from web pages by automatically removing unwanted navigation elements, headers, footers, and UI components.

## ✨ Features

- **🧹 Smart Element Removal**: Automatically removes navigation tabs, headers, footers, and UI clutter
- **📱 Multi-layered Cleanup**: Uses CSS injection + JavaScript removal for maximum effectiveness
- **🎯 Targeted Removal**: Specifically designed for resume/profile pages with tab navigation
- **⚡ Fast Processing**: Efficient element detection and removal
- **🔧 Manual Bypass**: Alternative method for different page structures
- **📄 High-Quality PDFs**: Generates clean, print-ready documents

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup
1. **Clone or download the script**
2. **Install dependencies:**
   ```bash
   npm install puppeteer
   ```
   or
   ```bash
   yarn add puppeteer
   ```

3. **Save the script** as `downloadPage.js`

## 🚀 Usage

### Basic Usage
```bash
node downloadPage.js
```

### What the script does:
1. **Launches Chrome browser** in headless mode
2. **Navigates to target URL** (currently set to a Toptal profile)
3. **Waits for page load** and content rendering
4. **Removes unwanted elements:**
   - Navigation tabs (Intro, Experience, Portfolio, Certifications)
   - Headers and footers
   - "Show Less" buttons
   - Branding elements
5. **Generates PDF** with clean formatting
6. **Saves to desktop** with timestamp

## ⚙️ Configuration

### Change Target URL
```javascript
// Edit this line in the script
const url = 'YOUR_TARGET_URL_HERE';
```

### Customize PDF Settings
```javascript
const pdfOptions = {
  format: 'A4',           // Page size
  printBackground: true,   // Include background colors
  margin: {
    top: '20px',
    right: '20px',
    bottom: '20px',
    left: '20px'
  }
};
```

### Modify Output Location
```javascript
// Change the output path
const outputPath = path.join(os.homedir(), 'Desktop', `clean-resume-${timestamp}.pdf`);
```

## 🎯 Element Removal System

The script uses **4 layers of element removal**:

### 1. CSS Injection (Most Powerful)
```css
[data-testid="resume-page-tabs"] { display: none !important; }
[class*="MuiTabs-root"] { display: none !important; }
button[role="tab"] { display: none !important; }
```

### 2. JavaScript Element Removal
```javascript
// Removes elements by data attributes
document.querySelector('[data-testid="resume-page-tabs"]').remove();
```

### 3. Content-Based Detection
```javascript
// Finds elements by text content
if (text.includes('Intro') && text.includes('Experience')) {
  element.style.display = 'none';
}
```

### 4. Comprehensive Selector Sweep
```javascript
// Multiple selector patterns
const selectors = [
  '[class*="MuiTabs"]',
  '[role="tablist"]',
  'button[role="tab"]'
];
```

## 🛡️ Manual Bypass Mode

If the automatic detection fails, uncomment the manual bypass section:

```javascript
// Uncomment these lines for manual bypass
// await bypassCFChallenge(page);
// await manualRemoveElements(page);
```

### When to use Manual Mode:
- Page has CloudFlare protection
- Custom navigation structure
- Non-standard element classes
- Complex JavaScript rendering

## 📋 Removed Elements

The script automatically removes:

### Navigation Elements
- ✅ Tab navigation (Intro, Experience, Portfolio, Certifications)
- ✅ Tab indicators and highlights
- ✅ Navigation buttons

### UI Components
- ✅ Headers and site branding
- ✅ Footers and copyright notices
- ✅ "Show Less" buttons
- ✅ Contact information overlays

### Platform-Specific
- ✅ Toptal branding elements
- ✅ MUI (Material-UI) components
- ✅ React component artifacts

## 🔧 Troubleshooting

### Common Issues

#### 1. **"Element not found" errors**
```bash
# Solution: Check if URL is accessible
curl -I YOUR_URL_HERE
```

#### 2. **PDF is blank or incomplete**
```javascript
// Add longer wait time
await page.waitForTimeout(5000); // Wait 5 seconds
```

#### 3. **Elements still visible in PDF**
```javascript
// Add custom selectors to removal list
const customSelectors = [
  '.your-custom-class',
  '[data-your-attribute="value"]'
];
```

#### 4. **Page won't load**
```javascript
// Increase timeout
await page.goto(url, { 
  waitUntil: 'networkidle2', 
  timeout: 60000 // 60 seconds
});
```

### Debug Mode
Enable debug logging:
```javascript
// Add at the top of script
const DEBUG = true;

// Use throughout script
if (DEBUG) console.log('Debug info here');
```

## 🎨 Customization Examples

### Remove Custom Elements
```javascript
// Add to the removal section
const customElements = document.querySelectorAll('.your-class');
customElements.forEach(el => el.remove());
```

### Change PDF Format
```javascript
const pdfOptions = {
  format: 'Letter',        // US Letter size
  landscape: true,         // Landscape orientation
  printBackground: false,  // No background colors
  scale: 0.8              // Smaller scale
};
```

### Add Custom CSS
```javascript
await page.addStyleTag({
  content: `
    body { font-family: Arial, sans-serif; }
    .custom-class { display: none; }
  `
});
```

## 📊 Performance Tips

### Optimize for Speed
```javascript
// Disable images for faster loading
await page.setRequestInterception(true);
page.on('request', (req) => {
  if(req.resourceType() == 'image'){
    req.abort();
  } else {
    req.continue();
  }
});
```

### Reduce Memory Usage
```javascript
// Close browser after each PDF
await browser.close();
```

## 🔒 Security Considerations

- Script runs in headless mode (no visible browser)
- No data is stored or transmitted
- Only accesses specified URLs
- Downloads saved locally only

## 📝 File Structure

```
project/
├── downloadPage.js          # Main script
├── package.json              # Dependencies
├── README.md                 # This file
└── output/                   # Generated PDFs (optional)
    └── clean-resume-*.pdf
```

## 🤝 Contributing

### Adding New Element Selectors
1. Identify the element in browser DevTools
2. Add selector to appropriate removal section
3. Test with target website
4. Update documentation

### Reporting Issues
Include:
- Target URL (if public)
- Error messages
- Browser console output
- Operating system

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Puppeteer](https://pptr.dev/)
- Designed for resume/profile page cleaning
- Optimized for Toptal profiles (easily adaptable)

---

**⚡ Quick Start:**
```bash
npm install puppeteer
node downloadPage.js
```

**🎯 Result:** Clean, professional PDF saved to your Desktop!