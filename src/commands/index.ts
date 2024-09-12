import createTunnel from "./create";
import { openOutputChannel, openPanel } from "./ui";
import stopTunnel from "./stop";
import { copyTunnelUriToClipboard, openTunnelExternal } from "./itemContext";
import { login, logout } from "./login";
import version from "./version";

type Command = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => Promise<void>;

const commands: Command[] = [
  openPanel,
  openOutputChannel,
  version,
  createTunnel,
  stopTunnel,
  openTunnelExternal,
  copyTunnelUriToClipboard,
  login,
  logout,
];

export default commands;
