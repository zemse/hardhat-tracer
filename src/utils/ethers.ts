export function removeNumericFromEthersResult(obj: any) {
  const _obj = { ...obj };
  const keys = Object.keys(_obj);
  let removed = 0;
  for (const key of keys) {
    if (!isNaN(Number(key))) {
      delete _obj[key];
      removed++;
    }
  }
  // if all keys are numeric, return null
  if (keys.length === removed) {
    return null;
  }

  // return Result object without numeric keys
  return _obj;
}
