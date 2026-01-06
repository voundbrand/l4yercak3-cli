#!/usr/bin/env node

/**
 * Logo display module
 * Shows the L4YERCAK3 logo with 3D font and rainbow gradient
 * Combined with building/plumbing metaphor
 */

const chalk = require('chalk');
const figlet = require('figlet');

// Rainbow gradient colors
const rainbow = [
  '#FF1493', '#FF69B4', '#FF00FF', '#9F7AEA',
  '#8B5CF6', '#3B82F6', '#00BFFF', '#10B981',
  '#F59E0B', '#EF4444', '#FF6B6B'
];

// Helper function for character-by-character gradient
function applyCharGradient(line, colors) {
  let result = '';
  for (let i = 0; i < line.length; i++) {
    const colorIndex = Math.min(
      Math.floor((i / line.length) * colors.length),
      colors.length - 1
    );
    result += chalk.hex(colors[colorIndex])(line[i]);
  }
  return result;
}

// Building/plumbing metaphor
const buildingMetaphor = [
  "                                                                                                    ",
  "                                    ╔═══════════════════════════╗                                  ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║  ← Floor 5: Landing Page        ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║     mywebsite.com                ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║                                  ",
  "                                    ╠═══════════════════════════╣                                  ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║  ← Floor 4: Client Portal        ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║     clients.mysite.com            ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║                                  ",
  "                                    ╠═══════════════════════════╣                                  ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║  ← Floor 3: Mobile App           ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║     iOS + Android                ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║                                  ",
  "                                    ╠═══════════════════════════╣                                  ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║  ← Floor 2: E-Commerce            ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║     shop.mysite.com              ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║                                  ",
  "                                    ╠═══════════════════════════╣                                  ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║  ← Floor 1: Analytics            ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║     admin.mysite.com              ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║                                  ",
  "                                    ╠═══════════════════════════╣                                  ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║  ← Ground: API Layer             ",
  "                                    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║     REST • GraphQL • gRPC        ",
  "                                    ╚═══════════════════════════╝                                  ",
  "                                          │ │ │ │ │ │ │ │ │ │ │                                    ",
  "                                          │ │ │ │ │ │ │ │ │ │ │                                    ",
  "                                          │ │ │ │ │ │ │ │ │ │ │                                    ",
  "  ╔═══════════════════════════════════════════════════════════════════════════════════════╗      ",
  "  ║                                                                                           ║      ",
  "  ║  💾 Database  🔐 Auth  💳 Stripe  📧 Email  🔄 Workflows  📇 CRM  📊 Analytics  🔔      ║      ",
  "  ║                                                                                           ║      ",
  "  ║                    🏗️  THE PLUMBING - l4yercak3 PLATFORM  🏗️                            ║      ",
  "  ║                                                                                           ║      ",
  "  ╚═══════════════════════════════════════════════════════════════════════════════════════╝      ",
  "                                                                                                    ",
  "     🍰 icing on the l4yercak3 - connect your floors to the plumbing 🍰                          ",
  "                                                                                                    "
];

/**
 * Display the L4YERCAK3 logo with 3D font and rainbow gradient
 * @param {boolean} showBuilding - Whether to show the building metaphor below
 */
function showLogo(showBuilding = true) {
  // Generate ASCII art with figlet using 3D-ASCII font
  const logoText = figlet.textSync('L4YERCAK3', { 
    font: '3D-ASCII',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });
  
  const logoLines = logoText.split('\n');
  
  // Print logo with rainbow gradient
  logoLines.forEach((line) => {
    console.log(applyCharGradient(line, rainbow));
  });
  
  console.log(''); // spacing
  
  // Print building metaphor if requested
  if (showBuilding) {
    buildingMetaphor.forEach((line, i) => {
      if (i >= 1 && i < 23) {
        // Floors - blue gradient
        console.log(applyCharGradient(line, ['#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE']));
      } else if (i >= 25 && i < 31) {
        // Foundation box - rainbow gradient
        console.log(applyCharGradient(line, rainbow));
      } else {
        console.log(applyCharGradient(line, rainbow));
      }
    });
  }
  
  console.log(''); // final spacing
}

module.exports = {
  showLogo,
  rainbow
};
