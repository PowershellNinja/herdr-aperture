// A pretend facility. Terminal tN has shell pid N + 100; `busy` lists terminals
// whose shell has a child process. `duringIdleCheck` runs once, in the middle of
// the next idle check, with that check's answer already taken.
export const S = {};

export function reset() {
  Object.assign(S, { shared: {}, terminals: [], agents: [], panes: [], spaces: [], typed: [], busy: [], duringIdleCheck: null });
}
reset();

export const shared = (key) => S.shared[key];
export const setShared = (key, value) => { S.shared[key] = value; return null; };
export const agents = () => S.agents;
export const panes = () => S.panes;
export const terminals = () => S.terminals;
export const spaces = () => S.spaces;
export const window = () => ({ platform: "windows" });

export async function hc(args) {
  if (args[0] === "get") return { code: 0, stdout: JSON.stringify({ pid: Number(args[1].slice(1)) + 100 }) };
  S.typed.push(args.join(" "));
  return { code: 0, stdout: "" };
}

export async function exec(_program, args) {
  const pid = Number(/ParentProcessId=(\d+)/.exec(args.at(-1))[1]);
  const stdout = S.busy.includes(`t${pid - 100}`) ? "1\n" : "0\n";
  const during = S.duringIdleCheck;
  S.duringIdleCheck = null;
  await during?.();
  return { code: 0, stdout };
}

export const nextCommand = () => new Promise(() => {});
export const settings = () => ({ sounds: { enabled: false } });
export const openOverlay = () => "overlay", closeOverlay = () => null, props = () => ({});
export const run = () => null, home = () => "C:/", playSound = () => null, setAgentOrder = () => null;
export const layout = () => null, updates = () => ({ app: {}, core: {} });
