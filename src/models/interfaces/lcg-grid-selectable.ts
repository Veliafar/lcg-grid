export interface LcgGridSelectable {

    selectedItems: any[];

    isAllSelected: boolean;

    attachItems(items: any[]);

    toggleSelectAll();

    toggleSelectItem(item);

    resetSelection();
}

