export interface LcgGridStatus {
    pageSize: number;
    pageNumber: number;
    pageCount: number;
    totalCount: number;
}

export interface LcgGridPagedResult extends LcgGridStatus {
    results: any[];
}
