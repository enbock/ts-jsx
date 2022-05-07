import ShadowRenderer from './ShadowRenderer';
import {ShadowDomElement} from './ShadowDom';

export default class TestRenderer {
    public static render(jsx: ShadowDomElement):HTMLElement {
        const view: HTMLElement = ShadowRenderer.render(jsx);
        const container: HTMLElement = document.createElement('container');
        for (const shadow of (view.shadowRoot as any).shadowNodes) container.appendChild(shadow.domNode);
        return container;
    }
}
