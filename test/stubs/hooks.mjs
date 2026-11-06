// Lets `node --test` load modules that import Herdr's runtime, which only exists inside the app.
const stubs = { herdr: "herdr.mjs", "gpui-kit": "gpui.mjs", "gpui-base": "gpui.mjs" };

export async function resolve(specifier, context, next) {
  if (stubs[specifier]) return { url: new URL(stubs[specifier], import.meta.url).href, shortCircuit: true };
  return next(specifier, context);
}
