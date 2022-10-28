import fsx from "fs-extra";
import path from "path";

let f = fsx
  .readFileSync(path.resolve(__dirname, "node_modules/hardhat/console.sol"))
  .toString("utf8");

let i = 0;

let c = 0;

let output: string[] = [];

while (true) {
  c++;
  i = f.search('"');
  if (i === -1) {
    break;
  }
  f = f.slice(i + 1);
  const i2 = f.search('"');

  const signature = f.slice(0, i2);
  const types = signature.slice(4, -1).split(",");

  output.push(`function log(${types.map((t) => t + " " + t).join(",")})`);

  f = f.slice(i2 + 1);
}

fsx.writeJSONSync(
  path.resolve(__dirname, "src/format/console-log-methods.json"),
  output,
  { spaces: 2 }
);
