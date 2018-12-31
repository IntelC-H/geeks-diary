import { FocusableOption } from '@angular/cdk/a11y';
import { ENTER, SPACE } from '@angular/cdk/keycodes';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DoCheck,
    ElementRef,
    EventEmitter,
    HostBinding,
    HostListener,
    Input,
    Output,
    ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer, SafeHtml, SafeStyle } from '@angular/platform-browser';
import { getVcsFileChangeColor, getVcsFileChangeStatusIcon, VcsFileChangeStatusTypes } from '../../../../core/vcs';
import { Stack, StackViewer } from '../../../stack';
import { NoteCollectionViewModes } from '../note-collection.state';
import { NoteItem } from '../note-item.model';
import { NoteItemContextMenu, NoteItemContextMenuCommand } from './note-item-context-menu';


export class NoteItemSelectionChange {
    constructor(
        public readonly source: NoteItemComponent,
        public readonly isUserInput = false,
    ) {
    }
}


export class NoteItemContextMenuEvent {
    constructor(
        public readonly source: NoteItemComponent,
        public readonly command: NoteItemContextMenuCommand,
    ) {
    }
}


@Component({
    selector: 'gd-note-item',
    templateUrl: './note-item.component.html',
    styleUrls: ['./note-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    host: {
        'class': 'NoteItem',
        '[class.NoteItem--activated]': 'active',
        '[class.NoteItem--selected]': 'selected',
        '[class.NoteItem--hasLabel]': 'note.label',
        '[class.NoteItem--hasVcsStatus]': 'status',
        '[attr.aria-selected]': 'selected',
        '[attr.tabindex]': 'tabIndex',
    },

})
export class NoteItemComponent implements DoCheck, FocusableOption {
    get statusBarColor(): SafeStyle {
        if (this.status) {
            return this.sanitizer.bypassSecurityTrustStyle(`${getVcsFileChangeColor(this.status)}`);
        } else {
            return '';
        }
    }

    get statusIcon(): SafeHtml {
        if (this.status) {
            return this.sanitizer.bypassSecurityTrustHtml(getVcsFileChangeStatusIcon(this.status));
        } else {
            return '';
        }
    }

    get tabIndex(): string {
        return this.active ? '0' : '-1';
    }

    get areStacksExists(): boolean {
        return this.note && this.note.stackIds.length > 0;
    }

    get stacks(): Stack[] {
        if (this.note) {
            return this.note.stackIds.map(name => this.stackViewer.getStackWithSafe(name));
        } else {
            return [];
        }
    }

    @HostBinding('class.NoteItem--viewMode-detail')
    private get viewModeDetail(): boolean {
        return this.viewMode === NoteCollectionViewModes.VIEW_DETAIL;
    }

    @HostBinding('class.NoteItem--viewMode-simple')
    private get viewModeSimple(): boolean {
        return this.viewMode === NoteCollectionViewModes.VIEW_SIMPLE;
    }

    @Input() note: NoteItem;
    @Input() active: boolean;
    @Input() selected: boolean;
    @Input() status: VcsFileChangeStatusTypes;
    @Input() viewMode: NoteCollectionViewModes = NoteCollectionViewModes.VIEW_DETAIL;

    @Output() readonly selectionChange = new EventEmitter<NoteItemSelectionChange>();
    @Output() readonly contextMenuCommand = new EventEmitter<NoteItemContextMenuEvent>();

    noteTitle: string;

    constructor(
        public _elementRef: ElementRef<HTMLElement>,
        private changeDetector: ChangeDetectorRef,
        private sanitizer: DomSanitizer,
        private contextMenu: NoteItemContextMenu,
        private stackViewer: StackViewer,
    ) {
    }

    ngDoCheck(): void {
        if (!this.note.title) {
            this.noteTitle = '(Untitled Note)';
            this.changeDetector.markForCheck();
        } else {
            this.noteTitle = this.note.title;
        }
    }

    focus(): void {
        this._elementRef.nativeElement.focus();
    }

    @HostListener('keydown', ['$event'])
    private handleKeyDown(event: KeyboardEvent): void {
        if (event.keyCode === ENTER || event.keyCode === SPACE) {
            this.emitSelectionChange(true);
        }
    }

    @HostListener('click')
    private handleClick(): void {
        this.emitSelectionChange(true);
    }

    @HostListener('contextmenu')
    private handleContextMenu(): void {
        this.contextMenu.open().subscribe((command) => {
            if (command) {
                this.contextMenuCommand.emit(new NoteItemContextMenuEvent(this, command));
            }
        });
    }

    private emitSelectionChange(isUserInput = false): void {
        this.selectionChange.emit(new NoteItemSelectionChange(this, isUserInput));
    }
}
