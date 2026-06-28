import { create, all } from "mathjs";
import type { PatientScope } from "../../../types/equationEngine";

// 1. The mathjs singleton
const math = create(all);

// 2. Custom helper functions registered on the instance
math.import({
  ifTrue: (condition: any, ifVal: number, elseVal: number) => {
    return condition ? ifVal : elseVal;
  },
  ifCategory: (value: string, target: string, ifVal: number, elseVal: number) => {
    return value === target ? ifVal : elseVal;
  },
  clamp: (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  }
});

// 3. MissingVariableError class
export class MissingVariableError extends Error {
  constructor(public variableSlug: string) {
    super(`Missing required variable: ${variableSlug}`);
    this.name = "MissingVariableError";
  }
}

// 4. sanitizeExpression (not exported)
function sanitizeExpression(expr: string): string {
  return expr
    .replace(/__proto__/g, "")
    .replace(/constructor/g, "")
    .replace(/\$([a-zA-Z0-9_]+)/g, "$1");
}

// 5. evaluateExpression
export function evaluateExpression(
  expression: string,
  scope: PatientScope
): { value: number; error: null } | { value: null; error: string } {
  try {
    const sanitized = sanitizeExpression(expression);
    const compiled = math.compile(sanitized);
    
    // Evaluate with a shallow copy of scope to avoid mutations
    const result = compiled.evaluate({ ...scope });
    
    let finalVal: any = result;
    if (result && typeof result === "object" && "entries" in result) {
      const entries = (result as any).entries;
      if (Array.isArray(entries) && entries.length > 0) {
        finalVal = entries[entries.length - 1];
      }
    }

    if (typeof finalVal !== "number" || !isFinite(finalVal)) {
      return { value: null, error: "Expression did not return a finite number" };
    }
    return { value: finalVal, error: null };
  } catch (err: any) {
    const errMsg = err.message || "";
    const match = errMsg.match(/Undefined symbol (\S+)/);
    if (match) {
      const variableSlug = match[1];
      new MissingVariableError(variableSlug);
      return { value: null, error: `Missing variable: ${variableSlug}` };
    }
    return { value: null, error: errMsg };
  }
}

// 6. extractReferencedVariables
export function extractReferencedVariables(expression: string): string[] {
  try {
    const sanitized = sanitizeExpression(expression);
    const node = math.parse(sanitized);
    const referenced: string[] = [];

    node.traverse((n: any, _path: string, parent: any) => {
      if (n.isSymbolNode) {
        const name = n.name;
        // Exclude mathjs built-ins and custom registered helper functions (e.g. clamp, ifTrue)
        const isBuiltin = name in math;
        // Exclude if it is the function identifier of a FunctionNode
        const isFunctionName = parent && parent.type === "FunctionNode" && parent.fn === n;

        if (!isBuiltin && !isFunctionName) {
          if (!referenced.includes(name)) {
            referenced.push(name);
          }
        }
      }
    });

    return referenced;
  } catch {
    return [];
  }
}

// 7. validateExpression
export function validateExpression(expression: string): string | null {
  try {
    const sanitized = sanitizeExpression(expression);
    math.parse(sanitized);
    return null; // valid
  } catch (err: any) {
    return err.message || "Invalid expression";
  }
}
