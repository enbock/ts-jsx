import Component from './Component';
import {ShadowDomElement, ShadowDomNode} from './ShadowDom';

interface ShadowRendererNode {
    node: ShadowDomElement,
    domNode: HTMLElement
}

type NextMatch = { shadowCount: number, resultCount: number };

export default class ShadowRenderer {
    public static render(jsx: ShadowDomElement): HTMLElement {
        const root: HTMLElement = document.createElement('unknown');
        ShadowRenderer.iterateLevel([jsx], root);
        return root.firstChild as HTMLElement;
    }

    public static renderShadow(component: Component): void {
        if (component.shadowRoot === null) return;
        const nodes: ShadowDomElement | ShadowDomElement[] = component.render();
        ShadowRenderer.iterateLevel(nodes, component.shadowRoot);
    }

    private static renderResult(result: ShadowDomElement): HTMLElement {
        if (typeof result != 'object') {
            return document.createTextNode(result) as any;
        }

        if (result.component === undefined) {
            const domElement = document.createElement(result.tagName);
            if (result.props != null) ShadowRenderer.updateNode(result, domElement);
            return domElement;
        }

        const component: Component = result.component.factory(result.props);
        component.engine = this;
        if (result.props != null) {
            ShadowRenderer.updateNode(result, component);
            if (result.props.attach !== undefined) result.props.attach.setComponent(component);
        }
        if (result.componentReceiver !== undefined) result.componentReceiver.setComponent(component);

        return component;
    }

    private static createShadow(renderResult: ShadowDomElement): ShadowRendererNode {
        const domNode: HTMLElement = ShadowRenderer.renderResult(renderResult);
        const node: ShadowDomNode = renderResult as ShadowDomNode;

        return {
            node: node,
            domNode: domNode
        };
    }

    private static updateNode(result: ShadowDomNode, domNode: HTMLElement | Component) {
        const nextFrameCalls: Array<() => void> = [];
        if (result.props == null) return;
        if (result.component !== undefined) {
            (domNode as Component).updateProps(result.props);
            return;
        }
        for (const key of Object.keys(result.props)) {
            const isOnDashStyle: boolean = key.substring(0, 3) == 'on-';
            if (isOnDashStyle || key.match(/^on[A-Z]/) !== null) {
                const eventName: string = key.substring(isOnDashStyle ? 3 : 2).toLowerCase();
                (domNode as any)['on' + eventName] = result.props[key];
            } else {
                const newValue:string = result.props[key];
                const oldValue: string = domNode.getAttribute(key) || '';
                const isExisting: boolean = domNode.hasAttribute(key);
                if(isExisting == false || oldValue != newValue) domNode.setAttribute(key, result.props[key]);
            }
        }
        const attributesToRemove: Array<string> = [];
        for (let ai: number = 0; ai < domNode.attributes.length; ai++) {
            const key: string = domNode.attributes.item(ai)!.name;
            if (Object.hasOwn(result.props, key)) continue;
            attributesToRemove.push(key);
        }
        for (let key of attributesToRemove) {
            try {
                domNode.attributes.removeNamedItem(key);
            } catch {
                console.warn('TS-JSX: Unexpected missing attribute \'' + key + '\' while cleaning attributes.');
            }
        }
        if (domNode.tagName.toUpperCase() == 'INPUT') {
            if (result.props.hasOwnProperty('value')) {
                (<HTMLInputElement>domNode).value = result.props.value;
            }
            if (String(domNode.getAttribute('type')).toLowerCase() == 'checkbox') {
                (<HTMLInputElement>domNode).checked = result.props.checked || result.props.checked === '';
            }
        }
        if (domNode.tagName.toUpperCase() == 'SELECT' && result.props.hasOwnProperty('value')) {
            nextFrameCalls.push(function updateSelectIndex(): void {
                const options: HTMLCollectionOf<HTMLOptionElement> =
                    <HTMLCollectionOf<HTMLOptionElement>>domNode.getElementsByTagName('OPTION');
                for (let i = 0; i < options.length; i++) {
                    if (result.props.value != options[i].value) continue;
                    if (domNode.hasOwnProperty('selectedValue'))
                        (<any>domNode).selectedValue = result.props.value;
                    (<HTMLSelectElement>domNode).selectedIndex = i;
                }
            });
        }

        const handlerCallback: () => void = () => nextFrameCalls.forEach(c => c());
        if (window.requestAnimationFrame) window.requestAnimationFrame(handlerCallback);
        else setTimeout(handlerCallback, 1);
    }

