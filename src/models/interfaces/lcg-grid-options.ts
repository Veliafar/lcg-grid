import { IConverter } from '../../extentions/attachConverters';

export interface LcgGridOptions {
    /**
     * Загружать данные при инициализации
     *
     * @type {boolean}
     * @memberof LcgGridOptions
     */
    loadOnInit?: boolean;
    pageSizeOptions?: Array<number>;
    converter?: IConverter;
}
