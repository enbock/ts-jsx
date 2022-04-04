import Component from './Component';

export default function ViewInjection<View>(
    view: View,
    ...dependencyInjection: any
): View {
    (view as any as typeof Component).dependencyInjection = dependencyInjection;
    return view;
}
