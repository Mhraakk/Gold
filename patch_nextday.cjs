const fs = require('fs');

const path = 'src/components/NextDayForecast.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldAnalyzeStart = `  const handleAnalyze = async (snapshotId?: string) => {
    const activeSnapshotId = snapshotId || marketSnapshotId;
    if (!activeSnapshotId) {
      setError("لطفاً ابتدا داده‌ها را به‌روزرسانی کنید.");
      return;
    }
    
    try {
      setIsAnalyzing(true);
      setError(null);
      setWorkflowState("ANALYZING");
      
      const res = await fetch("/api/forecast/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketSnapshotId: activeSnapshotId })
      });`;

const newAnalyzeStart = `  const handleAnalyze = async (snapshotId?: string) => {
    const activeSnapshotId = snapshotId || marketSnapshotId || "manual";
    
    try {
      setIsAnalyzing(true);
      setError(null);
      setWorkflowState("ANALYZING");
      
      const res = await fetch("/api/forecast/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketSnapshotId: activeSnapshotId, customInputs: inputData })
      });`;

code = code.replace(oldAnalyzeStart, newAnalyzeStart);
fs.writeFileSync(path, code);
