[![buidler](https://buidler.dev/buidler-plugin-badge.svg?1)](https://buidler.dev)
# buidler-example-plugin

_A one line description of the plugin_

[Buidler](http://getbuidler.com) plugin example. 

## What

<_A longer, one paragraph, description of the plugin_>

This plugin will help you with world domination by implementing a simple tic-tac-toe in the terminal.

## Installation

<_A step-by-step guide on how to install the plugin_>

```bash
npm install <your npm package name> [list of peer dependencies]
```

And add the following statement to your `buidler.config.js`:

```js
usePlugin("<your plugin npm package name>");
```

## Required plugins

<_The list of all the required Buidler plugins if there are any_>

- [@nomiclabs/buidler-web3](https://github.com/nomiclabs/buidler/tree/master/packages/buidler-web3)

## Tasks

<_A description of each task added by this plugin. If it just overrides internal 
tasks, this may not be needed_>

This plugin creates no additional tasks.
<_or_>
This plugin adds the _example_ task to Buidler:
```
output of npx buidler help example
``` 

## Environment extensions

<_A description of each extension to the Buidler Runtime Environment_>

This plugin extends the Buidler Runtime Environment by adding an `example` field
whose type is `ExampleBuidlerRuntimeEnvironmentField`.

## Configuration

<_A description of each extension to the BuidlerConfig or to its fields_>

This plugin extends the `BuidlerConfig`'s `ProjectPaths` object with an optional 
`newPath` field.

This is an example of how to set it:

```js
module.exports = {
  paths: {
    newPath: "./new-path"
  }
};
```

## Usage

<_A description of how to use this plugin. How to use the tasks if there are any, etc._>

There are no additional steps you need to take for this plugin to work.

Install it and access ethers through the Buidler Runtime Environment anywhere 
you need it (tasks, scripts, tests, etc).

## TypeScript support

<_This section is needed if you are extending types in your plugin_>

You need to add this to your `tsconfig.json`'s `files` array: 
`"node_modules/<npm package name>/src/type-extensions.d.ts"`
