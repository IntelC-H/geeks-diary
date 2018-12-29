import { FocusKeyManager } from '@angular/cdk/a11y';
import { AfterContentInit, Component, HostListener, Inject, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';
import { VcsAccount, VcsAuthenticationTypes, VcsPrimaryEmailNotExistsError } from '../../../../core/vcs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog';
import { Dialog, DialogRef } from '../../../ui/dialog';
import { VCS_ACCOUNT_DATABASE, VcsAccountDatabase } from '../../vcs-account-database';
import { VcsAccountItemComponent } from '../../vcs-view';
import { VcsRemoteGithubProvider } from '../vcs-remote-github-provider';
import { VcsRemoteProviderFactory } from '../vcs-remote-provider-factory';


@Component({
    selector: 'gd-github-accounts-dialog',
    templateUrl: './github-accounts-dialog.component.html',
    styleUrls: ['./github-accounts-dialog.component.scss'],
    providers: [Dialog],
})
export class GithubAccountsDialogComponent implements OnInit, AfterContentInit {
    private _loginProcessing = false;

    get loginProcessing(): boolean {
        return this._loginProcessing;
    }

    private _loginErrorCaught = false;

    get loginErrorCaught(): boolean {
        return this._loginErrorCaught;
    }

    private _isEmpty: boolean = true;

    get isEmpty(): boolean {
        return this._isEmpty;
    }

    private _accountsCount: number = 0;

    get accountsCount(): number {
        return this._accountsCount;
    }

    readonly authenticationTypes = VcsAuthenticationTypes;
    readonly addAccountFormGroup = new FormGroup({
        type: new FormControl(this.authenticationTypes.BASIC),
        userName: new FormControl(''),
        password: new FormControl(''),
        token: new FormControl(''),
    });

    @ViewChildren(VcsAccountItemComponent) _items: QueryList<VcsAccountItemComponent>;
    accounts: VcsAccount[] = [];
    _keyManager: FocusKeyManager<VcsAccountItemComponent>;

    private github: VcsRemoteGithubProvider;

    constructor(
        private dialogRef: DialogRef<GithubAccountsDialogComponent, void>,
        @Inject(VCS_ACCOUNT_DATABASE) private accountDB: VcsAccountDatabase,
        private dialog: Dialog,
        private vcsRemoteProviderFactory: VcsRemoteProviderFactory,
    ) {
        this.github = this.vcsRemoteProviderFactory.create('github') as VcsRemoteGithubProvider;
    }

    ngOnInit(): void {
        this.loadAccounts();
    }

    ngAfterContentInit(): void {
        // Ready for next tick. Because accounts are loaded in async.
        Promise.resolve(null).then(() => {
            this._keyManager = new FocusKeyManager(this._items).withVerticalOrientation();
        });
    }

    isItemActive(account: VcsAccount): boolean {
        if (!this._keyManager.activeItem) {
            return false;
        }

        // The reason for not simply comparing the active item index values
        // ​​here is that 'ExpressionChangedAfterItHasBeenCheckedError' occurs.
        //
        // The QueryList change is applied and the note value of the input
        // is compared to prevent the problem from occurring.
        return this._keyManager.activeItem.account === account;
    }

    /** Close this dialog. */
    closeThis(): void {
        this.dialogRef.close();
    }

    removeAccount(account: VcsAccount): void {
        this.accountDB
            .deleteAccountByEmail(account.email)
            .then(() => this.loadAccounts());
    }

    /**
     * Perform login when form submitted.
     */
    login(): void {
        if (this._loginProcessing) {
            return;
        }

        this._loginProcessing = true;
        this._loginErrorCaught = false;

        const { type, userName, password, token } = this.addAccountFormGroup.value as any;
        const ensureAccountEmail = switchMap((account: VcsAccount) => account.email
            ? of(account)
            : this.github
                .getPrimaryEmail(account.authentication)
                .pipe(map(email => ({ ...account, email }))),
        );

        switch (type as VcsAuthenticationTypes) {
            case VcsAuthenticationTypes.BASIC:
                this.github
                    .authorizeByBasic(userName as string, password as string)
                    .pipe(
                        ensureAccountEmail,
                        finalize(() => this._loginProcessing = false),
                    )
                    .subscribe(
                        account => this.handleLoginSuccess(account),
                        error => this.handleLoginFail(error),
                    );
                break;

            case VcsAuthenticationTypes.OAUTH2_TOKEN:
                this.github
                    .authorizeByOauth2Token(token as string)
                    .pipe(
                        ensureAccountEmail,
                        finalize(() => this._loginProcessing = false),
                    )
                    .subscribe(
                        account => this.handleLoginSuccess(account),
                        error => this.handleLoginFail(error),
                    );
                break;
        }
    }

    async loadAccounts(): Promise<void> {
        const accounts = await this.accountDB.getAllAccounts();

        this._accountsCount = accounts.length;
        this._isEmpty = accounts.length === 0;

        this.accounts = accounts;
    }

    @HostListener('keydown', ['$event'])
    private handleKeyDown(event: KeyboardEvent): void {
        this._keyManager.onKeydown(event);
    }

    private handleLoginSuccess(account: VcsAccount): void {
        this.accountDB
            .addNewAccount(account)
            .then(() => this.loadAccounts());

        this.addAccountFormGroup.reset({
            type: this.addAccountFormGroup.get('type').value as VcsAuthenticationTypes,
            userName: '',
            password: '',
            token: '',
        });
    }

    private handleLoginFail(error: Error): void {
        if (error instanceof VcsPrimaryEmailNotExistsError) {
            // Show confirm dialog.
            this.dialog.open<ConfirmDialogComponent,
                ConfirmDialogData,
                boolean>(
                ConfirmDialogComponent,
                {
                    maxWidth: '320px',
                    data: {
                        ...new ConfirmDialogData(),
                        title: 'Cannot read email from github.com',
                        body: 'Check if your primary email is exists or ensure \'user:email\' scope is provided.',
                        isAlert: true,
                    },
                },
            );
        } else {
            this._loginErrorCaught = true;
        }
    }
}
