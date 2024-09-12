import * as vscode from "vscode";
import { cloudflared } from "../cmd/cloudflared";
import { cloudflareTunnelProvider } from "../providers/tunnels";
import {
  selectRunningTunnelIfUndefined,
  showInformationMessage,
} from "../utils";
import { CloudflareTunnel, CloudflareTunnelStatus } from "../tunnel";
import * as constants from "../constants";

async function doStopTunnel(
  progress: vscode.Progress<{ message?: string }>,
  token: vscode.CancellationToken,
  tunnel: CloudflareTunnel
): Promise<void> {
  token.onCancellationRequested(() => {
    cloudflared.stop(tunnel);
    cloudflareTunnelProvider.removeTunnel(tunnel);
  });

  progress.report({ message: "Stopping tunnel..." });
  await cloudflared.stop(tunnel);
  progress.report({ message: "Deleting tunnel..." });
  await cloudflared.deleteTunnel(tunnel);

  cloudflareTunnelProvider.removeTunnel(tunnel);
  showInformationMessage("Cloudflare tunnel stopped");
}

async function stopTunnel(tunnel?: CloudflareTunnel): Promise<void> {
  tunnel = await selectRunningTunnelIfUndefined(tunnel);
  tunnel.status = CloudflareTunnelStatus.stopping;

  await vscode.window.withProgress<void>(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Stopping cloudflare tunnel ${tunnel.shortTunnelUri} for ${tunnel.url}. [(Show logs)](command:${constants.Commands.openOutputChannel})\n`,
    },
    async (progress, token) => doStopTunnel(progress, token, tunnel)
  );
}

export default stopTunnel;
