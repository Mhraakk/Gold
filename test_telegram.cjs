const cheerio = require('cheerio');
fetch('https://t.me/s/abshdh', {
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
}).then(res => res.text()).then(html => {
  const $ = cheerio.load(html);
  const messages = [];
  $('.tgme_widget_message_text').each((i, el) => messages.push($(el).text()));
  console.log(messages.slice(-5)); // print last 5
});
