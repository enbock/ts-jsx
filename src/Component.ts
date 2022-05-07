// noinspection JSUnusedLocalSymbols

import ShadowDom, {ShadowDomElement} from './ShadowDom';
import ShadowRenderer from './ShadowRenderer';

export interface ShadowComponentReceiver {
    setComponent(view: Component): void;
}

export interface ComponentProperties {
    attach?: ShadowComponentReceiver;

    [name: string]: any;
}

export function mock<T>(component: T): void {
    const staticReference: typeof Component = component as any;

    function mockedFactory<T extends Component>(): T {
        let node: T = document.createElement('div') as any;
        const output: string = 'test::' + staticReference.name + ':';
        const textNode: Text = document.createTextNode(output);
        node.appendChild(textNode);
        node.updateProps = function (props: any) {
            const shownProps: any = {...props};
            if (shownProps.hasOwnProperty('attach')) shownProps.attach = shownProps.attach.toString();
            if (shownProps.hasOwnProperty('adapter')) shownProps.adapter = shownProps.adapter.toString();
            textNode.nodeValue = output + JSON.stringify(shownProps);
        };
        return node;
    }

    staticReference.factory = mockedFactory;
}

// noinspection JSUnusedGlobalSymbols
export default class Component<Properties extends ComponentProperties = ComponentProperties> extends HTMLElement {
    public static dependencyInjection: any[] = [];
    public static componentReceiver: ShadowComponentReceiver | undefined;
    public name: string = '';
    private renderer: typeof ShadowRenderer | undefined;

    constructor(
        protected props: Properties & ComponentProperties,
        ...dependencyInjection: any
    ) {
        super();
        this.attachShadow({mode: 'open'});
    }

    public set engine(value: typeof ShadowRenderer) {
        this.renderer = value;
    }

    public static factory(props: any): Component {
        return new this(props, ...this.dependencyInjection);
    }

    public updateProps(props: Properties): void {
        this.props = {...this.props, ...props};
        this.renderShadow();
    }

    public connectedCallback(): void {
        this.renderShadow();
    }

    public disconnectedCallback(): void {
        if (this.shadowRoot === null) return;
        while (this.shadowRoot.childNodes.length && this.shadowRoot.lastChild != null) {
            this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        }
    }

    public render(): ShadowDomElement | ShadowDomElement[] {
        return ShadowDom.createElement(
            'info',
            {
                children: [
                    'Implement ',
                    ShadowDom.createElement(
                        'textarea',
                        {
                            children: 'public render(): ShadowDomElement | ShadowDomElement[] {\n    return \'add your content here\';\n}'
                        }
                    ),
                    ' to the component ',
                    ShadowDom.createElement(
                        'code',
                        {
                            children: (this as any).__proto__.constructor.name + '(' + this.localName + ')'
                        }
                    ),
                    '.'
                ]
            }
        );
    }

    protected renderShadow(): void {
        if (this.renderer !== undefined) this.renderer.renderShadow(this);
    }
}
