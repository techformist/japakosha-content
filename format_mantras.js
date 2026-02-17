#!/usr/bin/env node
/**
 * Script to format Sanskrit/Kannada mantra files according to standard conventions:
 * 1. Remove comment markers: -|| ... ||- → || ... ||
 * 2. Fix verse numbers: || ೧ | → || ೧ ||, || ೧ → || ೧ ||
 * 3. Add blank line after verse endings (||)
 * 4. Split at single | and indent continuation on new line
 * 5. Indent lines that follow a line ending with single |
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatFile(content) {
    let lines = content.split('\n');
    let formattedLines = [];
    let inYaml = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Track YAML front matter
        if (line.trim() === '---') {
            if (!inYaml) {
                inYaml = true;
            } else {
                inYaml = false;
            }
            formattedLines.push(line);
            continue;
        }

        // Keep YAML content as-is
        if (inYaml) {
            formattedLines.push(line);
            continue;
        }

        // Fix comment markers: -|| ... ||- or \-|| ... ||- → || ... ||
        line = line.replace(/^\\?-\|\|\s*/, '|| ');
        line = line.replace(/\s*\|\|-?\s*$/, ' ||');

        // Fix verse numbers:
        // || ೧ | → || ೧ || (trailing single pipe)
        line = line.replace(/\|\|\s*([೦-೯೦-೯\d]+)\s*\|\s*$/, '|| $1 ||');
        // || ೧ → || ೧ || (missing closing pipes - number at end of line after ||)
        line = line.replace(/\|\|\s*([೦-೯೦-೯\d]+)\s*$/, '|| $1 ||');
        // | ೧ || → || ೧ || (leading single pipe)
        line = line.replace(/(?<!\|)\|\s*([೦-೯೦-೯\d]+)\s*\|\|/, '|| $1 ||');

        formattedLines.push(line);
    }

    // Second pass: split at single | (not ||) within lines and indent continuation
    let splitLines = [];
    for (let i = 0; i < formattedLines.length; i++) {
        let line = formattedLines[i];
        let trimmed = line.trim();

        // Skip section headers
        if (trimmed.startsWith('||') && trimmed.endsWith('||') && !trimmed.match(/\|\|\s*[೦-೯೦-೯\d]+\s*\|\|$/)) {
            splitLines.push(line);
            continue;
        }

        // Split at single | (not ||) where there's non-verse-num content after
        let currentLine = line;
        let hasSplit = false;

        // Find single | that is not part of ||
        for (let j = 0; j < currentLine.length; j++) {
            if (currentLine[j] === '|') {
                let prevIsPipe = j > 0 && currentLine[j-1] === '|';
                let nextIsPipe = j < currentLine.length - 1 && currentLine[j+1] === '|';
                
                if (!prevIsPipe && !nextIsPipe) {
                    let after = currentLine.substring(j + 1).trim();
                    // Don't split if what follows is just a verse number pattern
                    let isVerseNum = after.match(/^[೦-೯೦-೯\d]+\s*\|\|?\s*$/);
                    
                    if (after && !isVerseNum) {
                        let before = currentLine.substring(0, j);
                        splitLines.push(before + ' |');
                        splitLines.push('    ' + currentLine.substring(j + 1).trimStart());
                        hasSplit = true;
                        break;
                    }
                }
            }
        }

        if (!hasSplit) {
            splitLines.push(line);
        }
    }

    // Third pass: indent lines that follow a line ending with single |
    let resultLines = [];
    for (let i = 0; i < splitLines.length; i++) {
        let line = splitLines[i];
        
        // Check if previous line ends with single | (not ||)
        if (i > 0) {
            let prevTrimmed = splitLines[i-1].trimEnd();
            // Previous line ends with | but not ||
            if (prevTrimmed.endsWith('|') && !prevTrimmed.endsWith('||')) {
                // Don't double-indent if already indented
                if (!line.startsWith('    ')) {
                    line = '    ' + line;
                }
            }
        }
        
        resultLines.push(line);
    }

    // Fourth pass: add blank lines after verses ending with ||
    let finalLines = [];
    for (let i = 0; i < resultLines.length; i++) {
        let line = resultLines[i];
        finalLines.push(line);

        let stripped = line.trimEnd();
        // Add blank line after verse endings (|| at end)
        if (stripped.endsWith('||') && stripped) {
            if (i + 1 < resultLines.length) {
                let nextLine = resultLines[i + 1];
                if (nextLine.trim()) {
                    finalLines.push('');
                }
            }
        }
    }

    return finalLines.join('\n');
}

// Main
const contentDir = path.join(__dirname, 'content', 'kn');
const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.kn.md'));

console.log(`Found ${files.length} files to process`);

for (const file of files) {
    const filepath = path.join(contentDir, file);
    try {
        const content = fs.readFileSync(filepath, 'utf8');
        const formatted = formatFile(content);
        fs.writeFileSync(filepath, formatted, 'utf8');
        console.log(`✓ Formatted: ${file}`);
    } catch (e) {
        console.log(`✗ Error processing ${file}: ${e.message}`);
    }
}

console.log(`\nCompleted formatting ${files.length} files`);
