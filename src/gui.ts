import * as vscode from 'vscode';

export class CloudflareTunnelGUI {
    statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, Number.MAX_SAFE_INTEGER);
        this.onStop();

        const config = vscode.workspace.getConfiguration('cloudflaretunnel.gui');
        const showStatusBarItem = config.get<boolean>('showStatusBarItem', true);
        if (showStatusBarItem) {
            this.statusBarItem.show();
        }
    }

    updateStatusBarItem(text: string, icon: string, command: string | undefined = undefined) {
        this.statusBarItem.command = command;
        this.statusBarItem.text = `$(${icon}) ${text}`;;
        this.statusBarItem.tooltip = text;
    }

    onStarting() {
        this.updateStatusBarItem('Starting Cloudflare Tunnel', 'sync');
    }

    onStopping() {
        this.updateStatusBarItem('Stopping Cloudflare Tunnel', 'sync');
    }

    onStart() {
        this.updateStatusBarItem('Stop Cloudflare Tunnel', 'cloud', 'cloudflaretunnel.stop');
    }

    onStop() {
        this.updateStatusBarItem('Start Cloudflare Tunnel', 'cloud', 'cloudflaretunnel.start');
    }
}

export const cloudflareTunnelGUI = new CloudflareTunnelGUI();
