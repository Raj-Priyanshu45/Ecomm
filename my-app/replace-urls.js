const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src').filter(f => f.endsWith('.ts'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes("'http://localhost:8080'") || content.includes('"http://localhost:8080"')) {
        
        let depth = file.split(path.sep).length - 2; // src is depth 1
        let envPath = depth <= 1 ? './environments/environment' : '../'.repeat(depth - 1) + 'environments/environment';
        
        if (!content.includes('environment.apiUrl')) {
            // avoid duplicate imports
            if (!content.includes('from \\'' + envPath + '\\'') && !content.includes('from "' + envPath + '"')) {
                const importStmt = `import { environment } from '${envPath}';\n`;
                const lines = content.split('\n');
                let lastImport = 0;
                for(let i=0; i<lines.length; i++) {
                   if (lines[i].startsWith('import ')) lastImport = i;
                }
                lines.splice(lastImport + 1, 0, importStmt);
                content = lines.join('\n');
            }
            
            content = content.replace(/'http:\/\/localhost:8080'/g, 'environment.apiUrl');
            content = content.replace(/"http:\/\/localhost:8080"/g, 'environment.apiUrl');
            
            fs.writeFileSync(file, content);
            console.log('Updated', file);
        }
    }
});
