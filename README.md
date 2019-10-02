# LcgAdmGridModule

LcgAdmGridModule allows to add pagination with page header and sort mechanism to your project.

## Commands

Tests
> npm run test
> npm run test:watch

Build
> npm run build

Release
> npm run release

## Roadmap

1. Remake page status, and pager components
2. Make common basic table creator component


TODO: update readme


# Examples
## FormGroup serialization before loading

Step 1:

```typescript
import { DateConverter } from 'js-ts-mapper';
import { attachConverters } from '@lcgroup/grid';

const dateConverter = new DateConverter();

// build form and attach converters
    buildForm(): FormGroup {
        const group = this.fb.group({
            comment: [null, [Validators.maxLength(1000)]],
            registrationDate: this.fb.group({
                from: [null, null],
                to: [null, null],
            }),
        });

        return attachConverters(group, {
            'registrationDate.from': dateConverter,
            'registrationDate.to': dateConverter,
        });
    }

```

Step 2:

Set form as converter to options

```html
    [lcg-grid-options]="{ converter: form }"
```
