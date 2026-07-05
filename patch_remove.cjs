const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const connectorsStart = '{activeTab === "connectors" && (';
const settingsEnd = '</section>';

const startIdx = code.indexOf(connectorsStart);
const endIdx = code.indexOf(settingsEnd, startIdx) + settingsEnd.length;

if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + code.substring(endIdx);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Successfully removed connectors and settings!");
} else {
    console.log("Could not find boundaries.");
}
