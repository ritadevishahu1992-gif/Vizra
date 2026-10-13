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
    const res = Math.pow(base, exp);
    return {
      isMath: true,
      expression: `${base}^${exp}`,
      result: res,
      formattedStepByStep: `Calculation:\n${base}^${exp} = **${res}**`,
    };
  }

  // 4. Basic Arithmetic: "Calculate X + Y", "X * Y", "X / Y", "X - Y"
  // Clean string of words like "calculate", "what is", "solve", "equals"
  const sanitized = text
    .replace(/^(what\s+is|calculate|evaluate|solve|compute)\s+/i, '')
    .replace(/[?=]/g, '')
    .trim();

  // Check if sanitized contains purely digits, dots, parentheses, and arithmetic operators (+, -, *, /)
  if (/^[\d\s+\-*/().^]+$/.test(sanitized) && /[+\-*/^]/.test(sanitized)) {
    try {
      // Token-based safe evaluator for standard math expressions
      const cleanExpr = sanitized.replace(/\^/g, '**');
      // Strictly validate only allowed tokens: numbers, +, -, *, /, (, ), ., whitespace
      if (/^[0-9+\-*/().\s]+$/.test(cleanExpr)) {
        // Safe Function constructor with no scope access
        const fn = new Function(`"use strict"; return (${cleanExpr});`);
        const val = fn();
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
    } catch {
      // Not a valid standalone arithmetic expression
    }
  }

  // 5. Linear Equation: "solve for x: ax + b = c" or "ax - b = c"
  const linearMatch = text.match(/(?:solve\s*(?:for\s*x)?:?\s*)?(-?\d*(?:\.\d+)?)\s*x\s*([+-])\s*(\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)/i);
  if (linearMatch) {
    let aStr = linearMatch[1].trim();
    let a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : parseFloat(aStr);
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
