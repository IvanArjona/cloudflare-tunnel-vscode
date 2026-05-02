import * as vscode from "vscode";
import { CloudflareTunnel, CloudflareTunnelStatus } from "../tunnel";
import { cloudflared } from "../cmd/cloudflared";
import { cloudflareTunnelProvider } from "../providers/tunnels";
import { cloudflareTunnelStatusBar } from "../statusbar/statusbar";
import { showErrorMessage, showInformationMessage } from "../utils";
import { globalState } from "../state/global";
import { config } from "../state/config";
import { TunnelPreset } from "../types";
import * as constants from "../constants";

const TRYCLOUDFLARE_LABEL = "trycloudflare.com (random subdomain)";

function portValidateInput(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const port = parseInt(value, 10);
  if (!port) {
    return "Please enter a valid port number.";
  }
  if (port < 1 || port > 65535) {
    return "Port number must be between 1 and 65535.";
  }
  if (cloudflareTunnelProvider.hasPort(port)) {
    return "Port number is already in use.";
  }

  return undefined;
}

async function getPortInput(): Promise<number | null> {
  const response = await vscode.window.showInputBox({
    title: "Port number",
    value: config.defaultPort.toString(),
    prompt: "Select your local port number.",
    ignoreFocusOut: true,
    validateInput: portValidateInput,
  });
  return response ? parseInt(response, 10) : null;
}

function hostnameValidateInput(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  if (!/^[a-zA-Z0-9.-]+$/.test(value)) {
    return "Invalid hostname. Only alphanumeric characters, dots, and dashes are allowed.";
  }
  if (cloudflareTunnelProvider.hasHostname(value)) {
    return "Hostname is already in use.";
  }

  return undefined;
}

async function getHostname(): Promise<string | null> {
  if (globalState.isLoggedIn) {
    return (
      (await vscode.window.showInputBox({
        title: "Hostname",
        value: config.defaultHostname,
        placeHolder: "Enter a hostname",
        ignoreFocusOut: true,
        prompt:
          "Your domain hostname. If not specified anything, it will generate a `.trycloudflare.com` subdomain. Make sure to login and give proper permissions before changing this setting. Example: `mytunnel.mydomain.com`",
        validateInput: hostnameValidateInput,
      })) || null
    );
  }
  return null;
}

interface PresetQuickPickItem extends vscode.QuickPickItem {
  preset?: TunnelPreset;
  isNew?: boolean;
}

function presetLabel(preset: TunnelPreset): string {
  const target = preset.hostname ?? TRYCLOUDFLARE_LABEL;
  return `${preset.port} → ${target}`;
}

async function pickPreset(): Promise<TunnelPreset | "new" | null> {
  const presets = globalState.tunnelPresets;
  if (presets.length === 0) {
    return "new";
  }

  const deleteButton: vscode.QuickInputButton = {
    iconPath: new vscode.ThemeIcon("trash"),
    tooltip: "Delete preset",
  };

  const buildItems = (current: TunnelPreset[]): PresetQuickPickItem[] => [
    {
      label: "$(add) New tunnel...",
      description: "Configure a new port and hostname",
      isNew: true,
    },
    ...current.map<PresetQuickPickItem>((preset) => ({
      label: `$(star) ${presetLabel(preset)}`,
      description: cloudflareTunnelProvider.hasPort(preset.port)
        ? "Port already in use"
        : undefined,
      preset,
      buttons: [deleteButton],
    })),
  ];

  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: TunnelPreset | "new" | null): void => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };

    const quickPick = vscode.window.createQuickPick<PresetQuickPickItem>();
    quickPick.title = "Create Cloudflare Tunnel";
    quickPick.placeholder = "Select a preset or create a new tunnel";
    quickPick.ignoreFocusOut = true;
    quickPick.items = buildItems(presets);

    quickPick.onDidTriggerItemButton((event) => {
      if (!event.item.preset) {
        return;
      }
      globalState
        .removeTunnelPreset(event.item.preset)
        .then(() => {
          const remaining = globalState.tunnelPresets;
          if (remaining.length === 0) {
            quickPick.hide();
            settle("new");
            return;
          }
          quickPick.items = buildItems(remaining);
        })
        .catch((err) => {
          showErrorMessage(err);
          quickPick.hide();
          settle(null);
        });
    });

    quickPick.onDidAccept(() => {
      const [selected] = quickPick.selectedItems;
      quickPick.hide();
      if (!selected) {
        settle(null);
        return;
      }
      if (selected.isNew) {
        settle("new");
        return;
      }
      settle(selected.preset ?? null);
    });

    quickPick.onDidHide(() => {
      quickPick.dispose();
      settle(null);
    });

    quickPick.show();
  });
}

async function createTunnel(): Promise<void> {
  const selection = await pickPreset();
  if (selection === null) {
    return;
  }

  let port: number;
  let hostname: string | null;

  if (selection === "new") {
    const portInput = await getPortInput();
    if (!portInput) {
      return;
    }
    port = portInput;
    hostname = await getHostname();
  } else {
    if (cloudflareTunnelProvider.hasPort(selection.port)) {
      showErrorMessage(
        Error(`Port ${selection.port} is already in use by a running tunnel.`)
      );
      return;
    }
    if (
      selection.hostname &&
      cloudflareTunnelProvider.hasHostname(selection.hostname)
    ) {
      showErrorMessage(
        Error(
          `Hostname ${selection.hostname} is already in use by a running tunnel.`
        )
      );
      return;
    }
    port = selection.port;
    hostname = selection.hostname;
  }

  try {
    const tunnel = new CloudflareTunnel(config.localHostname, port, hostname);

    cloudflareTunnelProvider.addTunnel(tunnel);
    tunnel.subscribe(cloudflareTunnelProvider);
    tunnel.subscribe(cloudflareTunnelStatusBar);

    try {
      await vscode.window.withProgress<void>(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Starting cloudflare tunnel for ${tunnel.url}. [(Show logs)](command:${constants.Commands.openOutputChannel})\n`,
          cancellable: true,
        },
        async (progress, token) => {
          token.onCancellationRequested(() => {
            cloudflared.stop(tunnel);
            cloudflareTunnelProvider.removeTunnel(tunnel);
          });

          if (hostname) {
            progress.report({ message: "Creating tunnel..." });
            await cloudflared.createTunnel(tunnel);
            progress.report({ message: "Creating route dns..." });
            await cloudflared.routeDns(tunnel);
          }
          progress.report({ message: "Starting tunnel..." });
          await cloudflared.startTunnel(tunnel);
          tunnel.process?.on("exit", () => {
            cloudflareTunnelProvider.removeTunnel(tunnel);
          });
        }
      );

      tunnel.status = CloudflareTunnelStatus.running;
      await globalState.upsertTunnelPreset({ port, hostname });

      await showInformationMessage(
        "Your Cloudflare Tunnel has been created!",
        tunnel.tunnelUri
      );
    } catch (ex) {
      cloudflareTunnelProvider.removeTunnel(tunnel);
      showErrorMessage(ex);
    }
  } catch (ex) {
    showErrorMessage(ex);
  }
}

export default createTunnel;
