
import { Injectable } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { distinctUntilChanged, first, map, skip, takeUntil } from 'rxjs/operators';

import { safeObjectTypeAssign } from './../utils';


export const OutletName = 'filter';
export const OutletParam = '🔖';
const DateRegex = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;
@Injectable()
export class LcgGridStateService {

    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _isPersisting: boolean = false;
    private _stateChangedSubject = new Subject<Object>();
    private _stateCtor: new () => any = Object;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private viewportScroller: ViewportScroller
    ) {
    }



    get storageStateChanged$() {
        return this._stateChangedSubject.asObservable();
    }

    setStateCtor(ctor: new () => any) {
        this._stateCtor = ctor;
    }

    subscribeStorageStateChanged() {
        const activatedOutlet = this.getActivatedRouteOutlet();
        if (!activatedOutlet) {
            throw new Error(`[lcg-grid] Outlet ${OutletName} not found`);
        }
        this.handleOutletParams(activatedOutlet)
            .pipe(
                takeUntil(this.ngUnsubscribe),
                skip(1), // skip initial navigation
                map(a => {
                    if (!this._isPersisting) {
                        this._stateChangedSubject.next(a);
                    }
                    return a;
                })
            )
            .subscribe();
    }

    async getPersistedState() {
        return new Promise<Object>((resolve) => {
            const outlet = this.getActivatedRouteOutlet();
            if (!outlet) {
                return resolve(undefined);
            }
            this.handleOutletParams(outlet)
                .pipe(
                    takeUntil(this.ngUnsubscribe),
                    first()
                )
                .subscribe(resolve);
        });
    }

    async persist(data, initial = false) {
        this._isPersisting = true;

        const filterJson = JSON.stringify(data, (key, value) => {
            if (DateRegex.test(value)) {
                return new Date(new Date(value).getTime() - (new Date(value).getTimezoneOffset() * 60000)).toJSON();
            }
            if (value === null || value === '') {
                return;
            }
            if (
                value instanceof Object && Object.keys(value).length === 0
            ) {
                return;
            }
            return value;
        });
        const scrollPos = this.viewportScroller.getScrollPosition();
        await this.router.navigate([{ outlets: { filter: [OutletParam, filterJson] } }], { replaceUrl: initial });
        scrollTo({ left: scrollPos[0], top: scrollPos[1] }); // restore scroll position after navigation
        this._isPersisting = false;
    }

    dispose() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }


    private handleOutletParams(outlet) {
        return outlet.params
            .pipe(
                map((params) => {
                    return params['q'];
                }),
                distinctUntilChanged(),
                map((qParam: string) => {
                    let state: Object;
                    if (!qParam) {
                        return state;
                    }
                    const filterParams = JSON.parse(qParam, (key, val) => {
                        if (!val) {
                            return val;
                        }
                        if (!DateRegex.test(val)) {
                            return val;
                        }
                        const parsedDate = Date.parse(val);
                        if (isNaN(parsedDate)) {
                            return val;
                        }
                        // fix state date on init when reload page
                        return new Date(parsedDate + (new Date(parsedDate).getTimezoneOffset() * 60000));
                    });
                    state = filterParams;
                    return state;
                }),
                map((state) => {
                    return safeObjectTypeAssign(new this._stateCtor(), state);
                })
            );
    }

    private getActivatedRouteOutlet() {
        return this.route.root.children.find(c => c.outlet === OutletName);
    }
}