    private static iterateLevel(results: ShadowDomElement | ShadowDomElement[], root: HTMLElement | ShadowRoot): void {
        results = Array.isArray(results) ? results as ShadowDomElement[] : [results as ShadowDomElement];
        const shadowNodes: ShadowRendererNode[] = (root as any).shadowNodes === undefined
            ? (root as any).shadowNodes = []
            : (root as any).shadowNodes
        ;
        let shadowCount = 0;
        let resultCount = 0;
        while (shadowCount <= shadowNodes.length || resultCount <= results.length) {
            if (resultCount >= results.length) {
                if (shadowCount < shadowNodes.length) {
                    const removeNode: ShadowRendererNode[] = shadowNodes.splice(shadowCount, 1);
                    try {
                        root.removeChild(removeNode[0].domNode);
                    } catch {
                        console.warn('TS-JSX: Unexpected child placement while removal.');
                    }
                    continue;
                } else {
                    break;
                }
            }
            const result: ShadowDomNode = results[resultCount] as ShadowDomNode;
            let shadow: ShadowRendererNode;
            if (shadowCount >= shadowNodes.length) shadow =
                ShadowRenderer.insertNode(shadowCount, result, root, shadowNodes);
            else {
                shadow = shadowNodes[shadowCount];
                let isSame: boolean = ShadowRenderer.isSameShadowNode(shadow, result);
                if (isSame == false) {
                    const match: NextMatch = ShadowRenderer.findNextMatch(shadowCount,
                        shadowNodes,
                        resultCount,
                        results);

                    const shadowReplaceAmount = match.shadowCount - shadowCount;
                    const nodeInsertAmount = match.resultCount - resultCount;

                    if (shadowReplaceAmount == 0 && nodeInsertAmount == 0) throw new Error(
                        'TS-JSX: Unexpected nothing to change.');

                    const shadowToRemove: ShadowRendererNode[] = shadowNodes.splice(shadowCount, shadowReplaceAmount);
                    shadowToRemove.forEach((s: ShadowRendererNode) => {
                        try {
                            root.removeChild(s.domNode);
                        } catch {
                            console.warn('TS-JSX: Unexpected child placement while removal.');
                        }
                    });

                    const insertNodes: ShadowDomElement[] = results.splice(resultCount, nodeInsertAmount);
                    insertNodes.forEach((insertResult: ShadowDomElement) => {
                        const insertedShadow: ShadowRendererNode = ShadowRenderer.insertNode(shadowCount,
                            insertResult,
                            root,
                            shadowNodes);
                        if ((insertResult as ShadowDomNode).isNode === true)
                            ShadowRenderer.iterateLevel(
                                (insertResult as ShadowDomNode).children,
                                insertedShadow.domNode
                            );
                        shadowCount++;
                    });

                    continue;
                } else ShadowRenderer.updateNode(result, shadow.domNode);
            }

            if (result.isNode === true) ShadowRenderer.iterateLevel(result.children, shadow.domNode);

            shadowCount++;
            resultCount++;
        }
    }

    private static insertNode(
        shadowCount: number,
        result: ShadowDomElement,
        root: HTMLElement | ShadowRoot,
        shadowNodes: ShadowRendererNode[]
    ): ShadowRendererNode {
        const shadow: ShadowRendererNode = ShadowRenderer.createShadow(result);
        shadowNodes.splice(shadowCount, 0, shadow);
        if (root.childNodes.length <= shadowCount) root.appendChild(shadow.domNode);
        else root.insertBefore(shadow.domNode, root.childNodes[shadowCount]);

        return shadow;
    }

    private static isSameShadowNode(shadow: ShadowRendererNode, result: ShadowDomElement): boolean {
        const node: ShadowDomNode = result as ShadowDomNode;
        return (
            (shadow.node as ShadowDomNode).isNode === node.isNode
            && (
                (
                    (shadow.node as ShadowDomNode).isNode !== true
                    && shadow.node == result
                ) || (
                    (shadow.node as ShadowDomNode).isNode === true
                    && (shadow.node as ShadowDomNode).tagName == node.tagName
                    && (shadow.node as ShadowDomNode).component === node.component
                )
            )
        );
    }

    private static findNextMatch(
        shadowCount: number,
        shadowNodes: ShadowRendererNode[],
        resultCount: number,
        results: ShadowDomElement[]
    ): NextMatch {
        for (let sc: number = shadowCount; sc < shadowNodes.length; sc++)
            for (let rc: number = resultCount; rc < results.length; rc++) {
                const shadow: ShadowRendererNode = shadowNodes[sc];
                const result: ShadowDomElement = results[rc];
                if (ShadowRenderer.isSameShadowNode(shadow, result)) return {shadowCount: sc, resultCount: rc};
            }

        return {shadowCount: shadowNodes.length, resultCount: results.length};
    }
}
