
import { AfterViewInit, Directive, EventEmitter, Input, OnDestroy, Optional, Output, Self, ViewContainerRef } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { finalize, map, takeUntil, tap } from 'rxjs/operators';

import { splitSortBy } from '../utils';
import { LcgGridOptions } from '../models/interfaces/lcg-grid-options';
import { LcgGridSelectable } from '../models/interfaces/lcg-grid-selectable';
import { NulloLcgGridSelectable } from '../models/nullo-lcg-grid-selectable';
import { LcgGridFilter } from './../models/interfaces/lcg-grid-filter';
import { LcgGridPagedResult, LcgGridStatus } from './../models/interfaces/paged-result';
import { LcgGridCacheService } from './../services/lcg-grid-cache.service';
import { defaultPagingFilter, LcgGridFilterService } from './../services/lcg-grid-filter.service';
import { LcgGridStateService } from './../services/lcg-grid-state.service';
import { LcgGridSelectableDirective } from './lcg-grid-selectable.directive';



type GetDataFunc = (filter?: LcgGridFilter) => Observable<LcgGridPagedResult | any[]>;

@Directive({
    selector: '[lcg-grid]',
    exportAs: 'lcg-grid',
    providers: [
        LcgGridFilterService
    ]
})
export class LcgGridDirective implements OnDestroy, AfterViewInit {

    /**
     * Доступ к функционалу выбора элементов
     *
     * @type {LcgGridSelectable}
     * @memberof LcgGridDirective
     */
    readonly select: LcgGridSelectable = new NulloLcgGridSelectable();

    /**
     * Массив отфильтрованных данных
     *
     * @type {any[]}
     * @memberof LcgGridDirective
     */
    items: any[] = [];
    /**
     * Признак инициализации
     *
     * @type {boolean}
     * @memberof LcgGridDirective
     */
    inited: boolean = false;
    /**
     * Признак процесса загрузки
     *
     * @type {boolean}
     * @memberof LcgGridDirective
     */
    inProgress: boolean = false;
    /**
     * Поток признака процесса загрузки
     *
     * @memberof LcgGridDirective
     */
    @Output() readonly inProgress$ = new EventEmitter<boolean>();

    DEFAULT_PAGE_SIZE_OPTION = [10, 25, 50, 100];

    getData: GetDataFunc;
    private _arrayData: any[] = [];
    private _loadSubscription: Subscription;

    private _options: LcgGridOptions = { loadOnInit: true, pageSizeOptions: this.DEFAULT_PAGE_SIZE_OPTION };

    /**
     * Установка источника данных
     * 
     * @param {GetDataFunc | any[]} func Observable или массив
     * @memberof LcgGridDirective
     */
    @Input('lcg-grid') set getFunc(func: GetDataFunc | any[]) {
        if (func instanceof Function) {
            // Передача функции с сохранением контекста исполнения
            const componentContext = this.templateRef['_view'].component;
            this.getData = func.bind(componentContext);
            this.tryReinit();
        } else if (func instanceof Array) {
            this._arrayData = func;
            this.getData = (f) => {
                return new Observable<LcgGridPagedResult>(subscriber => {
                    subscriber.next({
                        pageNumber: f.pageNumber,
                        pageSize: f.pageSize,
                        totalCount: this._arrayData.length,
                        pageCount: this._arrayData.length / f.pageSize,
                        results: this.filterArray(f)
                    });
                    subscriber.complete();
                });
            };
            this.tryReinit();
        } else {
            console.warn('[lcg-grid] Unsupported grid source');
        }
    }

    /**
     * Задать фильтр по-умолчанию
     *
     * Переданный тип объекта также будет сохранён. Фильтр будет передвататься в колбэк для запроса с данным типом.
     * Обязательно требуется применять в случаях, когда важно чтобы декораторы объекта фильтра не потерялись
     * (Например: декораторы для десераилзации при запросе)
     *
     *    
     * @param {LcgGridFilter} f  [lcg-grid-defaults]="{ pageSize: 50, orderBy: 'phone asc' }"
     * @memberof LcgGridDirective
     */
    @Input('lcg-grid-defaults') set defaultFilter(f: LcgGridFilter) {
        this.filterService.setDefaults(f);
    }

