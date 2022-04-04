import ShadowRenderer from '@enbock/ts-jsx/ShadowRenderer';

const node:HTMLElement = ShadowRenderer.render(<div>Hello World!</div>);
document.body.append(node);
