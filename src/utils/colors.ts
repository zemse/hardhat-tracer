import chalk from "chalk";

export const colorLabel = (...text: string[]) =>
  chalk.italic(chalk.yellowBright(...text));

export const colorContract = chalk.cyan;
export const colorFunctionSuccess = chalk.green;
export const colorFunctioFail = chalk.red;
export const colorEvent = chalk.yellow;
export const colorError = chalk.red;
export const colorConsole = chalk.blue;
export const colorKey = chalk.magenta;
export const colorValue = chalk.whiteBright;
export const colorExtra = chalk.gray;
export const colorSload = chalk.blueBright;
export const colorSstore = chalk.redBright;
export const colorMload = chalk.blueBright;
export const colorMstore = chalk.redBright;
export const colorNameTag = chalk.italic;
export const colorIndexed = chalk.italic;

export const colorWarning = chalk.yellow;

export function removeColor(str: string) {
  return str.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ""
  );
}
