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
        if (result.props == null) return;
        if (result.component !== undefined) {
            (domNode as Component).updateProps(result.props);
            return;
        }
        if (result.tagName === 'input') {
            (domNode as HTMLInputElement).value = result.props.value;
        }
        for (const key of Object.keys(result.props)) {
            const isOnDashStyle: boolean = key.substring(0, 3) == 'on-';
            if (isOnDashStyle || key.match(/^on[A-Z]/) !== null) {
                const eventName:string = key.substring(isOnDashStyle ? 3 : 2).toLowerCase();
                (domNode as any)['on' + eventName] = result.props[key];
            } else
                domNode.setAttribute(key, result.props[key]);
        }
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
                    root.removeChild(removeNode[0].domNode);
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

                    if (shadowReplaceAmount == 0 && nodeInsertAmount == 0) throw new Error('RAUS!!');

                    const shadowToRemove: ShadowRendererNode[] = shadowNodes.splice(shadowCount, shadowReplaceAmount);
                    shadowToRemove.forEach((s: ShadowRendererNode) => {
                        root.removeChild(s.domNode);
                    });

                    const insertNodes: ShadowDomElement[] = results.splice(resultCount, nodeInsertAmount);
                    insertNodes.forEach((insertResult: ShadowDomElement) => {
                        const insertedShadow: ShadowRendererNode = ShadowRenderer.insertNode(shadowCount,
                            insertResult,
                            root,
                            shadowNodes);
                        if ((insertResult as ShadowDomNode).isNode === true)
                            ShadowRenderer.iterateLevel((insertResult as ShadowDomNode).children,
                                insertedShadow.domNode);
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
