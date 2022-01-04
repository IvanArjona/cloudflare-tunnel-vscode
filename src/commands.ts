import * as vscode from 'vscode';
import { CloudflaredClient } from './cloudflared';
import { cloudflareTunnelGUI } from './gui';
import { showErrorMessage, showInformationMessage } from './utils';


export async function versionCommand(cloudflared: CloudflaredClient) {
    const message = await cloudflared.version();
    showInformationMessage(message);
}

export async function startCommand(cloudflared: CloudflaredClient) {
    const config = vscode.workspace.getConfiguration('cloudflaretunnel.tunnel');
    const defaultPort = config.get<number>('defaultPort', 8080);
    const askForPort = config.get<boolean>('askForPort', true);
    const hostname = config.get<string>('hostname');
    const localHostname = config.get<string>('localHostname', 'localhost');
    let port = defaultPort;

    if (askForPort) {
        const inputResponse = await vscode.window.showInputBox({
            title: "Port number",
            placeHolder: `Select a port. Default: ${defaultPort}`,
            ignoreFocusOut: true
        });
        if (!inputResponse) {
            return;
        }
        port = inputResponse ? parseInt(inputResponse) : defaultPort;
    }

    try {
        cloudflareTunnelGUI.onStarting();
        const url = `${localHostname}:${port}`;
        const tunnelUri = await cloudflared.start(url, hostname);
        cloudflareTunnelGUI.onStart();
        await showInformationMessage('Your quick Tunnel has been created!', tunnelUri);
    } catch (ex) {
        cloudflareTunnelGUI.onStop();
        showErrorMessage(ex);
    }
}

export async function stopCommand(cloudflared: CloudflaredClient) {
    cloudflareTunnelGUI.onStopping();
    await cloudflared.stop();
    const message = 'Cloudflare tunnel stopped';
    cloudflareTunnelGUI.onStop();
    showInformationMessage(message);
}

export async function isRunningCommand(cloudflared: CloudflaredClient) {
    const response = await cloudflared.isRunning();
    const message = `Cloudflare tunnel is${response ? '' : ' not'} running`;
    showInformationMessage(message);
}

export async function getUrlCommand(cloudflared: CloudflaredClient) {
    const url = await cloudflared.getUrl();
    const message = `Cloudflare tunnel is${url ? '' : ' not'} running`;
    showInformationMessage(message, url);
}

export async function loginCommand(cloudflared: CloudflaredClient) {
    try {
        await cloudflared.login();
        showInformationMessage('Logged in successfully');
    } catch (ex) {
        showErrorMessage(ex);
    }
}

export async function logoutCommand(cloudflared: CloudflaredClient) {
    const isLoggedIn = await cloudflared.isLoggedIn();

    if (isLoggedIn) {
        try {
            await cloudflared.logout();
            showInformationMessage('Logged out successfully');
        } catch (ex) {
            showErrorMessage(ex);
        }
    } else {
            showErrorMessage('You are not logged in');
    }
}