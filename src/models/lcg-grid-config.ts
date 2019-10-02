import { InjectionToken, Provider } from '@angular/core';

export class LcgGridConfig {
    configProvider?: Provider;
    localeSource?;
}

export const LCG_GRID_CONFIG = new InjectionToken<LcgGridConfig>('LCG_GRID_CONFIG');
