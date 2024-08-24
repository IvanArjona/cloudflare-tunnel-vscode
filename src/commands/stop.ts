import { cloudflared } from "../cmd/cloudflared";
import { cloudflareTunnelProvider } from "../providers/tunnels";
import { showInformationMessage } from "../utils";
import { CloudflareTunnel } from "../tunnel";

export async function stopTunnel(tunnel: CloudflareTunnel): Promise<void> {
  await cloudflared.stop(tunnel);
  await cloudflared.deleteTunnel(tunnel);

  cloudflareTunnelProvider.removeTunnel(tunnel);

  const message = "Cloudflare tunnel stopped";
  showInformationMessage(message);
}
