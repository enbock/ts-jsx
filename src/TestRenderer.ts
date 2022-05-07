import ShadowRenderer from './ShadowRenderer';
import {ShadowDomElement} from './ShadowDom';
import Component from './Component';

export default class TestRenderer {
    public static render(jsx: ShadowDomElement): HTMLElement {
        const view: any = ShadowRenderer.render(jsx);
        view.renderer = this;
        TestRenderer.updateContainer(view);
        return view as HTMLElement;
    }

    public static renderShadow(component: Component): void {
        ShadowRenderer.renderShadow(component);
        TestRenderer.updateContainer(component);
    }

    private static updateContainer(view: any) {
        while (view.children.length) {
            view.removeChild(view.firstChild!);
        }
        for (const shadow of (view.shadowRoot as any).shadowNodes) view.appendChild(shadow.domNode);
    }
}
