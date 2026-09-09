import { getModulePath } from "./catalog";
export function getReturnsPath(states: Parameters<typeof getModulePath>[1]) { return getModulePath("returns", states); }
