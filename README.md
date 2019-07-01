# Buidler TypeScript plugin boilerplate

This is a sample Buidler plugin written in TypeScript. Creating a Buidler plugin
can be as easy as extracting a part of your config into a different file, 
wrapping it in a function and publishing it to npm.

This sample project contains an example on how to do that, but also comes with 
many more features:

- A mocha test suit ready to use
- TravisCI already setup
- A package.json with scripts and publishing info
- Examples on how to do different things

## Installation

We recommend developing Buidler plugins using yarn. To start working on your 
project, just run

```bash
npm install
```

## Plugin development

Make sure to read our [Plugin Development Guide](https://buidler.dev/guides/create-plugin.html) 
to learn how to build a plugin, and our 
[best practices to create high-quality plugins](https://buidler.dev/documentation/#plugin-development-best-practices).

## Testing

Running `npm run test` will run every test located in the `test/` folder. They 
use [mocha](https://mochajs.org) and [chai](https://www.chaijs.com/), 
but you can customize them.

We recommend creating unit tests for your own modules, and integration tests for 
the interaction of the plugin with Buidler and its dependencies.

## Linting and autoformat

All all of Buidler projects use [prettier](https://prettier.io/) and 
[tslint](https://palantir.github.io/tslint/).

You can check if your code style is correct by running `npm run lint`, and fix 
it with `npm run lint:fix`.

## Building the project

Just run `npm run buidl` ️👷‍

## README file

This README describes this boilerplate project, but won't be very useful to your
plugin users.

Take a look at `README-TEMPLATE.md` for an example of what a Buidler plugin's
README should look like.
