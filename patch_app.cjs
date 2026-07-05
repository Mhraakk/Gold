const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove LoginScreen, AdminPanel, supabase imports
code = code.replace(/import LoginScreen from "\.\/components\/LoginScreen";\n/, '');
code = code.replace(/import AdminPanel from "\.\/components\/AdminPanel";\n/, '');
code = code.replace(/import \{ supabase \} from "\.\/lib\/supabase";\n/, '');

// Remove auth states
code = code.replace(/  const \[user, setUser\] = useState<any>\(null\);\n  const \[session, setSession\] = useState<any>\(null\);\n\n  useEffect\(\(\) => \{\n    supabase\.auth\.getSession\(\)[\s\S]*?return \(\) => subscription\.unsubscribe\(\);\n  \}, \[\]\);\n/m, '');

// Remove early return for LoginScreen
code = code.replace(/  if \(\!user\) \{\n    return <LoginScreen onLogin=\{setUser\} \/>;\n  \}\n/m, '');

fs.writeFileSync('src/App.tsx', code);
