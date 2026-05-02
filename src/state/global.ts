import * as vscode from "vscode";
import * as constants from "../constants";
import { setContext } from "../utils";
import { TunnelPreset } from "../types";

// eslint-disable-next-line no-use-before-define
export let globalState: GlobalState;

const TUNNEL_PRESETS_KEY = "tunnelPresets";

export class GlobalState {
  state: vscode.Memento;

  constructor(context: vscode.ExtensionContext) {
    this.state = context.globalState;
  }

  get credentialsFile(): string | undefined {
    return this.state.get<string>("credentialsFile");
  }

  set credentialsFile(value: string | undefined) {
    this.state.update("credentialsFile", value);
    this.setIsLoggedInContext(this.isLoggedIn);
  }

  get isLoggedIn(): boolean {
    return this.credentialsFile !== undefined;
  }

  get cloudflaredUri(): vscode.Uri | undefined {
    return this.state.get<vscode.Uri>("cloudflaredUri");
  }

  set cloudflaredUri(value: vscode.Uri | undefined) {
    this.state.update("cloudflaredUri", value);
  }

  get tunnelPresets(): TunnelPreset[] {
    const stored = this.state.get<TunnelPreset[]>(TUNNEL_PRESETS_KEY, []);
    return stored.map((preset) => ({
      ...preset,
      hostname: preset.hostname ?? null,
    }));
  }

  async upsertTunnelPreset(preset: Omit<TunnelPreset, "lastUsedAt">): Promise<void> {
    const presets = this.tunnelPresets.filter(
      (p) => !(p.port === preset.port && p.hostname === preset.hostname)
    );
    presets.unshift({ ...preset, lastUsedAt: Date.now() });
    await this.state.update(TUNNEL_PRESETS_KEY, presets);
  }

  async removeTunnelPreset(preset: TunnelPreset): Promise<void> {
    const presets = this.tunnelPresets.filter(
      (p) => !(p.port === preset.port && p.hostname === preset.hostname)
    );
    await this.state.update(TUNNEL_PRESETS_KEY, presets);
  }

  setIsLoggedInContext(value: boolean): void {
    setContext(constants.Context.isLoggedIn, value);
  }

  static init(context: vscode.ExtensionContext): GlobalState {
    globalState = new GlobalState(context);
    return globalState;
  }
}
