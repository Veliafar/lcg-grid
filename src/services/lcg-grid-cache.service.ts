import { Observable } from 'rxjs';
import { publishReplay, refCount } from 'rxjs/operators';

const DefaultExp = 5000;
interface CacheDescriptor { time: number; obs$: Observable<any>; }

export class LcgGridCacheService {
    private cachedObservers: { [key: string]: CacheDescriptor } = {};
    private cacheExpiration = DefaultExp;

    /**
     *  Установить время истечения кэша
     *
     * @param {number} ms - истечение через Х мс (По-умолчанию: 5000)
     * @memberof LcgGridCacheService
     */
    setCacheExp(ms: number) {
        const notANumber = (typeof(ms) !== 'number');
        if (notANumber && ms) {
            console.warn(`[lcg-grid] Cache expiration must be milliseconds (typeof number). Dropped to default ${DefaultExp} ms`);
        }
        this.cacheExpiration = notANumber || !ms ? DefaultExp : ms;
    }

    cache(filter, obs: Observable<any>, force: boolean = false) {
        const filterHash = this.simpleHash(JSON.stringify(filter)).toString();

        for (const c in this.cachedObservers) { // Cleanup expired
            if (this.cachedObservers.hasOwnProperty(c)) {
                const isExpiredCache = (Date.now() - this.cachedObservers[c].time) >= this.cacheExpiration;
                if (isExpiredCache) {
                    delete this.cachedObservers[c];
                }
            }
        }

        if (!this.cachedObservers[filterHash] || force) {
            const cache$ = obs.pipe(
                publishReplay(1), // this tells Rx to cache the latest emitted
                refCount() // and this tells Rx to keep the Observable alive as long as there are any Subscribers
            );
            this.cachedObservers[filterHash] = { time: Date.now(), obs$: cache$ };
        }
        return this.cachedObservers[filterHash].obs$;
    }

    invalidate() {
        this.cachedObservers = {};
    }

    private simpleHash(str: string) {
        var hash = 0;
        if (str.length == 0) {
            return hash;
        }
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);

            hash = ((hash<<5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
}
