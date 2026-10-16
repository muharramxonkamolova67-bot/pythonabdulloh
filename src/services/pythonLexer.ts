export interface Token {
  type:
    | 'keyword'
    | 'builtin'
    | 'constant'
    | 'decorator'
    | 'function_def'
    | 'class_def'
    | 'function_call'
    | 'string'
    | 'comment'
    | 'number'
    | 'operator'
    | 'punctuation'
    | 'identifier'
    | 'whitespace';
  value: string;
}

const KEYWORDS = new Set([
  'and', 'as', 'assert', 'async', 'await', 'break', 'case', 'class', 'continue',
  'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
  'if', 'import', 'in', 'is', 'lambda', 'match', 'nonlocal', 'not', 'or',
  'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
]);

const BUILTINS = new Set([
  'abs', 'all', 'any', 'ascii', 'bin', 'bool', 'breakpoint', 'bytearray', 'bytes',
  'callable', 'chr', 'classmethod', 'compile', 'complex', 'delattr', 'dict', 'dir',
  'divmod', 'enumerate', 'eval', 'exec', 'filter', 'float', 'format', 'frozenset',
  'getattr', 'globals', 'hasattr', 'hash', 'help', 'hex', 'id', 'input', 'int',
  'isinstance', 'issubclass', 'iter', 'len', 'list', 'locals', 'map', 'max',
  'memoryview', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow', 'print',
  'property', 'range', 'repr', 'reversed', 'round', 'set', 'setattr', 'slice',
  'sorted', 'staticmethod', 'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip'
]);

const CONSTANTS = new Set(['True', 'False', 'None', 'self', 'cls', 'Ellipsis', 'NotImplemented']);

