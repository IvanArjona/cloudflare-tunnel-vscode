import * as vscode from 'vscode';
import { CloudflaredClient } from './cloudflared';
import { showErrorMessage } from './utils';


export async function versionCommand(cloudflared: CloudflaredClient) {
    const message = await cloudflared.version();
    vscode.window.showInformationMessage(message);
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
        const url = `${localHostname}:${port}`;
        const tunnelUri = await cloudflared.start(url, hostname);
        const action = await vscode.window.showInformationMessage(
            `Your quick Tunnel has been created!\n${tunnelUri}`,
            'Copy to clipboard',
            'Open in browser',
        );

        switch (action) {
            case 'Copy to clipboard':
                vscode.env.clipboard.writeText(tunnelUri);
                break;
            case 'Open in browser':
                vscode.env.openExternal(vscode.Uri.parse(tunnelUri));
                break;
        }
    } catch (ex) {
        showErrorMessage(ex);
    }
}

export async function stopCommand(cloudflared: CloudflaredClient) {
    await cloudflared.stop();
    const message = 'Cloudflare tunnel stopped';
    vscode.window.showInformationMessage(message);
}

export async function isRunningCommand(cloudflared: CloudflaredClient) {
    const response = await cloudflared.isRunning();
    const message = `Cloudflare tunnel is${response ? '' : ' not'} running`;
    vscode.window.showInformationMessage(message);
}

export async function loginCommand(cloudflared: CloudflaredClient) {
    try {
        await cloudflared.login();
        vscode.window.showInformationMessage('Logged in successfully');
    } catch (ex) {
        showErrorMessage(ex);
    }
}