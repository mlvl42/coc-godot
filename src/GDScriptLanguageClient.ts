import {
  Disposable,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  workspace,
} from "coc.nvim";

import log from "./utils/logging";

import {
  MessageIO,
  MessageIOReader,
  MessageIOWriter,
  Message,
} from "./MessageIO";

function getClientOptions(): LanguageClientOptions {
  return {
    // Register the server for plain text documents
    documentSelector: [
      { scheme: "file", language: "gdscript" },
      { scheme: "file", language: "gdscript3" },
      { scheme: "untitled", language: "gdscript" },
      { scheme: "untitled", language: "gdscript3" },
    ],
  };
}

function get_server_uri(): string {
  const config = workspace.getConfiguration().get<any>("godot", {});
  let port = 6008;
  if (config.lsp_server_port) port = config.lsp_server_port;
  return `ws://localhost:${port}`;
}

const io = new MessageIO();
const serverOptions: ServerOptions = () => {
  return new Promise((resolve, reject) => {
    resolve({
      reader: new MessageIOReader(io),
      writer: new MessageIOWriter(io),
    });
  });
};

export enum ClientStatus {
  PENDING,
  DISCONNECTED,
  CONNECTED,
}

export default class GDScriptLanguageClient extends LanguageClient {
  public io: MessageIO = io;

  private _started: boolean = false;
  private _status: ClientStatus;
  private _status_changed_callbacks: ((v: ClientStatus) => void)[] = [];
  private _initialize_request: Message;

  public get started(): boolean {
    return this._started;
  }
  public get status(): ClientStatus {
    return this._status;
  }
  public set status(v: ClientStatus) {
    if (this._status != v) {
      this._status = v;
      for (const callback of this._status_changed_callbacks) {
        callback(v);
      }
    }
  }

  public watch_status(callback: (v: ClientStatus) => void) {
    if (this._status_changed_callbacks.indexOf(callback) == -1) {
      this._status_changed_callbacks.push(callback);
    }
  }

  constructor() {
    super("GDScriptLanguageClient", serverOptions, getClientOptions());
    this.status = ClientStatus.PENDING;
    this.io.on("disconnected", this.on_disconnected.bind(this));
    this.io.on("connected", this.on_connected.bind(this));
    this.io.on("send_message", this.on_send_message.bind(this));
  }

  connect_to_server() {
    log.info("connecting");
    this.status = ClientStatus.PENDING;
    io.connect_to_language_server(get_server_uri());
  }

  start(): Disposable {
    this._started = true;
    return super.start();
  }

  private on_send_message(message: Message) {
    if ((message as any).method == "initialize") {
      this._initialize_request = message;
    }
  }

  private on_connected() {
    if (this._initialize_request) {
      this.io.writer.write(this._initialize_request);
    }
    log.info("connected");
    this.status = ClientStatus.CONNECTED;
  }

  private on_disconnected() {
    log.info("disconnected");
    this.status = ClientStatus.DISCONNECTED;
  }
}
