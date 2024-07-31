import * as vscode from "vscode";
import * as os from "os";
import * as fs from "fs";
import { getApi, FileDownloader } from "@microsoft/vscode-file-downloader-api";

export class CloudflaredDownloader {
  context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  private async setPermissions(uri: vscode.Uri) {
    fs.chmodSync(uri.fsPath, 0o750);
  }

  private async getCloudflaredFileName(): Promise<string> {
    const arch = os.arch().replace("x", "amd");
    const osType = os.type().toLowerCase().replace("_nt", ""); // windows, linux, darwin
    const extension = osType === "windows" ? ".exe" : "";
    return `cloudflared-${osType}-${arch}${extension}`;
  }

  private async getDownloadUri(fileName: string): Promise<vscode.Uri> {
    return vscode.Uri.parse(
      `https://github.com/cloudflare/cloudflared/releases/latest/download/${fileName}`
    );
  }

  private async download(): Promise<vscode.Uri> {
    const fileName = await this.getCloudflaredFileName();
    const downloadUri = await this.getDownloadUri(fileName);
    const fileDownloader: FileDownloader = await getApi();

    return await vscode.window.withProgress<vscode.Uri>(
      {
        location: vscode.ProgressLocation.Window,
        title: "Downloading cloudfared client",
      },
      () => fileDownloader.downloadFile(downloadUri, fileName, this.context)
    );
  }

  async get(): Promise<vscode.Uri> {
    let uri = this.context.globalState.get<vscode.Uri>("cloudflaredUri");
    uri = undefined;
    if (uri && fs.existsSync(uri.fsPath)) {
      return uri;
    }

    uri = await this.download();
    await this.setPermissions(uri);
    this.context.globalState.update("cloudflaredUri", uri);
    return uri;
  }
}
