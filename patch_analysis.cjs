const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetFunction = `  const handleAIAnalysisTrigger = async (forceRefresh = false) => {`;
// find where handleAIAnalysisTrigger ends. We will just replace it.

code = code.replace(
/const handleAIAnalysisTrigger = async \(forceRefresh = false\) => \{[\s\S]*?setIsAnalyzing\(false\);\n    \}\n  \};/,
`const handleAIAnalysisTrigger = async (forceRefresh = false) => {
    setIsAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let url = "/api/analysis/latest";
      let method = "GET";
      
      if (forceRefresh) {
        url = "/api/analysis/refresh";
        method = "POST";
      }
      
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": \`Bearer \${session?.access_token}\`
        }
      });
      const data = await res.json();
      
      if (res.ok) {
        setAiAnalysis(data); // This is just storing the JSON response which has { content, timestamp } now!
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };`
);

fs.writeFileSync('src/App.tsx', code);
