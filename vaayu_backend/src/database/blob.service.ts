import { Injectable } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';

@Injectable()
export class BlobService {
  private client: BlobServiceClient;

  constructor() {
    const connectionString = process.env.AZURE_BLOB_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('AZURE_BLOB_CONNECTION_STRING environment variable is not set');
    }
    this.client = BlobServiceClient.fromConnectionString(connectionString);
  }

  async upload(containerName: string, blobName: string, data: Buffer | string) {
    const container = this.client.getContainerClient(containerName);
    await container.createIfNotExists();
    const blockBlob = container.getBlockBlobClient(blobName);
    const uploadData = typeof data === 'string' ? Buffer.from(data) : data;
    return blockBlob.uploadData(uploadData);
  }

  async download(containerName: string, blobName: string) {
    const container = this.client.getContainerClient(containerName);
    const blockBlob = container.getBlockBlobClient(blobName);
    const download = await blockBlob.downloadToBuffer();
    return download;
  }
}
