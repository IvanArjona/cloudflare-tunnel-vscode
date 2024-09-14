import { showInformationMessage } from "../utils";
import { cloudflared } from "../cmd/cloudflared";

async function version(): Promise<void> {
  const message = await cloudflared.version();
  showInformationMessage(message);
}

export default version;
