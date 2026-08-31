/**
 * The context object and its accessor hook.
 *
 * Kept apart from SystemContext.jsx so that file exports nothing but the
 * provider component. React Fast Refresh can only preserve state across edits
 * when a module's exports are all components; mixing a hook in with the
 * provider silently breaks hot reloading of the entire application, which
 * matters when the alternative is re-downloading model weights on every save.
 */

import { createContext, useContext } from "react";

export const SystemContext = createContext(null);

export function useSystem() {
  const context = useContext(SystemContext);

  if (!context) {
    throw new Error("useSystem must be used inside <SystemProvider>.");
  }

  return context;
}
