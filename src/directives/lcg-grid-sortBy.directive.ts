import { AfterViewInit, Directive, ElementRef, HostBinding, HostListener, Input, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { LcgGridFilter } from './../models/interfaces/lcg-grid-filter';
import { LcgGridFilterService as LcgGridFilterService } from './../services/lcg-grid-filter.service';
import { splitSortBy } from './../utils';


const SORT_DIRECTION_ORDER = ['asc', 'desc', null];

@Directive({
  selector: '[lcg-grid-sortBy]'
})
export class LcgGridSortByDirective implements OnDestroy, AfterViewInit {

  @Input('lcg-grid-sortBy') sortByFieldName: string;

  private ngUnsubscribe: Subject<void> = new Subject<void>();
  private natElem = this.refElem.nativeElement;

  @HostBinding('style.cursor') get getCursor() {
    return 'pointer';
  }

  @HostListener('click') onClick() {
    this.sort(this.filterService.get());
  }

  constructor(
    private refElem: ElementRef,
    private filterService: LcgGridFilterService,
  ) {}

  ngAfterViewInit(): void {
    this.createSortView();
    this.updateSortingMarkup(this.filterService.get());
    this.filterService.change$
        .pipe(
            takeUntil(this.ngUnsubscribe)
        )
        .subscribe((f) => {
            this.updateSortingMarkup(f);
        });
  }

  createSortView() {
    const innerText = this.natElem.outerText;
    this.natElem.innerText = '';
    if (innerText && innerText !== '') {
      this.natElem.insertAdjacentHTML('beforeend',
        `<div class='lcg-grid-sort-by__container'>
            <div class="lcg-grid-sort-by__text">${innerText}</div>
            <div class="lcg-grid-sort-by__direction"></div>
        </div>`);
    } else {
      const container = document.createElement('div');
      container.innerHTML =
        `<div class='lcg-grid-sort-by__container'>
          <div class="lcg-grid-sort-by__text"></div>
          <div class="lcg-grid-sort-by__direction"></div>
        </div>`;
      container.querySelector('.lcg-grid-sort-by__text').insertAdjacentHTML('beforeend', this.natElem.childNodes[0].innerHTML);
      this.natElem.insertAdjacentHTML('beforeend', container);
    }
  }

  sort(filter: LcgGridFilter) {
    const { fieldName, direction } = splitSortBy(filter.sortBy);
    let nextDirPosition = 0;
    if (this.sortByFieldName === fieldName) {
        const dirPosition = SORT_DIRECTION_ORDER.indexOf(direction);
        nextDirPosition = dirPosition + 1;
        if (nextDirPosition > SORT_DIRECTION_ORDER.length - 1) {
            nextDirPosition = 0;
        }
    }
    const nextDirecion = SORT_DIRECTION_ORDER[nextDirPosition];
    if (nextDirecion) {
        this.filterService.update({ sortBy: `${this.sortByFieldName} ${nextDirecion}` }, true);
    } else {
        this.filterService.update({ sortBy: null }, true);
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private updateSortingMarkup(filter: LcgGridFilter) {
        const { fieldName, direction } = splitSortBy(filter.sortBy);
        const directionElem = this.natElem.querySelector('.lcg-grid-sort-by__direction');
        if (this.sortByFieldName === fieldName) {
            directionElem.setAttribute('sort', direction);
        } else {
            directionElem.setAttribute('sort', '');
        }
  }
}
