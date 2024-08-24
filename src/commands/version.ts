import { showInformationMessage } from "../utils";
import { cloudflared } from "../cmd/cloudflared";

export async function version(): Promise<void> {
  const message = await cloudflared.version();
  showInformationMessage(message);
}
