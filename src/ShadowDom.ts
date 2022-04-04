// noinspection JSUnusedGlobalSymbols
import Component, {ComponentProperties} from './Component';

export type ShadowDomElement = ShadowDomNode | string

export interface ShadowDomNode {
    isNode: boolean,
    component?: typeof Component,
    props: ComponentProperties,
    tagName: string
    children: (ShadowDomNode | string)[]
}

type JSXElement = string | typeof Component | ShadowDomElement[];
type JSXElementCollection = ShadowDomElement | (ShadowDomElement | ShadowDomElement[])[];
type JSXChildren = { children?: JSXElementCollection };

export default class ShadowDom {
    private static definedComponents: Map<typeof Component, string> = new Map<typeof Component, string>();
    private static componentTags: string[] = [];

    public static createElement(
        component: JSXElement,
        props: ComponentProperties & JSXChildren
    ): ShadowDomElement | ShadowDomElement[] {
        const subNodes: JSXElementCollection = props.children || [];
        delete (props.children);
        if (Array.isArray(component)) return component;
        let jsxName: string = component as string;
        let isComponent: boolean = false;
        if (
            component instanceof Function
            || (
                typeof Component == 'function'
                && (component as any).name
                && ((component as any).name as string).match(/^[A-Z]/) !== null
            )
        ) {
            component = component as typeof Component;
            isComponent = true;
            if (ShadowDom.definedComponents.has(component) == false) {
                const tagName: string = component.name
                    .replace(/([A-Z])/g, '-$1')
                    .toLowerCase()
                    .replace(/^-/, '')
                ;
                let counter: number = 0;
                do {
                    jsxName = tagName + '-' + counter.toString();
                    counter++;
                } while (ShadowDom.componentTags.filter((n) => n == jsxName).length > 0);
                ShadowDom.componentTags.push(jsxName);
                ShadowDom.definedComponents.set(component, jsxName);
                customElements.define(jsxName, component as any);
            } else {
                jsxName = ShadowDom.definedComponents.get(component) as string;
            }
        }

        const children: ShadowDomElement[] = [];
        ShadowDom.flattenChildren(children, subNodes);

        return {
            isNode: true,
            component: isComponent ? (component as typeof Component) : undefined,
            tagName: jsxName,
            props: props,
            children: children
        };
    }

    private static flattenChildren(children: ShadowDomElement[], subNodes: JSXElementCollection | undefined): void {
        if (subNodes === undefined) return;
        if (Array.isArray(subNodes) != true) {
            children.push(subNodes as ShadowDomElement);
            return;
        }
        (subNodes as (ShadowDomElement | ShadowDomElement[])[]).forEach((c: ShadowDomElement | ShadowDomElement[]) => {
            if (Array.isArray(c)) ShadowDom.flattenChildren(children, c);
            else children.push(c);
        });
    }
}