export function tokenizePython(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = code.length;

  let prevNonWhitespaceToken: Token | null = null;

  while (i < len) {
    const char = code[i];

    // 1. Whitespace
    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      let ws = '';
      while (i < len && (code[i] === ' ' || code[i] === '\t' || code[i] === '\n' || code[i] === '\r')) {
        ws += code[i];
        i++;
      }
      tokens.push({ type: 'whitespace', value: ws });
      continue;
    }

    // 2. Comments
    if (char === '#') {
      let comment = '';
      while (i < len && code[i] !== '\n') {
        comment += code[i];
        i++;
      }
      const token: Token = { type: 'comment', value: comment };
      tokens.push(token);
      prevNonWhitespaceToken = token;
      continue;
    }

    // 3. Triple Quoted Strings (''' or """)
    if (
      (char === '"' && code.slice(i, i + 3) === '"""') ||
      (char === "'" && code.slice(i, i + 3) === "'''")
    ) {
      const quote = code.slice(i, i + 3);
      let str = quote;
      i += 3;
      while (i < len && code.slice(i, i + 3) !== quote) {
        if (code[i] === '\\' && i + 1 < len) {
          str += code[i] + code[i + 1];
          i += 2;
        } else {
          str += code[i];
          i++;
        }
      }
      if (i < len) {
        str += quote;
        i += 3;
      }
      const token: Token = { type: 'string', value: str };
      tokens.push(token);
      prevNonWhitespaceToken = token;
      continue;
    }

    // 4. Prefixed Strings (f"...", r"...", b"...", fr"...", etc.)
    const prefixMatch = code.slice(i).match(/^(?:f|r|b|u|fr|rf|br|rb)(?=["'])/i);
    if (prefixMatch) {
      const prefix = prefixMatch[0];
      const quoteChar = code[i + prefix.length];
      const isTriple = code.slice(i + prefix.length, i + prefix.length + 3) === (quoteChar + quoteChar + quoteChar);
      
      let str = prefix;
      i += prefix.length;

      if (isTriple) {
        const quote = quoteChar + quoteChar + quoteChar;
        str += quote;
        i += 3;
        while (i < len && code.slice(i, i + 3) !== quote) {
          if (code[i] === '\\' && i + 1 < len) {
            str += code[i] + code[i + 1];
            i += 2;
          } else {
            str += code[i];
            i++;
          }
        }
        if (i < len) {
          str += quote;
          i += 3;
        }
      } else {
        str += quoteChar;
        i += 1;
        while (i < len && code[i] !== quoteChar && code[i] !== '\n') {
          if (code[i] === '\\' && i + 1 < len) {
            str += code[i] + code[i + 1];
            i += 2;
          } else {
            str += code[i];
            i++;
          }
        }
        if (i < len && code[i] === quoteChar) {
          str += quoteChar;
          i++;
        }
      }
      const token: Token = { type: 'string', value: str };
      tokens.push(token);
      prevNonWhitespaceToken = token;
      continue;
    }

    // 5. Standard Strings ('...' or "...")
    if (char === '"' || char === "'") {
      const quote = char;
      let str = quote;
      i++;
      while (i < len && code[i] !== quote && code[i] !== '\n') {
        if (code[i] === '\\' && i + 1 < len) {
          str += code[i] + code[i + 1];
          i += 2;
        } else {
          str += code[i];
          i++;
        }
      }
      if (i < len && code[i] === quote) {
        str += quote;
        i++;
      }
      const token: Token = { type: 'string', value: str };
      tokens.push(token);
      prevNonWhitespaceToken = token;
      continue;
    }

    // 6. Decorator (@decorator_name)
    if (char === '@' && (prevNonWhitespaceToken === null || prevNonWhitespaceToken.value.endsWith('\n') || tokens[tokens.length - 1]?.value.includes('\n'))) {
      let dec = '@';
      i++;
      while (i < len && /[a-zA-Z0-9_.]/.test(code[i])) {
        dec += code[i];
        i++;
      }
      const token: Token = { type: 'decorator', value: dec };
      tokens.push(token);
      prevNonWhitespaceToken = token;
      continue;
    }

    // 7. Numbers (Hex, Binary, Octal, Floats, Ints)
    if (/[0-9]/.test(char) || (char === '.' && i + 1 < len && /[0-9]/.test(code[i + 1]))) {
      let num = '';
      if (char === '0' && i + 1 < len && /[xXbBoO]/.test(code[i + 1])) {
        num += code[i] + code[i + 1];
        i += 2;
        while (i < len && /[0-9a-fA-F_]/.test(code[i])) {
          num += code[i];
          i++;
        }
      } else {
        while (i < len && /[0-9_]/.test(code[i])) {
          num += code[i];
          i++;
        }
        if (i < len && code[i] === '.' && (i + 1 >= len || code[i + 1] !== '.')) {
          num += code[i];
          i++;
          while (i < len && /[0-9_]/.test(code[i])) {
            num += code[i];
            i++;
          }
        }
        if (i < len && /[eE]/.test(code[i])) {
          num += code[i];
          i++;
          if (i < len && (code[i] === '+' || code[i] === '-')) {
            num += code[i];
            i++;
          }
          while (i < len && /[0-9_]/.test(code[i])) {
            num += code[i];
            i++;
          }
        }
        if (i < len && /[jJ]/.test(code[i])) {
          num += code[i];
          i++;
        }
      }
      const token: Token = { type: 'number', value: num };
      tokens.push(token);
      prevNonWhitespaceToken = token;
      continue;
    }

    // 8. Identifiers & Keywords
    if (/[a-zA-Z_]/.test(char)) {
      let id = '';
      while (i < len && /[a-zA-Z0-9_]/.test(code[i])) {
        id += code[i];
        i++;
      }

      let type: Token['type'] = 'identifier';

      // Check if after def or class
      if (prevNonWhitespaceToken && prevNonWhitespaceToken.value === 'def') {
        type = 'function_def';
      } else if (prevNonWhitespaceToken && prevNonWhitespaceToken.value === 'class') {
        type = 'class_def';
      } else if (KEYWORDS.has(id)) {
        type = 'keyword';
      } else if (CONSTANTS.has(id)) {
        type = 'constant';
      } else if (BUILTINS.has(id)) {
        type = 'builtin';
      } else {
        // Look ahead for function call: id(...)
        let lookahead = i;
        while (lookahead < len && (code[lookahead] === ' ' || code[lookahead] === '\t')) {
          lookahead++;
        }
        if (lookahead < len && code[lookahead] === '(') {
          type = 'function_call';
        }
      }

      const token: Token = { type, value: id };
      tokens.push(token);
      prevNonWhitespaceToken = token;
      continue;
    }

    // 9. Multi-char operators (==, !=, <=, >=, //, **, ->, +=, -=, etc.)
    const twoChar = code.slice(i, i + 2);
    const threeChar = code.slice(i, i + 3);

    if (['**=', '//=', '<<=', '>>='].includes(threeChar)) {
      const token: Token = { type: 'operator', value: threeChar };
      tokens.push(token);
      prevNonWhitespaceToken = token;
      i += 3;
      continue;
    }

    if (['==', '!=', '<=', '>=', '//', '**', '->', ':=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<', '>>'].includes(twoChar)) {
      const token: Token = { type: 'operator', value: twoChar };
      tokens.push(token);
      prevNonWhitespaceToken = token;
      i += 2;
      continue;
    }

    // 10. Single char operators & punctuation
    if (['+', '-', '*', '/', '%', '=', '<', '>', '&', '|', '^', '~'].includes(char)) {
      const token: Token = { type: 'operator', value: char };
      tokens.push(token);
      prevNonWhitespaceToken = token;
      i++;
      continue;
    }

    if (['(', ')', '[', ']', '{', '}', ':', ',', '.', ';'].includes(char)) {
      const token: Token = { type: 'punctuation', value: char };
      tokens.push(token);
      prevNonWhitespaceToken = token;
      i++;
      continue;
    }

    // Fallback
    const token: Token = { type: 'identifier', value: char };
    tokens.push(token);
    prevNonWhitespaceToken = token;
    i++;
  }

  return tokens;
}
