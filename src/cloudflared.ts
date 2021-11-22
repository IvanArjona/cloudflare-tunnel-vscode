import * as vscode from 'vscode';
import { ChildProcess, execFileSync, spawn } from 'child_process';


abstract class ExecutableClient {
    log: vscode.OutputChannel;
    uri: vscode.Uri;

    constructor(uri: vscode.Uri) {
        this.uri = uri;
        this.log = vscode.window.createOutputChannel("Cloudflare Tunnel");
    }

    async exec(args: string[]): Promise<string> {
        const path = this.uri.fsPath;
        try {
            this.log.appendLine(`Exec: ${args.join(' ')}`);
            const stdout = execFileSync(path, args);
            return stdout.toString();
        } catch (ex) {
            console.error(ex);
            return "";
        }
    }

    async spawn(args: string[]): Promise<ChildProcess> {
        const path = this.uri.fsPath;
        this.log.appendLine(`Spawn: ${args.join(' ')}`);
        return spawn(path, args);
    }
}


export class CloudflaredClient extends ExecutableClient {
    context: vscode.ExtensionContext;
    runProcess!: ChildProcess;

    constructor(uri: vscode.Uri, context: vscode.ExtensionContext) {
        super(uri);
        this.context = context;
    }

    async version(): Promise<string> {
        return await this.exec(["--version"]);
    }

    async start(port: number, hostname: string | undefined): Promise<string> {
        const command = ["tunnel", "--url", `localhost:${port}`];
        if (hostname) {
            command.push("--hostname", hostname);
        }

        this.runProcess = await this.spawn(command);
        return new Promise((resolve, reject) => {
            if (this.runProcess.stdout && this.runProcess.stderr) {
                this.runProcess.stderr.on('data', (data) => {
                    const strData = data.toString();
                    const lines = strData.split('\n');
                    for (let line of lines) {
                        this.log.appendLine(line);
                        const [time, logLevel, ...extra] = line.split(' ');
                        const info = extra.filter((word: string) => word && word !== ' ').join(' ');
                        const hasLink = info.includes('.trycloudflare.com');
                        if (hasLink) {
                            const link = info.split(' ').find((word: string) => word.endsWith('.trycloudflare.com'));
                            resolve(link);
                        }
                        if (hostname) {
                            const isPropagating = info.includes('Route propagating');
                            if (isPropagating) {
                                resolve('https://' + hostname);
                            }
                        }
                        if (logLevel === 'ERR') {
                            this.stop();
                            reject(info);
                        }
                    }
                });
            }
        });
    }
    
    async stop(): Promise<boolean> {
        if (await this.isRunning()) {
            return this.runProcess.kill();
        }
        return false;
    }

    async isRunning(): Promise<boolean> {
        return this.runProcess && !this.runProcess.killed;
    }

    async createTunnel(): Promise<string> {
        return await this.exec(["tunnel", "create", "cloudflaretunnel-vscode"]);
    }

    async login() {
        const response = await this.exec(["login"]);
        if (response.includes('You have successfully logged in')) {
            const lines = response.split('\n');
            const credentialsFile = lines.find((line) => line.endsWith('.pem'));
            this.context.globalState.update('credentialsFile', credentialsFile);
        } else if (response.startsWith('You have an existing certificate')) {
            throw new Error(response);
        }
    }

    async isLoggedIn(): Promise<boolean> {
        return Boolean(this.context.globalState.get<string>('credentialsFile'));
    }
}
