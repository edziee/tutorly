export const TOKEN_UNITS_PER_TOKEN = 100;

export function isValidTokenAmount(tokens) {
  if (!Number.isFinite(tokens) || tokens <= 0) return false;
  const units = Math.round(tokens * TOKEN_UNITS_PER_TOKEN);
  return Number.isSafeInteger(units) &&
    units > 0 &&
    Math.abs(tokens * TOKEN_UNITS_PER_TOKEN - units) <= 1e-7;
}

export function toTokenUnits(tokens) {
  if (!Number.isFinite(tokens) || tokens <= 0) {
    throw new Error('Enter a token amount greater than zero.');
  }
  const units = Math.round(tokens * TOKEN_UNITS_PER_TOKEN);
  if (!isValidTokenAmount(tokens)) {
    if (!Number.isSafeInteger(units) || units <= 0) {
      throw new Error('Enter a valid token amount with no more than two decimal places.');
    }
    throw new Error('Token amounts can have at most two decimal places.');
  }
  return units;
}

export function formatTokenUnits(units) {
  if (!Number.isSafeInteger(units) || units < 0) return '—';
  const tokens = units / TOKEN_UNITS_PER_TOKEN;
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: units % TOKEN_UNITS_PER_TOKEN === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(tokens);
}

export function getTokenBalanceLabel(availableUnits, heldUnits) {
  if (!Number.isSafeInteger(availableUnits) || !Number.isSafeInteger(heldUnits)) {
    return 'Token balance unavailable';
  }
  return `${formatTokenUnits(availableUnits)} tokens available, ${formatTokenUnits(heldUnits)} on hold`;
}
