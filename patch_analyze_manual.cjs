const fs = require('fs');

const path = 'server.ts';
let code = fs.readFileSync(path, 'utf8');

const analyzeStart = `app.post("/api/forecast/analyze", async (req, res) => {
  try {
    const { marketSnapshotId, customInputs } = req.body;
    if (!marketSnapshotId) {
      return res.status(400).json({ error: "marketSnapshotId is required" });
    }
    const snapshot = marketSnapshots.get(marketSnapshotId);
    if (!snapshot) {
      return res.status(404).json({ error: "Market snapshot not found or expired. Please run autofill again." });
    }
    
    const { fields } = snapshot;`;

const newAnalyzeStart = `app.post("/api/forecast/analyze", async (req, res) => {
  try {
    const { marketSnapshotId, customInputs } = req.body;
    
    let fields = {};
    if (marketSnapshotId && marketSnapshotId !== "manual") {
      const snapshot = marketSnapshots.get(marketSnapshotId);
      if (!snapshot) {
        return res.status(404).json({ error: "Market snapshot not found or expired. Please run autofill again." });
      }
      fields = snapshot.fields;
    }`;

code = code.replace(analyzeStart, newAnalyzeStart);
fs.writeFileSync(path, code);
