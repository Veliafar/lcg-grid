import { LcgGridSelectable } from "./interfaces/lcg-grid-selectable";

const NULLO_MESSAGE = '[lcg-grid] Attemp to call .select method. To enable select functionality use [lcg-grid-selectable] directive';

export class NulloLcgGridSelectable implements LcgGridSelectable {
    selectedItems: [] = [];
    isAllSelected: boolean = false;
    attachItems(items: any[]) {
        console.warn(NULLO_MESSAGE);
    }
    toggleSelectAll() {
        console.warn(NULLO_MESSAGE);
    }
    toggleSelectItem(item: any) {
        console.warn(NULLO_MESSAGE);
    }
    resetSelection() {
        console.warn(NULLO_MESSAGE);
    }
}
