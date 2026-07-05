const fs = require('fs');

const path = 'server.ts';
let code = fs.readFileSync(path, 'utf8');

const oldBlock = `    const { fields } = snapshot;
    
    // Validate required fields
    if (!fields.meltedGoldMazaneh || !fields.meltedGoldMazaneh.value) {
      return res.status(400).json({ error: "مظنه آبشده نامعتبر است." });
    }
    if (!fields.xauusd || !fields.xauusd.value) {
      return res.status(400).json({ error: "مبلغ اونس نامعتبر است." });
    }
    if (!fields.usdIrt || !fields.usdIrt.value) {
      return res.status(400).json({ error: "مبلغ دلار نامعتبر است." });
    }`;

const newBlock = `    const { fields } = snapshot;
    const { customInputs } = req.body;
    
    // Override fields with custom inputs if provided
    if (customInputs) {
      if (customInputs.meltedGold) fields.meltedGoldMazaneh = { value: customInputs.meltedGold.toString(), unit: "IRR" };
      if (customInputs.xauusd) fields.xauusd = { value: customInputs.xauusd.toString(), unit: "USD" };
      if (customInputs.usdIrt) fields.usdIrt = { value: customInputs.usdIrt.toString(), unit: "IRR" };
      if (customInputs.gold18k) fields.gold18k = { value: customInputs.gold18k.toString(), unit: "IRR" };
      if (customInputs.usdtIrt) fields.usdtIrt = { value: customInputs.usdtIrt.toString(), unit: "IRR" };
      if (customInputs.emamiCoin) fields.emamiCoin = { value: customInputs.emamiCoin.toString(), unit: "IRR" };
    }

    // Validate required fields
    if (!fields.meltedGoldMazaneh || !fields.meltedGoldMazaneh.value) {
      return res.status(400).json({ error: "مظنه آبشده نامعتبر است." });
    }
    if (!fields.xauusd || !fields.xauusd.value) {
      return res.status(400).json({ error: "مبلغ اونس نامعتبر است." });
    }
    if (!fields.usdIrt || !fields.usdIrt.value) {
      return res.status(400).json({ error: "مبلغ دلار نامعتبر است." });
    }`;

code = code.replace(
  `const { marketSnapshotId } = req.body;`,
  `const { marketSnapshotId, customInputs } = req.body;`
);
code = code.replace(oldBlock, newBlock);
fs.writeFileSync(path, code);
