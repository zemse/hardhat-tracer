import { SEPARATOR } from "../constants";
import { colorKey, colorValue } from "../utils";

export function formatObject(obj: any) {
  return Object.entries(obj)
    .map((entries) => {
      const [key] = entries;
      let [, value] = entries;
      if (typeof value === "string") {
        value = colorValue(`"${value}"`);
      } else if (Array.isArray(value)) {
        value = `[${value.map((v) => formatObject(v))}]`;
      } else if (typeof value === "object") {
        value = `{${formatObject(value)}}`;
      }
      return `${colorKey(key + SEPARATOR)}${value}`;
    })
    .join(", ");
}
