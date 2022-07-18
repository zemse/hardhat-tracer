import { colorKey } from "../colors";

export function formatObject(obj: any) {
  return Object.entries(obj)
    .map((entries) => {
      let [key, value] = entries;
      if (typeof value === "string") {
        value = `"${value}"`;
      } else if (Array.isArray(value)) {
        value = `[${value.map((v) => formatObject(v))}]`;
      } else if (typeof value === "object") {
        value = `{${formatObject(value)}}`;
      }
      return `${colorKey(key + "=")}${value}`;
    })
    .join(", ");
}
