import assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import * as constants from "../../constants";
import proxyquire from "proxyquire";
import { CloudflaredDownloader as CloudflareDownloaderType } from "../../cmd/downloader";

suite("CloudflaredDownloader Test Suite", () => {
  let downloader: CloudflareDownloaderType;
  let downloadFromUriStub: sinon.SinonStub;

  suiteSetup(async () => {
    const extension = vscode.extensions.getExtension(
      "IvanArjona.cloudflaretunnel"
    )!;
    await extension.activate();
    // @ts-expect-error: TS7017
    const context = global.testExtensionContext;

    // Mocks
    const { CloudflaredDownloader: cloudflaredDownloader } = proxyquire(
      "../../cmd/downloader",
      {
        tar: {
          x: sinon.stub().resolves(),
        },
        fs: {
          promises: {
            rename: sinon.stub().resolves(),
          },
        },
      }
    );

    downloader = new cloudflaredDownloader(context);

    // Stubs
    downloadFromUriStub = sinon
      .stub(downloader, "downloadFromUri")
      .callsFake(
        async (uri: vscode.Uri, fileName: string): Promise<vscode.Uri> => {
          return vscode.Uri.parse("/tmp/" + fileName);
        }
      );

  });

  suiteTeardown(() => {
    sinon.restore();
  });

  test("should download the file", async () => {
    const fileName = "cloudflared-amd64-linux";
    const uri = await downloader.download(fileName);

    const expectedDownloadUri = vscode.Uri.parse(
      constants.cloudflaredDownloadUrl + fileName
    );
    downloadFromUriStub.calledOnceWithExactly(expectedDownloadUri, fileName);

    assert.equal(uri.toString(), "file:///tmp/" + fileName);
  });

  test("should download the file compressed .tgz file for darwin", async () => {
    const fileName = "cloudflared-amd64-darwin";
    const uri = await downloader.download(fileName);

    const expectedDownloadFileName = fileName + ".tgz";
    const expectedDownloadUri = vscode.Uri.parse(
      constants.cloudflaredDownloadUrl + expectedDownloadFileName
    );
    downloadFromUriStub.calledOnceWithExactly(
      expectedDownloadUri,
      expectedDownloadFileName
    );

    assert.equal(uri.toString(), "file:///tmp/" + fileName);
  });
});
