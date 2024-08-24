import * as vscode from "vscode";
import { logger } from "../logger";
import * as constants from "../constants";

export async function openPanel() {
  const command = `${constants.Views.list}.focus`;
  await vscode.commands.executeCommand(command);
}

export async function openOutputChannel() {
  logger.show();
}
