import { workspace, ExtensionContext } from "coc.nvim";
import log from "./utils/logging";
import GodotTools from "./GodotTools";

export async function activate(context: ExtensionContext): Promise<void> {
  // init
  const config = workspace.getConfiguration().get<any>("godot", {});
  if (!config.enable) return;
  log.setupChannel("godot");

  let gd = new GodotTools(context);
  gd.activate();
}
