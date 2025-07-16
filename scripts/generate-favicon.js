// This script can be used to generate favicon.ico from the SVG
// You would need to install a package like 'sharp' or use online tools

const fs = require('fs');
const path = require('path');

// Read the SVG favicon
const svgContent = fs.readFileSync(path.join(__dirname, '../public/images/favicon.svg'), 'utf8');

console.log('SVG Favicon content:');
console.log(svgContent);
console.log('\nTo convert to ICO:');
console.log('1. Use online tool: https://convertio.co/svg-ico/');
console.log('2. Or use ImageMagick: convert favicon.svg favicon.ico');
console.log('3. Or use online favicon generator: https://favicon.io/');

// For automated conversion, you can use sharp (uncomment after installing: npm install sharp)

const sharp = require('sharp');

async function generateFavicon() {
  try {
    // Generate different sizes for favicon
    const sizes = [16, 32, 48];
    
    for (const size of sizes) {
      await sharp(path.join(__dirname, '../public/images/favicon.svg'))
        .resize(size, size)
        .png()
        .toFile(path.join(__dirname, `../public/favicon-${size}x${size}.png`));
      
      console.log(`Generated favicon-${size}x${size}.png`);
    }
    
    // Generate main favicon.ico (you'll need to use a tool like png-to-ico)
    console.log('\nPNG files generated. Use an online tool to convert to .ico format');
    console.log('Or install png-to-ico: npm install png-to-ico');
    
  } catch (error) {
    console.error('Error generating favicon:', error);
  }
}

// Uncomment to run
 generateFavicon();


// Alternative method using canvas (for Node.js environments)
function generateFaviconCanvas() {
  console.log('\nAlternative: Generate favicon using HTML5 Canvas');
  console.log('Copy this code to a browser console or HTML file:');
  
  const canvasCode = `
// Create canvas
const canvas = document.createElement('canvas');
canvas.width = 32;
canvas.height = 32;
const ctx = canvas.getContext('2d');

// Draw neon-style favicon
ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, 32, 32);

// Draw neon circle
const gradient = ctx.createLinearGradient(0, 0, 32, 32);
gradient.addColorStop(0, '#00ffff');
gradient.addColorStop(0.5, '#ff00ff');
gradient.addColorStop(1, '#ffff00');

ctx.strokeStyle = gradient;
ctx.lineWidth = 2;
ctx.beginPath();
ctx.arc(16, 16, 12, 0, 2 * Math.PI);
ctx.stroke();

// Draw 'N' letter
ctx.fillStyle = gradient;
ctx.font = 'bold 14px Arial';
ctx.textAlign = 'center';
ctx.fillText('N', 16, 20);

// Convert to data URL and download
const dataURL = canvas.toDataURL('image/png');
const link = document.createElement('a');
link.download = 'favicon.png';
link.href = dataURL;
link.click();

console.log('Favicon generated and downloaded!');
`;

  console.log(canvasCode);
}

generateFaviconCanvas();

// Instructions for manual favicon creation
console.log('\n=== MANUAL FAVICON CREATION INSTRUCTIONS ===');
console.log('1. Open the SVG file in a graphics editor (Inkscape, Adobe Illustrator, etc.)');
console.log('2. Export as PNG at these sizes: 16x16, 32x32, 48x48');
console.log('3. Use an online ICO converter or tool like:');
console.log('   - https://favicon.io/');
console.log('   - https://convertio.co/png-ico/');
console.log('   - https://www.icoconverter.com/');
console.log('4. Place the generated favicon.ico in the public/ directory');
console.log('5. Update HTML files to include favicon links');

// Generate HTML favicon links
const faviconLinks = `
<!-- Add these lines to the <head> section of your HTML files -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
`;

console.log('\n=== HTML FAVICON LINKS ===');
console.log(faviconLinks);

// Generate web manifest for PWA support
const webManifest = {
  "name": "Neon Spin Slot Machine",
  "short_name": "NeonSpin",
  "icons": [
    {
      "src": "/favicon-16x16.png",
      "sizes": "16x16",
      "type": "image/png"
    },
    {
      "src": "/favicon-32x32.png",
      "sizes": "32x32",
      "type": "image/png"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ],
  "theme_color": "#00ffff",
  "background_color": "#000000",
  "display": "standalone",
  "start_url": "/"
};

// Write web manifest
fs.writeFileSync(
  path.join(__dirname, '../public/site.webmanifest'),
  JSON.stringify(webManifest, null, 2)
);

console.log('\n✅ Generated site.webmanifest for PWA support');
console.log('📁 File saved to: public/site.webmanifest');