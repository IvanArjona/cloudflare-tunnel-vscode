import { ConfigItem } from "./types";

// Extension prefix
export const prefix = "cloudflaretunnel";

// Cloudflared
export const cloudflared = "cloudflared";
export const cloudflaredDownloadUrl =
  "https://github.com/cloudflare/cloudflared/releases/latest/download/";
export const cloudflaredPermissions = 0o750;

// Commands
export const enum Commands {
  version = `${prefix}.version`,
  openPanel = `${prefix}.openPanel`,
  openOutputChannel = `${prefix}.openOutputChannel`,
  createTunnel = `${prefix}.createTunnel`,
  stopTunnel = `${prefix}.stopTunnel`,
  openTunnelExternal = `${prefix}.openTunnelExternal`,
  copyTunnelUriToClipboard = `${prefix}.copyTunnelUriToClipboard`,
  login = `${prefix}.login`,
  logout = `${prefix}.logout`,
}

// Views
export const enum Views {
  list = `${prefix}.list`,
}

// Context
export const enum Context {
  isLoggedIn = `${prefix}.isLoggedIn`,
}

// Config
export const configSection = prefix;
export const config: { [key: string]: ConfigItem } = {
  // Tunnel
  defaultPort: {
    key: "tunnel.defaultPort",
    default: 8080,
  },
  defaultHostname: {
    key: "tunnel.defaultHostname",
    default: "",
  },
  localHostname: {
    key: "tunnel.localHostname",
    default: "localhost",
  },
  // UI
  showStatusBarItem: {
    key: "gui.showStatusBarItem",
    default: true,
  },
};
