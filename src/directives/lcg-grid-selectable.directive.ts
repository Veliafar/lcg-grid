import { Directive, OnDestroy, Self } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { LcgGridFilterService } from './../services/lcg-grid-filter.service';
import { LcgGridSelectable } from '../models/interfaces/lcg-grid-selectable';


@Directive({
    selector: '[lcg-grid][lcg-grid-selectable]',
    exportAs: 'lcg-grid-selectable',
})
export class LcgGridSelectableDirective implements LcgGridSelectable, OnDestroy {

    selectedItems = [];
    private _items: any[];
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    private _isAllSelected: boolean = false;

    get isAllSelected() {
        return this._isAllSelected;
     }
    set isAllSelected(v: boolean) {
        this._isAllSelected = v;
        this.toggleSelectAll();
    }

    constructor(
        @Self() private filterService: LcgGridFilterService
    ) {
        this.filterService.change$
            .pipe(
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe(() => {
                this.resetSelection();
            });
    }

    attachItems(items: any[]) {
        this._items = items;
    }

    toggleSelectAll() {
        if (this._isAllSelected) {
            this.selectedItems = [...this._items];
        } else {
            this.resetSelection();
        }
    }

    toggleSelectItem(item) {
        if (this.selectedItems.includes(item)) {
            if (this._isAllSelected) {
                this._isAllSelected = !this._isAllSelected;
            }
            this.selectedItems = this.selectedItems.filter(e => e !== item);
        } else {
            this.selectedItems.push(item);
        }
    }

    resetSelection() {
        this._isAllSelected = false;
        this.selectedItems = [];
    }

    ngOnDestroy(): void {
        this.selectedItems = null;
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
