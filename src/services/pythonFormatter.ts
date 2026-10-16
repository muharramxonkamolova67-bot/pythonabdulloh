/**
 * Python Code Formatter (Clean indentation, operator spacing, trailing space cleanup)
 */
export function formatPythonCode(source: string, indentSize = 4): string {
  const lines = source.split('\n');
  const formattedLines: string[] = [];
  const indentStr = ' '.repeat(indentSize);
  let currentIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Preserve empty lines (capped at 2 consecutive)
    if (!trimmed) {
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] === '') {
        // don't add more than 1 empty line
        continue;
      }
      formattedLines.push('');
      continue;
    }

    // Comment line
    if (trimmed.startsWith('#')) {
      formattedLines.push(indentStr.repeat(currentIndent) + trimmed);
      continue;
    }

    // De-indentation keywords like elif, else, except, finally
    let effectiveIndent = currentIndent;
    if (/^(elif|else|except|finally)\b/.test(trimmed)) {
      effectiveIndent = Math.max(0, currentIndent - 1);
    } else if (/^(return|pass|break|continue|raise)\b/.test(trimmed)) {
      effectiveIndent = currentIndent;
    }

    // Clean up basic operator spacing outside of strings
    let cleanLine = trimmed;
    // Commas spacing
    cleanLine = cleanLine.replace(/,(?=[^\s)\]}])/g, ', ');
    // Colons in dict / types (except slicing or comments)
    cleanLine = cleanLine.replace(/(\w+):(?=[^\s:\n])/g, '$1: ');

    formattedLines.push(indentStr.repeat(effectiveIndent) + cleanLine);

    // Calculate indent for subsequent lines
    if (trimmed.endsWith(':') && !trimmed.startsWith('#')) {
      currentIndent = effectiveIndent + 1;
    } else if (
      (trimmed.startsWith('return') ||
        trimmed.startsWith('pass') ||
        trimmed.startsWith('break') ||
        trimmed.startsWith('continue') ||
        trimmed.startsWith('raise')) &&
      !lines[i + 1]?.trim().startsWith('else') &&
      !lines[i + 1]?.trim().startsWith('elif') &&
      !lines[i + 1]?.trim().startsWith('except') &&
      !lines[i + 1]?.trim().startsWith('finally')
    ) {
      // Don't auto-decrement unconditionally to avoid breaking inner blocks
    }
  }

  return formattedLines.join('\n');
}
