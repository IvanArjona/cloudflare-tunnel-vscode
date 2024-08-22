/* eslint-disable @typescript-eslint/no-unused-vars */
import * as vscode from "vscode";
import { showInformationMessage } from "../utils";
import { cloudflared } from "../cmd/cloudflared";

export async function version(context: vscode.ExtensionContext): Promise<void> {
  const message = await cloudflared.version();
  showInformationMessage(message);
}
