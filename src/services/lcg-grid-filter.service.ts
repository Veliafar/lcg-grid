import { Subject, Observable } from 'rxjs';

import { LcgGridFilter } from '../models/interfaces/lcg-grid-filter';
import { safeObjectTypeAssign } from '../utils';


export const defaultPagingFilter = () => {
    return { pageNumber: 1, pageSize: 100 };
};

export class LcgGridFilterService {
    private filter: LcgGridFilter = defaultPagingFilter();
    private defaultFilter: LcgGridFilter = {};

    private change = new Subject<LcgGridFilter>();

    /**
     * Поток изменений фильтра
     *
     * @readonly
     * @type {Observable<any>}
     * @memberof LcgGridFilterService
     */
    public get change$() {
        return this.change.asObservable();
    }

    /**
     * Получить актуальную копию фильтра
     *
     * @returns копия установленного фильтра
     * @memberof LcgGridFilterService
     */
    get(): LcgGridFilter {
        const ctor: new () => any = <any>this.filter.constructor;
        return Object.assign(new ctor(), this.filter);
    }

    /**
     * Обновить фильтр
     *
     * @param {LcgGridFilter} data - Объект фильтра
     * @param {boolean} [resetPageNumber=false] - сброс на 1ую страницу
     * @param {boolean} [force=false] - породить событие change даже если фильтр не изменился
     * @memberof LcgGridFilterService
     */
    update(data: LcgGridFilter, resetPageNumber: boolean = false, force: boolean = false) {
        const prev = JSON.stringify(this.get());
        if (resetPageNumber) {
            safeObjectTypeAssign(
                data,
                { pageNumber: 1 }
            );
        }
        const ctor: new() => any = data ? <any>data.constructor : Object;
        if (this.filter && data && this.filter.constructor !== data.constructor) {
            if (data.constructor.name !== 'Object') {
                const newFilter = new ctor();
                safeObjectTypeAssign(newFilter, this.filter);
                this.filter = newFilter;
            }
        }

        safeObjectTypeAssign(this.filter, data);

        const current = JSON.stringify(this.get());
        if (prev !== current || force) {
            this.change.next(this.get());
        }
    }


    /**
     * Сброс фильтра
     *
     * @param {boolean} [silent] - Не триггерить изменение фильтра
     * @memberof LcgGridFilterService
     */
    reset(silent?: boolean) {
        const ctor: new () => any = <any>this.filter.constructor;
        this.filter = safeObjectTypeAssign(new ctor(), { ...defaultPagingFilter(), ...this.defaultFilter });
        if (silent) {
            return;
        }
        this.change.next(this.get());
    }


    /**
     * Установить значения по-умолчанию для фильтра
     *
     * @param {LcgGridFilter} f - объект фильтра
     * @param {boolean} [mergeWithCurrent=false] - объеденить с ранее установленным значением
     * @memberof LcgGridFilterService
     */
    setDefaults(f: LcgGridFilter, mergeWithCurrent: boolean = false) {
        if (!f) {
            return;
        }
        if (mergeWithCurrent) {
            this.defaultFilter = { ...this.defaultFilter, ...f };
        } else {
            this.defaultFilter = f;

        }
        this.reset(true);
    }

}
