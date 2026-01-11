const fs = require('fs');
const path = require('path');

// Create simple SVG icons and convert to PNG using canvas (if available)
const createSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.1}"/>
  <text x="50%" y="50%" font-size="${size * 0.5}" text-anchor="middle" dominant-baseline="central" fill="white">🎾</text>
</svg>
`;

// Write SVG files
fs.writeFileSync(
  path.join(__dirname, '../public/icon-192.svg'),
  createSVG(192)
);

fs.writeFileSync(
  path.join(__dirname, '../public/icon-512.svg'),
  createSVG(512)
);

console.log('SVG icons created!');
console.log('Note: Convert these to PNG using an online tool or ImageMagick:');
console.log('  convert icon-192.svg icon-192.png');
console.log('  convert icon-512.svg icon-512.png');
