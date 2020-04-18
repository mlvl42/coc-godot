import { ExtensionContext } from "coc.nvim";

import GDScriptLanguageClient, { ClientStatus } from "./GDScriptLanguageClient";
import log from "./utils/logging";

export default class GodotTools {
  private context: ExtensionContext;
  private client: GDScriptLanguageClient = null;
  private retryInterval: NodeJS.Timeout;

  constructor(p_context: ExtensionContext) {
    this.context = p_context;
    this.retryInterval = null;
    this.client = new GDScriptLanguageClient();
    this.client.watch_status(this.on_client_status_changed.bind(this));
  }

  public activate() {
    this.client.connect_to_server();
  }

  public deactivate() {
    this.client.stop();
  }

  private on_client_status_changed(status: ClientStatus) {
    switch (status) {
      case ClientStatus.PENDING:
        break;
      case ClientStatus.CONNECTED:
        if (this.retryInterval !== null) {
          clearInterval(this.retryInterval);
          this.retryInterval = null;
        }
        if (!this.client.started) {
          this.context.subscriptions.push(this.client.start());
        }
        break;
      case ClientStatus.DISCONNECTED:
        // retry
        if (this.retryInterval === null) {
          this.retryInterval = setInterval(
            this.retry_connect_client.bind(this),
            5000
          );
        }
        break;
      default:
        break;
    }
  }

  private retry_connect_client() {
    log.info("retrying to connect...");
    this.client.connect_to_server();
  }
}
