import { Component, Input, Inject } from '@angular/core';

import { LcgGridDirective } from './../../directives/lcg-grid.directive';
import { LCG_GRID_CONFIG, LcgGridConfig } from '../../models/lcg-grid-config';

@Component({
    selector: 'lcg-grid-page-status',
    template: `
                <div class="lcg-grid__page-status" *ngIf="grid && grid.status.totalCount">
                    <span>
                            {{ config.localeSource?.shown }} {{ minShowItem }}
                            {{ config.localeSource?.to }} {{ maxShowItem }}
                            {{ config.localeSource?.of }} {{ grid.status.totalCount }}
                    </span>
                </div>
            `
})
export class LcgGridPageStatusComponent {

    @Input() grid: LcgGridDirective;

    constructor(
        @Inject(LCG_GRID_CONFIG) public config: LcgGridConfig
    ) {}

    get minShowItem() {
        if (!this.grid && !this.grid.status) {
            return;
        }
            const s = this.grid.status;
            return s.pageSize * (s.pageNumber - 1) + 1;
    }
    get maxShowItem() {
        if (!this.grid && !this.grid.status) {
            return;
        }
        const s = this.grid.status;
        return s.pageSize * s.pageNumber < s.totalCount ?
                    (s.pageSize * s.pageNumber) :
                    s.totalCount;
    }

}
