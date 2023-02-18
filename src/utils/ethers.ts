export function removeNumericFromEthersResult(obj: any) {
  const _obj = { ...obj };
  const keys = Object.keys(_obj);
  let removed = 0;
  for (let i = 0; i < keys.length; i++) {
    if (!isNaN(Number(keys[i]))) {
      delete _obj[keys[i]];
      removed++;
    }
  }
  // if all keys are numeric, return null
  if (keys.length === removed) return null;

  // return Result object without numeric keys
  return _obj;
}
