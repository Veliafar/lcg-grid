export class GridPage {
    name: string;
    number: number;
    disabled: boolean;
    active: boolean;

    constructor (_name: string,
                 _number: number,
                 _disabled: boolean,
                 _active: boolean) {
        this.name = _name;
        this.number = _number;
        this.disabled = _disabled;
        this.active = _active;
    }
}
