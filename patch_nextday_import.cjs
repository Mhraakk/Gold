const fs = require('fs');
let code = fs.readFileSync('src/components/NextDayForecast.tsx', 'utf8');

code = code.replace(
  'import React, { useState, useEffect } from "react";',
  'import React, { useState, useEffect, useCallback } from "react";'
);

fs.writeFileSync('src/components/NextDayForecast.tsx', code);
