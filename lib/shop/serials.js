function serialRange(count) {
  return Array.from({ length: Math.max(0, Number(count) || 0) }, (_, index) => index + 1);
}

function parseSerialNumbers(value) {
  if (Array.isArray(value)) return cleanSerialNumbers(value);

  const numbers = [];
  for (const part of String(value || "").split(",")) {
    const token = part.trim();
    if (!token) continue;
    const match = token.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error("Invalid serial numbers.");
    const start = Number(match[1]);
    const end = Number(match[2] || match[1]);
    if (start < 1 || end < start || end - start > 9999) throw new Error("Invalid serial numbers.");
    for (let number = start; number <= end; number += 1) numbers.push(number);
  }
  return cleanSerialNumbers(numbers);
}

function cleanSerialNumbers(numbers) {
  const clean = numbers.map(Number);
  if (clean.some((number) => !Number.isInteger(number) || number < 1)) {
    throw new Error("Invalid serial numbers.");
  }
  return [...new Set(clean)].sort((a, b) => a - b);
}

module.exports = { cleanSerialNumbers, parseSerialNumbers, serialRange };
