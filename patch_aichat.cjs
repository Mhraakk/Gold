const fs = require('fs');
let code = fs.readFileSync('src/components/AIChat.tsx', 'utf8');

code = code.replace(`import React, { useState, useRef, useEffect } from "react";`, `import React, { useState, useRef, useEffect } from "react";\nimport { supabase } from "../lib/supabase";`);

code = code.replace(`      const response = await fetch("/api/chat-terminal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },`, `      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": \`Bearer \${session?.access_token}\`
        },`);

fs.writeFileSync('src/components/AIChat.tsx', code);
