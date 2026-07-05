const fs = require('fs');

const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/const \[currentTime, setCurrentTime\] = useState\(new Date\(\)\);/g, '');

fs.writeFileSync(path, code);
