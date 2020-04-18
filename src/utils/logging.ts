import { OutputChannel, workspace } from "coc.nvim";

export default class Logging {
  static _channel: OutputChannel | null = null;

  static setupChannel(name: string) {
    this._channel = workspace.createOutputChannel(name);
  }

  static get output(): OutputChannel {
    return this._channel;
  }

  static _dataToString(data: any): string {
    if (data instanceof Error) {
      if (typeof data.stack === "string") {
        return data.stack;
      }
      return (data as Error).message;
    }

    if (
      typeof data.success === "boolean" &&
      !data.success &&
      typeof data.message === "string"
    ) {
      return data.message;
    }

    if (typeof data === "string") {
      return data;
    }

    return data.toString();
  }

  static _logLevel(level: string, message: string, data?: any): void {
    if (!this.output) throw new Error("logger output is not setup");

    this.output.appendLine(
      `[${level} - ${new Date().toLocaleTimeString()}] ${message}`
    );
    if (data) {
      this.output.appendLine(this._dataToString(data));
    }
  }

  static info(message: string, data?: any): void {
    this._logLevel("INFO", message, data);
  }

  static warn(message: string, data?: any): void {
    this._logLevel("WARN", message, data);
  }

  static error(message: string, data?: any): void {
    this._logLevel("ERROR", message, data);
  }
}
