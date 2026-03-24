import crypto from 'crypto';

const stableStringify = (value) => {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value !== 'object') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  const keys = Object.keys(value).sort();
  const entries = keys.map((key) => `${key}:${stableStringify(value[key])}`);
  return `{${entries.join(',')}}`;
};

const normalizeOptions = (options = []) => {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .filter((option) => option && option.name)
    .map((option) => ({
      name: String(option.name),
      value: option.value
    }))
    .sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) return nameCompare;
      return stableStringify(a.value).localeCompare(stableStringify(b.value));
    });
};

export const buildItemKey = (itemId, options = []) => {
  const normalizedOptions = normalizeOptions(options);
  const signature = normalizedOptions
    .map((option) => `${option.name}:${stableStringify(option.value)}`)
    .join('|');

  const raw = `${itemId}|${signature}`;
  const hash = crypto.createHash('sha1').update(raw).digest('hex').slice(0, 16);

  return `item:${hash}`;
};

export const normalizeOptionsForStorage = (options = []) => normalizeOptions(options);
