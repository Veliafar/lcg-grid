import { FormGroup } from '@angular/forms';

export interface IConverter {
    serialize(o);
    deserialize(o);
}

export class ConvertableFormGroup extends FormGroup implements IConverter {

    constructor(private readonly formGroup: FormGroup, readonly converters: { [key: string]: IConverter; }) {
        super(formGroup.controls);
    }

    getSerializedValue() {
        return this.serialize(this.formGroup.value);
    }

    deserializeAndPatchValue(v) {
        this.patchValue(this.deserialize(v));
    }

    deserialize(object) {
        const newObj = JSON.parse(JSON.stringify(object));
        for (const path in this.converters) {
            if (this.converters.hasOwnProperty(path)) {
                let propToConvert = this.deepFind(newObj, path);
                this.deepSet(newObj, path, this.converters[path].deserialize(propToConvert));
            }            
        }
        return newObj;
    }

    serialize(object) {
        const newObj = JSON.parse(JSON.stringify(object));
        for (const path in this.converters) {
            if (this.converters.hasOwnProperty(path)) {
                let propToConvert = this.deepFind(newObj, path);
                this.deepSet(newObj, path, this.converters[path].serialize(propToConvert));
            }
        }
        return newObj;
    }

    private deepFind(obj, path) {
        const paths = path.split('.');
        let current = obj;
        for (let i = 0; i < paths.length; ++i) {
          if (current[paths[i]] == undefined) {
            return undefined;
          } else {
            current = current[paths[i]];
          }
        }
        return current;
    }

    private deepSet(obj, path, value) {
        const pathArr = path.split('.');
        for (let i = 0; i < pathArr.length - 1; i++) {
            obj = obj[pathArr[i]];
        }
        if (!obj) {
            return;
        }
        obj[pathArr[pathArr.length - 1]] = value;
    }
}


export const attachConverters = (formGroup: FormGroup, converters: { [key: string]: IConverter; }): ConvertableFormGroup => {
    return new ConvertableFormGroup(formGroup, converters);
};





