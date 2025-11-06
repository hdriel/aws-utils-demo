// @ts-nocheck
import qs from 'qs';
import { encode, S3Service } from './s3.service';

class BucketService {
    private readonly s3: S3Service;
    constructor() {
        this.s3 = new S3Service();
    }

    setToken(token: string): void {
        this.s3.setToken(token);
    }

    // eslint-disable-next-line class-methods-use-this
    get baseURL(): string {
        return this.s3.baseURL;
    }

    get defaultPosterImageURL(): string {
        const fileKey = encodeURIComponent('images/default-poster.png');
        return `${this.s3.baseURL}/images/${fileKey}`;
    }

    getVideoStreamURL(videoId: string, bufferStreamingSizeInMB?: number): string {
        return `${this.s3.baseURL}/stream/video/${videoId}?${qs.stringify({ bufferStreamingSizeInMB })}`;
    }

    getImageURL(fileKey?: string): string {
        if (!fileKey) return '';

        const isExternalFileUrl =
            fileKey?.startsWith('assets/') || fileKey?.startsWith('https://') || fileKey?.startsWith('http://');
        return isExternalFileUrl ? fileKey : `${this.s3.baseURL}/images/${encode(fileKey)}`;
    }

    async uploadUserProfile(userId: string, file: File, onProgress?: (progress: number) => void): Promise<null | any> {
        return this.s3.uploadFiles(`/users/${userId}/upload`, file, {
            formDataField: 'profileSrc',
            onProgress,
        });
    }

    async uploadPrivateUserFiles(
        userId: string,
        files: File | File[],
        onProgress?: (progress: number) => void
    ): Promise<null | any> {
        return this.s3.uploadFiles(`/resources/${userId}/upload/files`, files, {
            formDataField: 'files',
            onProgress,
        });
    }

    async downloadFiles(fileIds: string | string[], onProgress?: (progress: number) => void): Promise<null | any> {
        const query = ([] as string[])
            .concat(fileIds as string[])
            .map((fileId) => `fileId=${fileId}`)
            .join('&');

        const url = `/files/download?${query}`;
        const [blobURL, filename] =
            Array.isArray(fileIds) && fileIds.length > 1
                ? await this.s3.downloadFilesAsZip(url, onProgress)
                : await this.s3.downloadSingleFile(url, onProgress);

        S3Service.downloadBlobURL(blobURL, filename);
    }

    async downloadPrivateFiles(
        userId: string,
        fileIds: string | string[],
        privateResourceToken: string,
        onProgress?: (progress: number) => void
    ): Promise<null | any> {
        const query = ([] as string[])
            .concat(fileIds as string[])
            .map((fileId) => `fileId=${fileId}`)
            .join('&');

        const url = `/files/download/users/${userId}?${query}&privateResourceToken=${privateResourceToken}`;
        const [blobURL, filename] =
            Array.isArray(fileIds) && fileIds.length > 1
                ? await this.s3.downloadFilesAsZip(url, onProgress)
                : await this.s3.downloadSingleFile(url, onProgress);

        S3Service.downloadBlobURL(blobURL, filename);
    }

    async downloadReportSummaryFile(
        reportFileId: string,
        onProgress?: (progress: number) => void
    ): Promise<null | any> {
        if (!reportFileId) throw Error('not files selected');

        const [blobURL, filename] = await this.s3.downloadSingleFile(
            `/report-summary/file/${reportFileId}?download=1`,
            onProgress
        );

        S3Service.downloadBlobURL(blobURL, filename);
    }

    getReportSummaryFileUrl(reportFileId: string): string {
        if (!reportFileId) return '';
        return `${this.baseURL}/report-summary/file/${reportFileId}`;
    }
}

export const bucketService = new BucketService();

// Examples:
// <img src={bucketService.getImageURL('images/just-like-that.jpg')} />
// <video src={bucketService.getVideoStreamURL('11111-22222-33333-444444')} />
// <button onClick={() => bucketService.downloadReportSummaryFile(fileId, setProgress)}>Download</button>
// <input
//     type="file"
//     accept="image/*"
//     style={{ display: 'none' }}
//     multiple={allowedMultipleFiles}
//     onChange={(files)=> bucketService.uploadUserProfile('abcde', files[0])}
// />
