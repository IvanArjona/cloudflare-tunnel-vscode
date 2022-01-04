import * as vscode from 'vscode';
import { CloudflaredClient } from './cloudflared';
import { CloudflaredDownloader } from './downloader';
import { isRunningCommand, loginCommand, logoutCommand, startCommand, stopCommand, getUrlCommand, versionCommand } from './commands';

let cloudflared: CloudflaredClient;

export async function activate(context: vscode.ExtensionContext) {

	// Download cloudflared
	const cloudflaredDownloader = new CloudflaredDownloader(context);
	const cloudflaredUri = await cloudflaredDownloader.get();
	// Setup Cloudflared client
	cloudflared = new CloudflaredClient(cloudflaredUri, context);

	const commands = {
		version: versionCommand,
		start: startCommand,
		getUrl: getUrlCommand,
		isRunning: isRunningCommand,
		stop: stopCommand,
		login: loginCommand,
		logout: logoutCommand
	};

	for (const [commandName, commandCallback] of Object.entries(commands)) {
		const callback = async () => commandCallback(cloudflared);
		const command = vscode.commands.registerCommand(`cloudflaretunnel.${commandName}`, callback);
		context.subscriptions.push(command);
	}
}

// this method is called when your extension is deactivated
export async function deactivate() {
	await cloudflared.stop();
}
