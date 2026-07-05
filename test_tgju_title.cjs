const cheerio = require('cheerio');
fetch('https://www.tgju.org/profile/price_dollar_rl', {
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
}).then(res => res.text()).then(html => {
  const $ = cheerio.load(html);
  console.log("title:", $('title').text());
});
