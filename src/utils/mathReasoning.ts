/**
 * Programmatic Math Evaluation & Verification Utility
 * Safely computes arithmetic, percentages, powers, roots, and standard formulas
 * to eliminate calculation hallucinations and verify mathematical accuracy.
 */

export interface MathEvaluationResult {
  isMath: boolean;
  expression?: string;
  result?: number | string;
  formattedStepByStep?: string;
}

/**
 * Deterministic Shunting-Yard arithmetic expression evaluator.
 * Evaluates numbers, +, -, *, /, ^ (or **), unary +/-, and parentheses ()
 * without using eval() or new Function().
 */
function evaluateArithmeticTokens(expr: string): number | null {
  const normalized = expr.replace(/\*\*/g, '^').replace(/\s+/g, '');
  if (!normalized || normalized.length > 256) return null;
  if (!/^[0-9+\-*/^().]+$/.test(normalized)) return null;

  type Token =
    | { type: 'num'; value: number }
    | { type: 'op'; value: '+' | '-' | '*' | '/' | '^' | 'u-' | 'u+' }
    | { type: 'paren'; value: '(' | ')' };

  const tokens: Token[] = [];
  let i = 0;

  while (i < normalized.length) {
    const ch = normalized[i];

    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let numStr = '';
      let dotCount = 0;
      while (
        i < normalized.length &&
        ((normalized[i] >= '0' && normalized[i] <= '9') || normalized[i] === '.')
      ) {
        if (normalized[i] === '.') {
          dotCount++;
          if (dotCount > 1) return null;
        }
        numStr += normalized[i];
        i++;
      }
      const parsed = Number(numStr);
      if (!Number.isFinite(parsed)) return null;
      tokens.push({ type: 'num', value: parsed });
      continue;
    }

    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i++;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^') {
      const prev = tokens[tokens.length - 1];
      const isUnary =
        !prev ||
        prev.type === 'op' ||
        (prev.type === 'paren' && prev.value === '(');

      if (isUnary) {
        if (ch === '-') {
          tokens.push({ type: 'op', value: 'u-' });
          i++;
          continue;
        }
        if (ch === '+') {
          tokens.push({ type: 'op', value: 'u+' });
          i++;
          continue;
        }
        return null;
      }

      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    return null;
  }

  const precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    'u-': 3,
    'u+': 3,
    '^': 4,
  };
  const rightAssociative = new Set(['^', 'u-', 'u+']);

  const outputQueue: Token[] = [];
  const opStack: Token[] = [];

  for (const token of tokens) {
    if (token.type === 'num') {
      outputQueue.push(token);
    } else if (token.type === 'op') {
      while (opStack.length > 0) {
        const top = opStack[opStack.length - 1];
        if (top.type !== 'op') break;
        const p1 = precedence[token.value];
        const p2 = precedence[top.value];
        if (p2 > p1 || (p1 === p2 && !rightAssociative.has(token.value))) {
          outputQueue.push(opStack.pop()!);
        } else {
          break;
        }
      }
      opStack.push(token);
    } else if (token.type === 'paren' && token.value === '(') {
      opStack.push(token);
    } else if (token.type === 'paren' && token.value === ')') {
      let foundOpen = false;
      while (opStack.length > 0) {
        const top = opStack.pop()!;
        if (top.type === 'paren' && top.value === '(') {
          foundOpen = true;
          break;
        }
        outputQueue.push(top);
      }
      if (!foundOpen) return null;
    }
  }

  while (opStack.length > 0) {
    const top = opStack.pop()!;
    if (top.type === 'paren') return null;
    outputQueue.push(top);
  }

  const evalStack: number[] = [];
  for (const token of outputQueue) {
    if (token.type === 'num') {
      evalStack.push(token.value);
    } else if (token.type === 'op') {
      if (token.value === 'u-' || token.value === 'u+') {
        if (evalStack.length < 1) return null;
        const a = evalStack.pop()!;
        evalStack.push(token.value === 'u-' ? -a : a);
      } else {
        if (evalStack.length < 2) return null;
        const b = evalStack.pop()!;
        const a = evalStack.pop()!;
        let r = 0;
        switch (token.value) {
          case '+':
            r = a + b;
            break;
          case '-':
            r = a - b;
            break;
          case '*':
            r = a * b;
            break;
          case '/':
            if (b === 0) return null;
            r = a / b;
            break;
          case '^':
            if (Math.abs(b) > 10000) return null;
            r = Math.pow(a, b);
            break;
        }
        if (!Number.isFinite(r)) return null;
        evalStack.push(r);
      }
    }
  }

  if (evalStack.length !== 1) return null;
  return evalStack[0];
}

