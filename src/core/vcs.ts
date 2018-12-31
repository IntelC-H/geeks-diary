import { ErrorWithMetadata } from './error-with-metadata';


export enum VcsAuthenticationTypes {
    BASIC = 'BASIC',
    OAUTH2_TOKEN = 'OAUTH2_TOKEN',
}


/**
 * VCS account model.
 * Used to create signature or authenticate to Remote.
 */
export interface VcsAccount {
    readonly name: string;
    readonly email?: string;
    readonly authentication: VcsAuthenticationInfo;
}


export interface VcsAuthenticationInfo {
    readonly type: VcsAuthenticationTypes;
    readonly authorizationHeader: string;
    readonly providerName: string;

    /** BASIC */
    readonly username?: string;
    readonly password?: string;

    /** OAUTH2_TOKEN */
    readonly token?: string;
}


export interface VcsRemoteRepository {
    readonly url: string;
    readonly apiUrl?: string;
    readonly name: string;
    readonly gitUrl?: string;
    readonly sshUrl?: string;
}


export enum VcsFileChangeStatusTypes {
    NEW = 'NEW',
    MODIFIED = 'MODIFIED',
    RENAMED = 'RENAMED',
    REMOVED = 'REMOVED',
    CONFLICTED = 'CONFLICTED',
    IGNORED = 'IGNORED',
}


export function getVcsFileChangeStatusName(status: VcsFileChangeStatusTypes): string {
    switch (status) {
        case VcsFileChangeStatusTypes.NEW:
            return 'New';
        case VcsFileChangeStatusTypes.MODIFIED:
            return 'Modified';
        case VcsFileChangeStatusTypes.RENAMED:
            return 'Renamed';
        case VcsFileChangeStatusTypes.REMOVED:
            return 'Removed';
    }
}


export function getVcsFileChangeColor(status: VcsFileChangeStatusTypes): string {
    switch (status) {
        case VcsFileChangeStatusTypes.NEW:
            return '#4caf50';
        case VcsFileChangeStatusTypes.MODIFIED:
            return '#ffc107';
        case VcsFileChangeStatusTypes.RENAMED:
            return '#2196f3';
        case VcsFileChangeStatusTypes.REMOVED:
            return '#e53935';
    }
}


export function getVcsFileChangeStatusIcon(status: VcsFileChangeStatusTypes): string {
    /* tslint:disable */
    switch (status) {
        case VcsFileChangeStatusTypes.NEW:
            // Green
            return `
            <svg width="256" height="256" viewBox="0 0 14 16" version="1.1" aria-hidden="true">
                <path fill-rule="evenodd" fill="#4caf50" d="M13 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 13H1V2h12v12zM6 9H3V7h3V4h2v3h3v2H8v3H6V9z"></path>
            </svg>
            `;

        case VcsFileChangeStatusTypes.MODIFIED:
            // Ember
            return `
            <svg width="256" height="256" viewBox="0 0 14 16" version="1.1" aria-hidden="true">
                <path fill-rule="evenodd" fill="#ffc107" d="M13 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 13H1V2h12v12zM4 8c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3z"></path>
            </svg>
            `;

        case VcsFileChangeStatusTypes.RENAMED:
            // Blue
            return `
            <svg width="256" height="256" viewBox="0 0 14 16" version="1.1" aria-hidden="true">
                <path fill-rule="evenodd" fill="#2196f3" d="M6 9H3V7h3V4l5 4-5 4V9zm8-7v12c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V2c0-.55.45-1 1-1h12c.55 0 1 .45 1 1zm-1 0H1v12h12V2z"></path>
            </svg>
            `;

        case VcsFileChangeStatusTypes.REMOVED:
            // Red
            return `
            <svg width="256" height="256" viewBox="0 0 14 16" version="1.1" aria-hidden="true">
                <path fill-rule="evenodd" fill="#e53935" d="M13 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 13H1V2h12v12zm-2-5H3V7h8v2z"></path>
            </svg>
            `;
    }
    /* tslint:enable */
}


export interface VcsCommitItem {
    /** Commit id. Same with SHA. */
    commitId: string;

    /** SHA */
    commitHash: string;

    authorName: string;
    authorEmail: string;
    committerName: string;
    committerEmail: string;

    /** Summary of commit message. */
    summary: string;

    /** Description of commit message. */
    description?: string;

    /** Unix timestamp. Unit is millisecond. */
    timestamp: number;
}


export interface VcsFileChange {
    /** File path relative with working directory. */
    readonly filePath: string;

    /** Working directory path. */
    readonly workingDirectoryPath: string;

    /** Absolute file path. */
    readonly absoluteFilePath: string;

    /** Vcs status of file. */
    readonly status: VcsFileChangeStatusTypes;

    /** Diff for Head to index. */
    readonly headToIndexDiff?: {
        readonly oldFilePath: string;
        readonly newFilePath: string;
    };
}


export enum VcsErrorCodes {
    AUTHENTICATE_ERROR = 'vcs.authenticateError',
    REPOSITORY_NOT_EXISTS = 'vcs.repositoryNotExists',
    PRIMARY_EMAIL_NOT_EXISTS = 'vcs.primaryEmailNotExists',
}


export class VcsAuthenticateError extends ErrorWithMetadata {
    public readonly code = VcsErrorCodes.AUTHENTICATE_ERROR;
    public readonly errorDescription = 'Authentication failed.';

    constructor() {
        super('Authenticate failed.');
    }
}


export class VcsRepositoryNotExistsError extends ErrorWithMetadata {
    public readonly code = VcsErrorCodes.REPOSITORY_NOT_EXISTS;
    public readonly errorDescription = 'Cannot find repository.';

    constructor() {
        super('Cannot find repository.');
    }
}


export class VcsPrimaryEmailNotExistsError extends ErrorWithMetadata {
    public readonly code = VcsErrorCodes.PRIMARY_EMAIL_NOT_EXISTS;
    public readonly errorDescription = 'Primary email not exists';

    constructor() {
        super('Primary email not exists.');
    }
}


export type VcsError =
    VcsAuthenticateError
    | VcsRepositoryNotExistsError
    | VcsPrimaryEmailNotExistsError;
