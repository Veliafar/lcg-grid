import { Directive, Input, Self } from '@angular/core';

import { LcgGridCacheService } from './../services/lcg-grid-cache.service';


@Directive({
    selector: '[lcg-grid][lcg-grid-cache]',
    providers: [
       LcgGridCacheService
    ]
})
export class LcgGridCacheDirective {

    @Input('lcg-grid-cache') set setCache(ms: number) {
        this.cacheService.setCacheExp(ms);
    }

    constructor(
        @Self() private cacheService: LcgGridCacheService
    ) {}

}
