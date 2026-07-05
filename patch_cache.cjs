const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regexVars = /\/\/ Shared AI Analysis Endpoint/g;
code = code.replace(regexVars, `let memoryCache = {
  latest_analysis: null,
  forecasts: {}
};

// Shared AI Analysis Endpoint`);

const regexSetAnalysis = /    if \(supabaseAdmin\) \{\n      await supabaseAdmin\.from\('analyses'\)\.insert\(\[analysisData\]\);\n    \} else if \(redis\) \{\n      await redis\.set\("latest_analysis", JSON\.stringify\(analysisData\)\);\n    \}/g;
code = code.replace(regexSetAnalysis, `    if (supabaseAdmin) {
      await supabaseAdmin.from('analyses').insert([analysisData]);
    } else if (redis) {
      await redis.set("latest_analysis", JSON.stringify(analysisData));
    } else {
      memoryCache.latest_analysis = analysisData;
    }`);

const regexGetAnalysis = /  if \(supabaseClient\) \{\n    const \{ data, error \} = await supabaseClient\.from\('analyses'\)\.select\('\*'\)\.order\('timestamp', \{ ascending: false \}\)\.limit\(1\);\n    if \(\!error && data && data\.length > 0\) return res\.json\(data\[0\]\);\n  \} else if \(redis\) \{\n    const analysis = await redis\.get<string>\("latest_analysis"\);\n    if \(analysis\) return res\.json\(typeof analysis === 'string' \? JSON\.parse\(analysis\) : analysis\);\n  \}/g;
code = code.replace(regexGetAnalysis, `  if (supabaseClient) {
    const { data, error } = await supabaseClient.from('analyses').select('*').order('timestamp', { ascending: false }).limit(1);
    if (!error && data && data.length > 0) return res.json(data[0]);
  } else if (redis) {
    const analysis = await redis.get<string>("latest_analysis");
    if (analysis) return res.json(typeof analysis === 'string' ? JSON.parse(analysis) : analysis);
  } else if (memoryCache.latest_analysis) {
    return res.json(memoryCache.latest_analysis);
  }`);

const regexGetForecast = /  if \(redis\) \{\n    const cachedForecast = await redis\.get\("forecast:" \+ today\);\n    if \(cachedForecast\) \{\n        return res\.json\(typeof cachedForecast === 'string' \? JSON\.parse\(cachedForecast\) : cachedForecast\);\n    \}\n  \}/g;
code = code.replace(regexGetForecast, `  if (redis) {
    const cachedForecast = await redis.get("forecast:" + today);
    if (cachedForecast) {
        return res.json(typeof cachedForecast === 'string' ? JSON.parse(cachedForecast) : cachedForecast);
    }
  } else if (memoryCache.forecasts[today]) {
    return res.json(memoryCache.forecasts[today]);
  }`);

const regexSetForecast = /    if \(redis\) \{\n      await redis\.set\("forecast:" \+ today, JSON\.stringify\(forecastData\)\);\n      \/\/ Optionally expire after 24h\n      await redis\.expire\("forecast:" \+ today, 86400\);\n    \}/g;
code = code.replace(regexSetForecast, `    if (redis) {
      await redis.set("forecast:" + today, JSON.stringify(forecastData));
      // Optionally expire after 24h
      await redis.expire("forecast:" + today, 86400);
    } else {
      memoryCache.forecasts[today] = forecastData;
    }`);

fs.writeFileSync('server.ts', code);
