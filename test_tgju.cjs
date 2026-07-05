const cheerio = require('cheerio');
fetch('https://www.tgju.org/profile/mesghal', {
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
}).then(res => res.text()).then(html => {
  const $ = cheerio.load(html);
  let priceText = $(".value-right .price, [data-field='price']").first().text().trim();
  if (!priceText) priceText = $("td.text-left").first().text().trim();
  if (!priceText) priceText = $("table.table-market tbody tr:first-child td.text-left").text().trim();
  console.log("mesghal text:", priceText);
});
fetch('https://www.tgju.org/profile/price_dollar_rl', {
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
}).then(res => res.text()).then(html => {
  const $ = cheerio.load(html);
  let priceText = $(".value-right .price, [data-field='price']").first().text().trim();
  if (!priceText) priceText = $("td.text-left").first().text().trim();
  if (!priceText) priceText = $("table.table-market tbody tr:first-child td.text-left").text().trim();
  console.log("dollar text:", priceText);
});
