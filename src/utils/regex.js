const isMatchPattern = (pattern = '', string = '') => {
  if (!pattern.trim()) return true;
  const regexSafePattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(regexSafePattern, 'i').test(string);
};

export { isMatchPattern };
