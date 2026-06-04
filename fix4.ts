import fs from 'fs';

let content = fs.readFileSync('src/constants/backendCode.ts', 'utf8');

// replace uuid.toLowerCase() and code.toLowerCase() etc if they exist without String()
content = content.replace(/uuid\.toLowerCase\(\)/g, "String(uuid).toLowerCase()");
content = content.replace(/code\.toLowerCase\(\)/g, "String(code).toLowerCase()");
content = content.replace(/pid\.toLowerCase\(\)/g, "String(pid).toLowerCase()");
content = content.replace(/searchId\.toLowerCase\(\)/g, "String(searchId).toLowerCase()");

fs.writeFileSync('src/constants/backendCode.ts', content);
console.log("Fixed backendCode");
