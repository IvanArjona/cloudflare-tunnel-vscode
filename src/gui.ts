import * as vscode from 'vscode';

export class CloudflareTunnelGUI {
    statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, Number.MAX_SAFE_INTEGER);
        this.onStop();
        this.statusBarItem.show();
    }

    onStarting() {
        this.statusBarItem.command = undefined;
        this.statusBarItem.text = `$(sync) Starting Cloudflare Tunnel`;
    }

    onStopping() {
        this.statusBarItem.command = undefined;
        this.statusBarItem.text = `$(sync) Stopping Cloudflare Tunnel`;
    }

    onStart() {
        this.statusBarItem.command = 'cloudflaretunnel.stop';
        this.statusBarItem.text = `$(cloud) Stop Cloudflare Tunnel`;
    }

    onStop() {
        this.statusBarItem.command = 'cloudflaretunnel.start';
        this.statusBarItem.text = `$(cloud) Start Cloudflare Tunnel`;
    }
}

export const cloudflareTunnelGUI = new CloudflareTunnelGUI();