    /**
     * Задать настройки
     *
     * **loadOnInit** (true) - Загружать данные при инициализации
     * 
     * **pageSizeOptions** ([10, 25, 50, 100]) - Настройки пейджинга
     * 
     * @param {LcgGridOptions} opts [lcg-grid-options]="{ loadOnInit: false, pageSizeOptions: [10, 50, 100, 500] }"
     * @memberof LcgGridDirective
     */
    @Input('lcg-grid-options') set setOptions(opts: LcgGridOptions) {
        this._options = { ...this._options, ...opts };
        const def = defaultPagingFilter();

        if (this._options.pageSizeOptions[0] !== undefined
            && this._options.pageSizeOptions[0] !== null
            && this._options.pageSizeOptions instanceof Array
            && this._options.pageSizeOptions.length) {

            if (def.pageSize === this.filterService.get().pageSize) {
                this.filterService.setDefaults({ pageSize: this._options.pageSizeOptions[0] }, true);
            } else {
                console.warn(`[lcg-grid] used pageSizeOptions from lcg-grid-defaults value --> ${this.filterService.get().pageSize}`);
            }
        } else {
            this._options.pageSizeOptions = this.DEFAULT_PAGE_SIZE_OPTION;
            console.warn(`[lcg-grid] used uncorrect pageSizeOptions; pageSizeOptions changed to --> ${this._options.pageSizeOptions}`);
        }
    }
    

    /**
     * Получть применённые настройки
     *
     * @readonly
     * @type {LcgGridOptions}
     * @memberof LcgGridDirective
     */
    get options() {
        return Object.freeze({ ...this._options });
    }

    private initedSubject = new BehaviorSubject<boolean>(false);
    /**
     * Поток признака инициализации
     *
     * @readonly
     * @type {Observable<boolean>}
     * @memberof LcgGridDirective
     */
    get inited$() {
        return this.initedSubject.asObservable();
    }

    private _status: LcgGridStatus = this.emptyStatusObject();
    /**
     * Получить статус
     *
     * @readonly
     * @memberof LcgGridDirective
     */
    get status() {
        return Object.freeze(this._status);
    }

    private itemsSubject = new BehaviorSubject<any[]>([]);
    /**
     * Список отфильтрованных элементов
     *
     * @readonly
     * @type {Observable<[]>}
     * @memberof LcgGridDirective
     */
    get items$() {
        return this.itemsSubject.asObservable();
    }

