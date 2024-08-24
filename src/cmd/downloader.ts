import * as vscode from "vscode";
import * as os from "os";
import * as fs from "fs";
import * as tar from "tar";
import * as path from "path";
import { getApi, FileDownloader } from "@microsoft/vscode-file-downloader-api";

export class CloudflaredDownloader {
  constructor(private context: vscode.ExtensionContext) {}

  private async setPermissions(uri: vscode.Uri): Promise<void> {
    fs.chmodSync(uri.fsPath, 0o750);
  }

  private async getCloudflaredFileName(): Promise<string> {
    const arch = os.arch().replace("x", "amd").replace("ia32", "386"); // amd64, 386
    const osType = os.type().toLowerCase().replace("_nt", ""); // windows, linux, darwin
    const extension = osType === "windows" ? ".exe" : "";
    return `cloudflared-${osType}-${arch}${extension}`;
  }

  private async getDownloadUri(fileName: string): Promise<vscode.Uri> {
    return vscode.Uri.parse(
      `https://github.com/cloudflare/cloudflared/releases/latest/download/${fileName}`
    );
  }

  private async unzipDarwin(
    fileName: string,
    uri: vscode.Uri
  ): Promise<vscode.Uri> {
    const cwd = path.dirname(uri.fsPath);
    await tar.x({
      file: uri.fsPath,
      cwd: path.dirname(uri.fsPath),
      filter: (path) => path === "cloudflared",
    });

    // Renamed extracted "cloudflared" to fileName
    const extractedFilePath = path.join(cwd, "cloudflared");
    const renamedFilePath = path.join(cwd, fileName);
    await fs.promises.rename(extractedFilePath, renamedFilePath);

    return vscode.Uri.parse(renamedFilePath);
  }

  private async download(fileName: string): Promise<vscode.Uri> {
    const downloadFileName = fileName.includes("darwin")
      ? fileName + ".tgz"
      : fileName;
    const downloadUri = await this.getDownloadUri(downloadFileName);
    const fileDownloader: FileDownloader = await getApi();

    const uri = await vscode.window.withProgress<vscode.Uri>(
      {
        location: vscode.ProgressLocation.Window,
        title: "Downloading cloudfared client",
      },
      () =>
        fileDownloader.downloadFile(downloadUri, downloadFileName, this.context)
    );

    if (downloadFileName === fileName) {
      return uri;
    }

    return await this.unzipDarwin(fileName, uri);
  }

  async get(): Promise<vscode.Uri> {
    let uri = this.context.globalState.get<vscode.Uri>("cloudflaredUri");
    if (uri && fs.existsSync(uri.fsPath)) {
      return uri;
    }

    const fileName = await this.getCloudflaredFileName();
    uri = await this.download(fileName);
    await this.setPermissions(uri);
    this.context.globalState.update("cloudflaredUri", uri);

    return uri;
  }
}