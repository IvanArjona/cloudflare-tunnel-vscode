/* eslint-disable @typescript-eslint/no-unused-vars */
import * as vscode from "vscode";
import { CloudflareTunnel } from "../tunnel";

export async function openTunnelExternal(
  context: vscode.ExtensionContext,
  tunnel: CloudflareTunnel
): Promise<void> {
  const uri = vscode.Uri.parse(tunnel.tunnelUri);
  const externalUri = await vscode.env.asExternalUri(uri);
  await vscode.env.openExternal(externalUri);
}

export async function copyTunnelUriToClipboard(
  context: vscode.ExtensionContext,
  tunnel: CloudflareTunnel
): Promise<void> {
  vscode.env.clipboard.writeText(tunnel.tunnelUri);
}
