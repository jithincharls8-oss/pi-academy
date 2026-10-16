import { createContext, useContext } from 'react';

/** True while a PI tool mockup is open full-screen (no app sidebar or header). */
export const ToolModeContext = createContext(false);

export function useToolMode(): boolean {
  return useContext(ToolModeContext);
}

const TOOL_PATHS = /^\/sandbox\/(explorer|smt|vision|webapi|datalink|compression)(\/|$)/;

export function isToolPath(pathname: string): boolean {
  return TOOL_PATHS.test(pathname);
}
