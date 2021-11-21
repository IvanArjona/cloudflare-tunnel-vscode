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

    async start(port: number): Promise<string> {
        this.runProcess = await this.spawn(["tunnel", "--url", `localhost:${port}`]);
        return new Promise((resolve) => {
            if (this.runProcess.stdout && this.runProcess.stderr) {
                this.runProcess.stderr.on('data', (data) => {
                    const lines = data.toString().split('\n');
                    const linkColumn = lines.map((line: string) => line.split(' ')[4]);
                    const link = linkColumn.find((line: string) => line?.startsWith('https://'));
                    if (link) {
                        resolve(link);
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

}
