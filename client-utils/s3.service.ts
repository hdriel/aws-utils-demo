// @ts-nocheck
import axios, { type Axios, type AxiosProgressEvent } from 'axios';
import qs from 'qs';
import { SERVER_BASE_URL } from '#src/utils/envrionment-variables';

function isEncoded(str: string): boolean {
    try {
        return decodeURIComponent(str) !== str;
    } catch (e) {
        return false;
    }
}

export function encode(str: string): any {
    return isEncoded(str) ? str : encodeURIComponent(str);
}

export class S3Service {
    private api: Axios;
    private downloadAbortController: AbortController | null = null;
    private uploadAbortController: AbortController | null = null;
    private token: string | undefined;

    constructor(token?: string) {
        this.api = this.setToken(token);
    }

    static downloadBlobURL(url: string, filename: string): void {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    setToken(token?: string): Axios {
        this.api = axios.create({
            // include token from cookies, need to allow cookies in server with cors like: app.use(cors({ credentials: true, ... }))
            withCredentials: true,
            baseURL: this.baseURL,
            timeout: 30_000,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
                // ...(token && { Authorization: `Bearer ${token}` }),
            },
        });
        this.token = token;

        return this.api;
    }

    // eslint-disable-next-line class-methods-use-this
    get baseURL(): string {
        return SERVER_BASE_URL;
    }

    async uploadFiles(
        url: string,
        files: File | File[],
        {
            formDataField = 'file',
            onProgress,
            directory = '',
        }: {
            formDataField?: string;
            directory?: string;
            onProgress?: (progress: number) => void;
        }
    ): Promise<null | any> {
        try {
            // not allowed to upload empty files
            files = ([] as File[]).concat(files)?.filter((file) => file && file.size !== 0);
            if (!files?.length) return null;

            if (this.uploadAbortController) {
                this.uploadAbortController.abort();
            }

            this.uploadAbortController = new AbortController();

            const formData = new FormData();
            files.forEach((file) => {
                const copyFile = new File([file], encode(file.name), { type: file.type });
                formData.append(formDataField, copyFile);
            });

            const encodedDirectory = encodeURIComponent(directory);

            const { data: response } = await this.api.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-Upload-Directory': encodedDirectory,
                },
                timeout: 1_000_000,
                signal: this.uploadAbortController.signal,
                onUploadProgress: onProgress
                    ? (progressEvent: AxiosProgressEvent) => {
                          const percentage = progressEvent.total
                              ? (progressEvent.loaded / progressEvent.total) * 100
                              : 0;
                          onProgress(percentage);
                      }
                    : undefined,
            });

            this.uploadAbortController = null;

            return response;
        } catch (error) {
            this.uploadAbortController = null;
            console.error('Failed to upload files:', error);
            throw error;
        }
    }

    async deleteFile(url: string, filePath: string): Promise<void> {
        try {
            const fileKeyEncoded = encodeURIComponent(filePath);
            const { data: response } = await this.api.delete(`${url}/${fileKeyEncoded}`);

            await response;
        } catch (error) {
            console.error('Failed to delete object:', error);
            throw error;
        }
    }

    async getSignedUrl(filePath: string, expireIn: number): Promise<string> {
        try {
            const query = qs.stringify({ expireIn: String(expireIn) });
            const fileKeyEncoded = encodeURIComponent(filePath);
            const { data: response } = await this.api.get(`/files/${fileKeyEncoded}/url?${query}`);

            return response;
        } catch (error) {
            console.error('Failed to generate signed URL:', error);
            throw error;
        }
    }

    async downloadSingleFile(url: string, onProgress?: (progress: number) => void): Promise<[string, string]> {
        try {
            if (this.downloadAbortController) {
                this.downloadAbortController.abort();
            }

            this.downloadAbortController = new AbortController();

            const { data, headers } = await this.api.get(url, {
                responseType: 'blob',
                timeout: 600_000, // 10m timeout
                signal: this.downloadAbortController.signal,
                onDownloadProgress: onProgress
                    ? (progressEvent: AxiosProgressEvent) => {
                          const percentage = progressEvent.total
                              ? (progressEvent.loaded / progressEvent.total) * 100
                              : 0;
                          onProgress(percentage);
                      }
                    : undefined,
            });

            const contentDisposition = headers['content-disposition'];
            const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
            const filename = filenameMatch?.[1] || 'download';

            const blob = new Blob([data]);
            const blobUrl = window.URL.createObjectURL(blob);

            this.downloadAbortController = null;

            return [blobUrl, decodeURIComponent(filename)];
        } catch (error) {
            this.downloadAbortController = null;

            console.error('Failed to download file:', error);
            throw error;
        }
    }

    async downloadFilesAsZip(url: string, onProgress?: (progress: number) => void): Promise<[string, string]> {
        try {
            if (this.downloadAbortController) {
                this.downloadAbortController.abort();
            }

            this.downloadAbortController = new AbortController();

            const { data, headers } = await this.api.get(url, {
                responseType: 'blob',
                timeout: 600_000,
                signal: this.downloadAbortController.signal,
                onDownloadProgress: onProgress
                    ? (progressEvent: AxiosProgressEvent) => {
                          const percentage = progressEvent.total
                              ? (progressEvent.loaded / progressEvent.total) * 100
                              : 0;

                          onProgress(percentage);
                      }
                    : undefined,
            });

            const contentDisposition = headers['content-disposition'];
            const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
            const filename = filenameMatch?.[1] || 'download.zip';

            const blob = new Blob([data], { type: 'application/zip' });
            const blobUrl = window.URL.createObjectURL(blob);

            this.downloadAbortController = null;

            return [blobUrl, decodeURIComponent(filename)];
        } catch (error) {
            this.downloadAbortController = null;
            console.error('Failed to generate signed URL:', error);
            throw error;
        }
    }

    async getObject(filePath: string): Promise<string> {
        try {
            const fileKeyEncoded = encodeURIComponent(filePath);
            const { data: response } = await this.api.get(`/files/${fileKeyEncoded}/data`);

            return response;
        } catch (error) {
            console.error('Failed to get object:', error);
            throw error;
        }
    }

    abortDownloadFiles(): void {
        if (this.downloadAbortController) {
            this.downloadAbortController.abort();
            this.downloadAbortController = null;
            console.debug('Download canceled by user');
        }
    }

    abortUploadFiles(): void {
        if (this.uploadAbortController) {
            this.uploadAbortController.abort();
            this.uploadAbortController = null;
            console.debug('Upload canceled by user');
        }
    }
}

export const s3Service = new S3Service();