/**
 * Safely evaluates simple mathematical expressions without using arbitrary eval.
 */
export function evaluateSafeMath(query: string): MathEvaluationResult {
  const text = query.trim().toLowerCase();

  // 1. Percentage calculations: "What is X% of Y" or "X% of Y"
  const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of)\s*(\d+(?:\.\d+)?)/i);
  if (percentMatch) {
    const p = parseFloat(percentMatch[1]);
    const total = parseFloat(percentMatch[2]);
    const res = (p / 100) * total;
    return {
      isMath: true,
      expression: `${p}% of ${total}`,
      result: Number.isInteger(res) ? res : Number(res.toFixed(4)),
      formattedStepByStep: `Calculation:\n1. Convert percentage: ${p}% = ${p} / 100 = ${p / 100}\n2. Multiply by base: ${p / 100} × ${total} = **${Number.isInteger(res) ? res : res.toFixed(4)}**`,
    };
  }

  // 2. Square root: "sqrt(X)" or "square root of X"
  const sqrtMatch = text.match(/(?:sqrt|square\s+root\s+of)\s*(?:\()?\s*(\d+(?:\.\d+)?)\s*(?:\))?/i);
  if (sqrtMatch) {
    const num = parseFloat(sqrtMatch[1]);
    const res = Math.sqrt(num);
    return {
      isMath: true,
      expression: `√${num}`,
      result: Number.isInteger(res) ? res : Number(res.toFixed(4)),
      formattedStepByStep: `Calculation:\n√${num} = **${Number.isInteger(res) ? res : res.toFixed(4)}**`,
    };
  }

  // 3. Power: "X ^ Y" or "X to the power of Y"
  const powMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:\^|\*\*\s*|to\s+the\s+power\s+of)\s*(\d+(?:\.\d+)?)/i);
  if (powMatch) {
    const base = parseFloat(powMatch[1]);
    const exp = parseFloat(powMatch[2]);
    if (Math.abs(exp) <= 10000) {
      const res = Math.pow(base, exp);
      if (Number.isFinite(res)) {
        return {
          isMath: true,
          expression: `${base}^${exp}`,
          result: res,
          formattedStepByStep: `Calculation:\n${base}^${exp} = **${res}**`,
        };
      }
    }
  }

  // 4. Basic Arithmetic: "Calculate X + Y", "X * Y", "X / Y", "X - Y"
  // Clean string of words like "calculate", "what is", "solve", "equals"
  const sanitized = text
    .replace(/^(what\s+is|calculate|evaluate|solve|compute)\s+/i, '')
    .replace(/[?=]/g, '')
    .trim();

  // Check if sanitized contains purely digits, dots, parentheses, and arithmetic operators (+, -, *, /)
  if (/^[\d\s+\-*/().^]+$/.test(sanitized) && /[+\-*/^]/.test(sanitized)) {
    const val = evaluateArithmeticTokens(sanitized);
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      const formatted = Number.isInteger(val) ? val : Number(val.toFixed(6));
      return {
        isMath: true,
        expression: sanitized,
        result: formatted,
        formattedStepByStep: `Expression: \`${sanitized}\`\nResult: **${formatted}**`,
      };
    }
  }

  // 5. Linear Equation: "solve for x: ax + b = c" or "ax - b = c"
  const linearMatch = text.match(/(?:solve\s*(?:for\s*x)?:?\s*)?(-?\d*(?:\.\d+)?)\s*x\s*([+-])\s*(\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)/i);
  if (linearMatch) {
    const aStr = linearMatch[1].trim();
    const a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : parseFloat(aStr);
    const sign = linearMatch[2];
    let b = parseFloat(linearMatch[3]);
    if (sign === '-') b = -b;
    const c = parseFloat(linearMatch[4]);

    if (a !== 0) {
      const x = (c - b) / a;
      const formatted = Number.isInteger(x) ? x : Number(x.toFixed(4));
      return {
        isMath: true,
        expression: `${a}x + (${b}) = ${c}`,
        result: formatted,
        formattedStepByStep: `Steps:\n1. Equation: ${a}x ${sign} ${Math.abs(b)} = ${c}\n2. Subtract constant: ${a}x = ${c - b}\n3. Divide by coefficient: x = (${c - b}) / ${a} = **${formatted}**`,
      };
    }
  }

  return { isMath: false };
}
