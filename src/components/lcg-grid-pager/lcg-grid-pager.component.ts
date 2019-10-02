import { Component, Input, OnDestroy } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { LcgGridDirective } from './../../directives/lcg-grid.directive';
import { GridPage } from './../../models/grid-page';

@Component({
    selector: 'lcg-grid-pager',
    template: `
                <div class="lcg-grid-pager">
                    <div class="lcg-grid-pager__rows-count">
                        <ul class="lcg-grid-pager__rows-count-list">
                            <li *ngFor="let count of numberOfLines"
                                class="lcg-grid-pager__rows-count-list-item"
                                [ngClass]="{'lcg-grid-pager__active': count === currentNumberOfLines}"
                                (click)="setPageSize(count)">
                                <a class="lcg-grid-pager__rows-count-text" href="javascript:void(0)"> {{ count }}</a>
                            </li>
                        </ul>
                    </div>
                    <div class="lcg-grid-pager__page-of-pages"
                    [ngClass]="{'lcg-grid-pager__page-of-pages_no-display': (pages && !pages.length)}">
                        <ul class="lcg-grid-pager__page-of-pages-list">
                            <li *ngFor="let page of pages"
                                class="lcg-grid-pager__page-of-pages-list-item"
                                [ngClass]="{'lcg-grid-pager__active': page.active, 'lcg-grid-pager__disabled': page.disabled}"
                                (click)="page.disabled || setPageNumber(page.number)">
                                <a class="lcg-grid-pager__page-number" href="javascript:void(0)"> {{ page.name }} </a>
                            </li>
                        </ul>
                    </div>
                </div>
            `
})

export class LcgGridPagerComponent implements OnDestroy {
    ngUnsubscribe: Subject<void> = new Subject<void>();

    pages: Array<GridPage> = [];
    numberOfLines: Array<number> = [];

    totalNumberOfLines: number;
    currentNumberOfLines: number;
    currentPageNumber: number = 1;
    paginationMinBlocks: number = 5;
    paginationMaxBlocks: number = 10;

    grid: LcgGridDirective;
    @Input('grid') set setGrid(gridFromDirective: LcgGridDirective) {
        this.grid = gridFromDirective;

        gridFromDirective.inited$.pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
                inited => {
                    if (!inited) {
                        return;
                    }
                    this.numberOfLines = gridFromDirective.options.pageSizeOptions;
                    this.currentNumberOfLines = gridFromDirective.status.pageSize;
                }
            );

        gridFromDirective.items$.pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(() => {
                const status = gridFromDirective.status;
                this.currentNumberOfLines = status.pageSize;
                this.currentPageNumber = status.pageNumber;
                this.totalNumberOfLines = (Math.ceil(status.totalCount / this.currentNumberOfLines));
                this.generatePages();
            });
    }

    constructor() {}

    setPageSize(count: number) {
        if (count !== this.currentNumberOfLines) {
            this.grid.filter({ pageSize: count, pageNumber: 1 });
        }
    }

    setPageNumber(page: number) {
        if (page !== this.currentPageNumber) {
            this.grid.filter({ pageNumber: page });
        }
    }

    generatePages() {
        const currentPage = this.currentPageNumber;
        const totalItems = this.totalNumberOfLines;

        let maxPage, maxViewdPages, minPage, numPages, maxBlocks;
        maxBlocks = this.paginationMaxBlocks;
        maxBlocks = maxBlocks && (maxBlocks < this.paginationMinBlocks) ? this.paginationMinBlocks : maxBlocks;

        numPages = totalItems;
        this.pages = [];
        if (numPages > 1) {
            this.pages.push(new GridPage('', Math.max(1, currentPage - 1), currentPage === 1, false));
            this.pages.push(new GridPage('1', 1, false, currentPage === 1));

            maxViewdPages = Math.round((this.paginationMaxBlocks - this.paginationMinBlocks) / 2);
            minPage = Math.max(2, currentPage - maxViewdPages);
            maxPage = Math.min(numPages - 1, currentPage + maxViewdPages * 2 - (currentPage - minPage));
            minPage = Math.max(2, minPage - (maxViewdPages * 2 - (maxPage - minPage)));
            let i = minPage;
            while (i <= maxPage) {
                if ((i === minPage && i !== 2) || (i === maxPage && i !== numPages - 1)) {
                    this.pages.push(new GridPage('...', i, false, false));
                } else {
                    this.pages.push(new GridPage(i, i, currentPage === i, currentPage === i));
                }
                i++;
            }
            this.pages.push(new GridPage(numPages, numPages, currentPage === numPages, currentPage === numPages));
            this.pages.push(new GridPage('', Math.min(numPages, currentPage + 1), currentPage === numPages, false));
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
