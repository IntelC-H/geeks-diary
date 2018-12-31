import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as path from 'path';
import { Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { ErrorWithMetadata } from '../../../../core/error-with-metadata';
import { makeNoteContentFileName } from '../../../../core/note';
import { datetime } from '../../../../libs/datetime';
import { WorkspaceService } from '../../../shared';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog';
import { Dialog, DialogRef } from '../../../ui/dialog';
import { VcsService } from '../../../vcs';
import { NoteContentFileAlreadyExistsError, NoteOutsideWorkspaceError } from '../../note-errors';
import { NoteCollectionService } from '../note-collection.service';


@Component({
    selector: 'gd-create-new-note-dialog',
    templateUrl: './create-new-note-dialog.component.html',
    styleUrls: ['./create-new-note-dialog.component.scss'],
    providers: [Dialog],
})
export class CreateNewNoteDialogComponent implements OnInit, OnDestroy {
    private _createNewNoteProcessing = false;

    get createNewNoteProcessing(): boolean {
        return this._createNewNoteProcessing;
    }

    readonly createNewNoteFormGroup = new FormGroup({
        title: new FormControl('', [Validators.required]),
        label: new FormControl(''),
    });
    readonly filePathControl = new FormControl('');
    private filePathSettingSubscription = Subscription.EMPTY;

    constructor(
        private dialogRef: DialogRef<CreateNewNoteDialogComponent, void>,
        private workspace: WorkspaceService,
        private collection: NoteCollectionService,
        private vcs: VcsService,
        private dialog: Dialog,
    ) {
    }

    ngOnInit(): void {
        this.filePathSettingSubscription = this.createNewNoteFormGroup.valueChanges
            .pipe(startWith(null))
            .subscribe(() => this.filePathControl.setValue(this.getFilePath()));
    }

    ngOnDestroy(): void {
        this.filePathSettingSubscription.unsubscribe();
    }

    async createNewNote(): Promise<void> {
        this._createNewNoteProcessing = true;

        const { title, label } = this.createNewNoteFormGroup.value;

        try {
            await this.collection.createNewNote(title, label);

            if (label) {
                await this.vcs.keepDirectory(
                    path.resolve(this.workspace.configs.rootDirPath, label),
                );
            }

            this.handleCreateNewNoteSuccess();
        } catch (error) {
            this.handleCreateNewNoteFail(error);
        } finally {
            this._createNewNoteProcessing = false;
        }
    }

    close(): void {
        this.dialogRef.close();
    }

    private getFilePath(): string {
        const { title, label } = this.createNewNoteFormGroup.value;
        const fileName = makeNoteContentFileName(datetime.today().getTime(), title as string);

        return path.resolve(
            this.workspace.configs.rootDirPath,
            (label as string) || '',
            fileName,
        );
    }

    private handleCreateNewNoteSuccess(): void {
        this.dialogRef.close();
    }

    private handleCreateNewNoteFail(error: Error): void {
        if (error instanceof NoteContentFileAlreadyExistsError) {
            this.createNewNoteFormGroup.get('title').setErrors({ contentFileExists: true });
        } else if (error instanceof NoteOutsideWorkspaceError) {
            this.createNewNoteFormGroup.get('label').setErrors({ outsideWorkspace: true });
        } else {
            this.dialog.open<ConfirmDialogComponent, ConfirmDialogData>(
                ConfirmDialogComponent,
                {
                    maxWidth: '320px',
                    data: {
                        body: error && (error as any).errorDescription
                            ? (error as ErrorWithMetadata).errorDescription
                            : error.message,
                        isAlert: true,
                    },
                },
            );
        }
    }
}
