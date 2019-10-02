import { AfterViewInit, Directive, Input, OnDestroy, Self } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';

import { LcgGridStateService } from './../services/lcg-grid-state.service';
import { LcgGridFilterService } from './../services/lcg-grid-filter.service';
import { safeObjectTypeAssign } from './../utils';


@Directive({
    selector: '[lcg-grid][lcg-grid-state]',
    providers: [
       LcgGridStateService,
    ]
})
export class LcgGridStateDirective implements AfterViewInit, OnDestroy {
    private _filterSource: FormGroup | Object;

    @Input('lcg-grid-state') set setFilterSource(f: FormGroup | Object) {
        this._filterSource = f || {};
        if (!(<any>this._filterSource instanceof FormGroup)) {
            this.stateService.setStateCtor(<any>this._filterSource.constructor);
        }
    }

    constructor(
        private router: Router,
        @Self() private stateService: LcgGridStateService,
        @Self() private filterService: LcgGridFilterService
    ) {
        this.filterService.change$
            .pipe(
                map((s) => {
                    this.patch(s);
                })
            )
            .subscribe();
    }

    ngAfterViewInit(): void {
       setTimeout(() => { // Delay for garanty to get most actual filter data;
           this.patch(this.filterService.get());
       }, 0);
    }

    async ngOnDestroy() {
        await this.router.navigate(['', { outlets: { filter: null }}], { replaceUrl: true });
    }

    private patch(f) {
        if (this._filterSource instanceof FormGroup) {
            this._filterSource.patchValue(f);
        } else if (this._filterSource instanceof Object) {
            safeObjectTypeAssign(this._filterSource, f);
        } else {
            console.warn('[lcg-grid] Filter source is not Object or FormGroup. Failed to restore state to filter object');
        }
    }
}
