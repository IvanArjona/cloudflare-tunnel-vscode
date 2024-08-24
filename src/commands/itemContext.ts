import * as vscode from "vscode";
import { CloudflareTunnel } from "../tunnel";
import { selectRunningTunnelIfUndefined } from "../utils";

export async function openTunnelExternal(
  tunnel?: CloudflareTunnel
): Promise<void> {
  tunnel = await selectRunningTunnelIfUndefined();
  const uri = vscode.Uri.parse(tunnel.tunnelUri);
  const externalUri = await vscode.env.asExternalUri(uri);
  await vscode.env.openExternal(externalUri);
}

export async function copyTunnelUriToClipboard(
  tunnel?: CloudflareTunnel
): Promise<void> {
  tunnel = await selectRunningTunnelIfUndefined();
  vscode.env.clipboard.writeText(tunnel.tunnelUri);
}
