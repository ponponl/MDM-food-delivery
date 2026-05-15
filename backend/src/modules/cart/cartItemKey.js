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
  .filter((opt) => opt && opt.label)
  .map((opt) => ({
    groupName: String(opt.groupName || 'Tùy chọn'),
    label: String(opt.label),
    extraPrice: Number(opt.extraPrice) || 0
  }))
  .sort((a, b) => a.label.localeCompare(b.label));
};

export const buildItemKey = (itemId, options = []) => {
  const normalizedOptions = normalizeOptions(options);
  const signature = normalizedOptions
    .map((opt) => `${opt.groupName}:${opt.label}`)
    .join('|');

  const raw = `${itemId}|${signature}`;
  const hash = crypto.createHash('sha1').update(raw).digest('hex').slice(0, 16);

  return `item:${hash}`;
};

export const normalizeOptionsForStorage = (options = []) => normalizeOptions(options);
