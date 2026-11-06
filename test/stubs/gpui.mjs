// Any element, any chain of calls: these tests look at state, not at what is drawn.
const element = () => {
  const el = new Proxy(function () {}, { get: () => () => el, apply: () => el });
  return el;
};
export const div = element, svg = element, image = element, h_flex = element, v_flex = element;
