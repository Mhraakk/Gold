const cheerio = require('cheerio');
fetch('https://www.tgju.org/profile/price_dollar_rl', {
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
}).then(res => res.text()).then(html => {
  const $ = cheerio.load(html);
  console.log("dollar title:", $('title').text());
});
fetch('https://www.tgju.org/profile/sekee', {
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
}).then(res => res.text()).then(html => {
  const $ = cheerio.load(html);
  console.log("sekee title:", $('title').text());
});
