const fs = require('fs');

const content = fs.readFileSync('src/data/projects.js', 'utf8');

// Find the start and end of the PROJECTS array
const match = content.match(/export const PROJECTS = \[\n([\s\S]*?)\n\];\n\nexport const HIDDEN_PROJECTS/);
if (!match) {
    console.error("Could not find PROJECTS array");
    process.exit(1);
}

const inner = match[1];

// We need to split the array into individual object strings.
// Since each object starts with "  {" and ends with "  },", we can split by that.
// A more robust way:
const projectsStr = inner.split(/,\n  (?=\{)/);
// Note: the first one starts with "  {", the last one ends with "  }" (no comma after because of the split or it's the last one).

// Let's parse them to find the id.
const projects = [];
let currentStr = "";
let braceCount = 0;

for (let i = 0; i < inner.length; i++) {
    const char = inner[i];
    currentStr += char;
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    
    if (braceCount === 0 && currentStr.trim() !== "") {
        // Check if the next char is comma and newline
        if (inner[i+1] === ',' && inner[i+2] === '\n') {
            currentStr += ',\n';
            i += 2;
        } else if (inner[i+1] === '\n') {
            currentStr += '\n';
            i += 1;
        }
        projects.push(currentStr);
        currentStr = "";
    }
}

const idOrder = [
    "mentl",
    "sonido",
    "turbosort",
    "two-top",
    "clob",
    "tokensafe",
    "noodles",
    "celezdial"
];

const sortedProjects = [];
for (const id of idOrder) {
    const proj = projects.find(p => p.includes(`id: "${id}"`));
    if (proj) {
        // Ensure it ends with a comma if it's not the last one, or just add commas cleanly.
        sortedProjects.push(proj.trim());
    } else {
        console.error("Could not find project with id: " + id);
    }
}

const newInner = sortedProjects.join(',\n') + '\n';
const newContent = content.replace(match[1], newInner);

fs.writeFileSync('src/data/projects.js', newContent);
console.log("Successfully reordered projects.js");