    /**
     * Признак пустого списка. items.length === 0
     *
     * @readonly
     * @type {boolean}
     * @memberof LcgGridDirective
     */
    get noItems(): boolean {
        return !this.items.length;
    }

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        @Self() private filterService: LcgGridFilterService,
        @Optional() private stateService: LcgGridStateService,
        @Optional() private cacheService: LcgGridCacheService,
        @Optional() select: LcgGridSelectableDirective,
        private templateRef: ViewContainerRef
    ) {
        if (select) {
            this.select = select;
        }
    }

    async ngAfterViewInit() {
        if (this.stateService) {
            const state = await this.stateService.getPersistedState();
            if (state) {
                this.filterService.update(state);
            } else {
                await this.persistFilterState(true);
            }
            this.stateService.subscribeStorageStateChanged();
            this.stateService.storageStateChanged$
                .pipe(
                    map((newState) => {
                        if (newState) {
                            this.filterService.update(newState);
                        } else {
                            this.filterService.reset();
                        }
                    })
                )
                .subscribe();
        }
        setTimeout(async () => {
            await this.init();
        }, 0);
        this.filterService.change$
            .pipe(
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe(f => {
                if (this.stateService) {
                    this.stateService.persist(f);
                }
                this.loadData(f);
            });
    }

    /**
     * Отфильтровать данные
     *
     * @param {*} f - Объект фильтра
     * @memberof LcgGridDirective
     */
    async filter(f) {
        this.filterService.update(f, false, true);
        await this.persistFilterState();
    }

    /**
     * Сбросить фильтр
     *
     * @param {boolean} [notTriggerChange] - Не порождать событие "change"
     * @memberof LcgGridDirective
     */
    async reset(notTriggerChange?: boolean) {
        this.filterService.reset(notTriggerChange);
        await this.persistFilterState();
    }

    /**
     * Получить состояние фильтра
     *
     * @param {boolean} [withoutPaging=false] - убрать из объекта фильтра pageNumber, pageSize
     * @param {boolean} [withoutSortBy=false] - убрать из фильтра sortBy
     * @returns объект фильтра
     * @memberof LcgGridDirective
     */
    getFilter(withoutPaging: boolean = false, withoutSortBy = false): LcgGridFilter {
        const filter = this.filterService.get();
        if (withoutPaging) {
            delete filter.pageNumber;
            delete filter.pageSize;
        }
        if (withoutSortBy) {
            delete filter.sortBy;
        }
        return filter;
    }

    /**
     * Поток изменений фильтра
     *
     * @readonly
     * @type {Observable<any>}
     * @memberof LcgGridDirective
     */
    get filterChange$() {
        return this.filterService.change$;
    }

    /**
     * Отсортировать по полю
     *
     * @param {string} fieldNameAndDirection 'phone asc' | 'surname desc'
     * @memberof LcgGridDirective
     */
    async orderBy(fieldNameAndDirection: string) {
        this.filterService.update({ sortBy: fieldNameAndDirection }, true);
        await this.persistFilterState();
    }

    /**
     * Сохранить состояние фильтра
     *
     * @param {boolean} [initial=false]
     * @returns
     * @memberof LcgGridDirective
     */
    async persistFilterState(initial = false) {
        if (!this.stateService) {
            return;
        }
        await this.stateService.persist(this.filterService.get(), initial);
    }

    ngOnDestroy(): void {
        if (this.stateService) {
            this.stateService.dispose();
        }
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    private loadData(f) {
        if (this.inProgress) {
            return;
        }
        this.inProgress$.emit(true);
        this.inProgress = true;

        let filterToSend = f;
        if (this.options.converter) {
            filterToSend = this.options.converter.serialize(f);
        } else {
            console.log('[lcg-grid] There was no converter passed to options. Filter object would send AS IS.');
        }

        let request: Observable<LcgGridPagedResult | any[]>;
        if (this.cacheService) {
            request = this.cacheService.cache(filterToSend, this.getData(filterToSend));
        } else {
            request = this.getData(filterToSend);
        }
        this._loadSubscription = 
            request
                .pipe(
                    tap((items) => {
                        this.mapItems(items);
                    }),
                    tap(() => {
                        if (this.select && !(this.select instanceof NulloLcgGridSelectable)) {
                            this.select.attachItems(this.items);
                        }
                    }),
                    finalize(() => {
                        this.inProgress$.emit(false);
                        this.inProgress = false;
                    })
                ).subscribe();
    }

    private emptyStatusObject(): LcgGridStatus {
        return {
            pageCount: 0,
            pageNumber: 0,
            pageSize: 0,
            totalCount: 0
        };
    }

    private async init() {
        if (this.cacheService) { this.cacheService.invalidate(); }
        const filter = this.filterService.get();
        this._status = {
            pageNumber: filter.pageNumber,
            pageSize: filter.pageSize,
            pageCount: 0,
            totalCount: 0
        };
        this.inited = true;
        this.initedSubject.next(this.inited);
        if (this._options.loadOnInit) {
            await this.loadData(this.filterService.get());
        }
    }

    private tryReinit() {
        if (this.inited) {
            setTimeout(async () => await this.init(), 0);           
        }
    }

    private mapItems(res: LcgGridPagedResult | any[]) {
        const noItems = [];
        if (!res) {
            this.items = noItems;
            this.itemsSubject.next(noItems);

            this._status = this.emptyStatusObject();
            return;
        }
        if (res instanceof Array) {
            this.items = res;
            this.itemsSubject.next(res);

            const filter = this.getFilter();
            this._status = {
                pageNumber: filter.pageNumber,
                pageSize: filter.pageSize,
                pageCount: 0,
                totalCount: 0,
            };
            return;
        }
        this._status = {
            ...res
        };
        const items = res.results || noItems;
        this.items = items;
        this.itemsSubject.next(items);
        return res;
    }

    private filterArray(filter: LcgGridFilter) {
        let filtered = [...this._arrayData];
        Object.keys(filter).forEach(filterKey => {
            if (['sortBy', 'pageNumber', 'pageSize'].indexOf(filterKey) !== -1) {
                return;
            }
            const filterVal = filter[filterKey];
            if (!filterVal && filterVal !== 0 || filterVal instanceof Object) {
                return;
            }
            filtered = filtered.filter(item => {
                if (item[filterKey] === undefined) {
                    return true;
                }
                // tslint:disable-next-line:triple-equals
                return item[filterKey] == filterVal;
            });
        });
        if (filter.sortBy) {
            const { fieldName, direction } = splitSortBy(filter.sortBy);
            const fields = fieldName.split(', ');
            if (fields.length > 0) {
                filtered.sort((a, b) => {
                    let result = 0;
                    for (const f in fields) {
                        if (!fields[f]) {
                            continue;
                        }
                        let aValue = a[fields[f]];
                        let bValue = b[fields[f]];
                        if ((!aValue && aValue !== 0) || (!bValue && bValue !== 0)) {
                            aValue = (aValue || '').toString().toLowerCase();
                            bValue = (bValue || '').toString().toLowerCase();
                        }
                        const ascCompareResult = (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
                        const fieldResult = direction === 'asc' ? ascCompareResult : -1 * ascCompareResult;
                        if (fieldResult !== 0) {
                            return fieldResult;
                        }
                        result = fieldResult;
                    }
                    return result;
                });
            }
        }
        if (filter.pageSize && filter.pageNumber) {
            const sliceStart = (filter.pageNumber - 1) * filter.pageSize;
            filtered = filtered.slice(sliceStart, sliceStart + filter.pageSize);
        }
        return filtered;
    }

}
