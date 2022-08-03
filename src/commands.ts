import * as vscode from 'vscode';
import { CloudflaredClient } from './cloudflared';
import { cloudflareTunnelGUI } from './gui';
import { showErrorMessage, showInformationMessage } from './utils';


async function version(cloudflared: CloudflaredClient) {
    const message = await cloudflared.version();
    showInformationMessage(message);
}

async function start(cloudflared: CloudflaredClient) {
    // Configuration
    const config = vscode.workspace.getConfiguration('cloudflaretunnel.tunnel');
    const defaultPort = config.get<number>('defaultPort', 8080);
    const askForPort = config.get<boolean>('askForPort', true);
    const hostname = config.get<string>('hostname');
    const localHostname = config.get<string>('localHostname', 'localhost');
    let port = defaultPort;

    // Port input
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
        if (hostname) {
            await cloudflared.createTunnel();
            await cloudflared.routeDns(hostname);
        }
        const tunnelUri = await cloudflared.start(url, hostname);
        cloudflareTunnelGUI.onStart(url, tunnelUri);

        await showInformationMessage('Your quick Tunnel has been created!', tunnelUri);
    } catch (ex) {
        cloudflareTunnelGUI.onStop();
        showErrorMessage(ex);
    }
}

async function stop(cloudflared: CloudflaredClient) {
    cloudflareTunnelGUI.onStopping();

    await cloudflared.stop();
    cloudflareTunnelGUI.onStop();

    const message = 'Cloudflare tunnel stopped';
    showInformationMessage(message);
}

async function isRunning(cloudflared: CloudflaredClient) {
    const response = await cloudflared.isRunning();
    const message = `Cloudflare tunnel is${response ? '' : ' not'} running`;
    showInformationMessage(message);
}

async function getUrl(cloudflared: CloudflaredClient) {
    const url = await cloudflared.getUrl();
    const message = `Cloudflare tunnel is${url ? '' : ' not'} running`;
    showInformationMessage(message, url);
}

async function login(cloudflared: CloudflaredClient) {
    try {
        await cloudflared.login();
        showInformationMessage('Logged in successfully');
    } catch (ex) {
        showErrorMessage(ex);
    }
}

async function logout(cloudflared: CloudflaredClient) {
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

const commands = [
    version,
    start,
    stop,
    isRunning,
    getUrl,
    login,
    logout
];

export default commands;
