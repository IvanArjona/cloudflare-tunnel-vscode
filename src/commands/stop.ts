/* eslint-disable @typescript-eslint/no-unused-vars */
import * as vscode from "vscode";
import { cloudflared } from "../cmd/cloudflared";
import { cloudflareTunnelProvider } from "../providers/tunnels";
import { showInformationMessage } from "../utils";
import { CloudflareTunnel } from "../tunnel";

export async function stopTunnel(
  context: vscode.ExtensionContext,
  tunnel: CloudflareTunnel
): Promise<void> {
  await cloudflared.stop(tunnel);
  await cloudflared.deleteTunnel(tunnel);

  cloudflareTunnelProvider.removeTunnel(tunnel);

  const message = "Cloudflare tunnel stopped";
  showInformationMessage(message);
}
