# TypeScript - JSX

A simple JSX rendering for Clean Code architectures.

## Motivation

In Clean Code we have "program-control-flow" separated from "view-rendering-flow".

My most favorit framework is React. But for the last years was React slightly "overdosed".    
It has a lot of nice features, which I not need. What I need is **just rendering into DOM**.

So I started in early 2022 this absolute small JSX rendering into **[Shadow DOM v1]**.

[Shadow DOM v1]: https://web.dev/shadowdom-v1/

## Prolog

Thanks to [Uncle Bob] and [Software craftsmanship] to turn my latest projects into a hugh success by just following the
principles.

Implementing new features, changing any feature in the project, react to ideas of our customers: All is possible, just
in time, without to be scary any time and without risking the success of the project.

[Uncle Bob]: https://cleancoders.com/

[Software craftsmanship]: https://en.wikipedia.org/wiki/Software_craftsmanship

## Getting started

Installing library

```shell
npm install --save-dev typescript @enbock/ts-jsx
```

As next, we need a system, which allows to compress all the code together.    
[Webpack] is here a nice way to do so:

```shell
npm install --save-dev webpack webpack-cli webpack-dev-server ts-loader style-loader css-loader html-webpack-plugin
```

Use the [example webpack.config.js] to get a simple project start.

And testing? I'd like to use [Jest] (with TypeScript [ts-jest]) and [Testing-Library] as well:

```shell
npm install --save-dev jest jest-mock-extended ts-jest @testing-library/dom @testing-library/jest-dom jest-environment-jsdom
```

Now we need to configure the TypeScript compiler to accept react-jsx with this tiny library:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@enbock/ts-jsx"
  }
}
```

[Full example of tsconfig.js]

Finally, we add some start scripts in our package.json:

```json
{
  "scripts": {
    "start": "webpack serve --open --mode development --no-open --no-live-reload --no-hot --stats-error-details",
    "build": "webpack --mode production",
    "test": "jest"
  }
}
```

[Full example of package.json]

[Webpack]: https://webpack.js.org/

[Testing-Library]: https://testing-library.com/

[Jest]: https://jestjs.io/

[ts-jest]: https://kulshekhar.github.io/ts-jest/

[example webpack.config.js]: example/webpack.config.js

[Full example of tsconfig.js]: example/tsconfig.json

[Full example of package.json]: example/package.json

## Step 1: The first page

Let's start with a "Hello World" page.

*Notice:* The follow examples can be found at [the example project](https://github.com/enbock/ts-jsx-example-page).

### Intrinsic elements

We need to declare the JSX namespace for out project. A simple generic definition will work for the start:

File: [`src/global.d.ts`](example/step1/global.d.ts)

```typescript
declare namespace JSX {
    type Element = any;

    interface IntrinsicElements {
        [tag: string]: Element;
    }
}
```

### Main program

Now we can write out first main program.    
To do so, we import the Shadow Renderer:

```typescript
import ShadowRenderer from '@enbock/ts-jsx/ShadowRenderer';
```

Now, we create the rendering:

```tsx
const node: HTMLElement = ShadowRenderer.render(<div>Hello World!</div>);
```

at least, we need to add it to the dom tree:

```tsx
document.body.append(node);
```

Here you find the [full example](example/step1/index.tsx) of the [`index.tsx`](example/step1/index.tsx).

Run `npm start` and open the local page http://localhost:3000/

*Notice:* The IntelliJ may report a missing React-Import. Just disable the warning:    
![Disable mit React import warning](https://raw.githubusercontent.com/enbock/ts-jsx/main/doc/images/disable_react_inspection.png)

## Step 2: The first component

It will be time for our first component. We want to create a simple button which alerts a "Hello":

Place: `src/HelloButton/`    
File: `src/HelloButton/ShadowDom/HelloButton.tsx`

To start, we are extending our view from the Shadow-`Component`:

```tsx
import Component from '@enbock/ts-jsx/Component';

export declare class HelloButton extends Component {
}
```

Now we can use the use it in the `index.tsx`:

```tsx
import ShadowRenderer from '@enbock/ts-jsx/ShadowRenderer';
import HelloButton from './HelloButton/ShadowDom/HelloButton';

const node: HTMLElement = ShadowRenderer.render(<HelloButton/>);
document.body.append(node);
```

Here we are! The first shadow component:
![first rendering](https://raw.githubusercontent.com/enbock/ts-jsx/main/doc/images/empty_component_output.png)

### Next:

[Create a button in the component](https://github.com/enbock/ts-jsx/blob/main/doc/step2/CreateAButton.md)

## LICENSE

[MIT](LICENSE)
