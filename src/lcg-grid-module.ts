import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { LcgGridPageStatusComponent } from './components/lcg-grid-page-status/lcg-grid-page-status.component';
import { LcgGridPagerComponent } from './components/lcg-grid-pager/lcg-grid-pager.component';
import { LcgGridCacheDirective } from './directives/lcg-grid-cache.directive';
import { LcgGridSelectableDirective } from './directives/lcg-grid-selectable.directive';
import { LcgGridSortByDirective } from './directives/lcg-grid-sortBy.directive';
import { LcgGridStateDirective } from './directives/lcg-grid-state.directive';
import { LcgGridDirective } from './directives/lcg-grid.directive';
import { LcgGridConfig, LCG_GRID_CONFIG } from './models/lcg-grid-config';
import { OutletName, OutletParam } from './services/lcg-grid-state.service';

const DEFAULT_CONFIG: LcgGridConfig = {
  localeSource: {
    shown: 'shown:',
    to: 'to',
    of: 'of'
  }
};

const components = [
  LcgGridPagerComponent,
  LcgGridPageStatusComponent,
  LcgGridDirective,
  LcgGridStateDirective,
  LcgGridSortByDirective,
  LcgGridCacheDirective,
  LcgGridSelectableDirective
];

@NgModule({
  declarations: components,
  imports: [
      CommonModule,
      RouterModule.forChild(
        [{
            outlet: OutletName,
            path: OutletParam + '/:q',
            children: [
                {
                    path: ':params',
                    redirectTo: OutletParam
                }
            ]
        }]
    )
  ],
  exports: components,
  providers: []
})
export class LcgGridModule {
  static forRoot(config: LcgGridConfig = {}): ModuleWithProviders {
      return {
          ngModule: LcgGridModule,
          providers: [
            config.configProvider ||
            {
              provide: LCG_GRID_CONFIG,
              useValue: {
                localeSource: config.localeSource || DEFAULT_CONFIG.localeSource,
              }
            },
          ]
      };
  }
}
