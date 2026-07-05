const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /import \{\nimport VolatilityDistribution from "\.\/components\/VolatilityDistribution";\n  formatToShamsi,\n  gregorianToJalali,\n  jalaliToGregorian,\n  PERSIAN_MONTH_NAMES,\n  PERSIAN_MONTH_PHONETIC,\n\} from "\.\/utils\/shamsi";/,
  `import {
  formatToShamsi,
  gregorianToJalali,
  jalaliToGregorian,
  PERSIAN_MONTH_NAMES,
  PERSIAN_MONTH_PHONETIC,
} from "./utils/shamsi";
import VolatilityDistribution from "./components/VolatilityDistribution";`
);
fs.writeFileSync('src/App.tsx', code);
