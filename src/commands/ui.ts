/* eslint-disable @typescript-eslint/no-unused-vars */
import * as vscode from "vscode";
import { logger } from "../logger";

export async function openPanel(context: vscode.ExtensionContext) {
  await vscode.commands.executeCommand("cloudflaretunnel.list.focus");
}

export async function openOutputChannel(context: vscode.ExtensionContext) {
  logger.show();
}
