import * as vscode from "vscode";
import { logger } from "../logger";

export async function openPanel() {
  await vscode.commands.executeCommand("cloudflaretunnel.list.focus");
}

export async function openOutputChannel() {
  logger.show();
}
