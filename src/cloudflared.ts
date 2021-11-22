import * as vscode from 'vscode';
import { ChildProcess, execFileSync, spawn } from 'child_process';


abstract class ExecutableClient {
    uri: vscode.Uri;

    constructor(uri: vscode.Uri) {
        this.uri = uri;
    }

    async exec(args: string[]): Promise<string> {
        const path = this.uri.fsPath;
        try {
            const stdout = execFileSync(path, args);
            return stdout.toString();
        } catch (ex) {
            console.error(ex);
            return "";
        }
    }

    async spawn(args: string[]): Promise<ChildProcess> {
        const path = this.uri.fsPath;
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
        return new Promise((resolve) => {
            if (this.runProcess.stdout && this.runProcess.stderr) {
                this.runProcess.stderr.on('data', (data) => {
                    console.log(data.toString());
                    const lines = data.toString().split('\n');
                    const linkColumn = lines.map((line: string) => line.split(' ')[4]);
                    const link = linkColumn.find((line: string) => line?.startsWith('https://'));
                    if (link) {
                        resolve(link);
                    }
                    if (hostname) {
                        const isPropagating = lines.find((line: string) => line.includes('Route propagating'));
                        if (isPropagating) {
                            resolve('https://' + hostname);
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
