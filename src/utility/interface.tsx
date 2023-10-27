export interface ICategory{
    name: string,
    id: string
}

export interface IBookBlock{
    name: string,
    id: string
}

export interface IBookDetail{
    name: string,
    data: string
}

export interface IBookData{
    name: string,
    id: string,
    context: string,
    totalPage: number,
}


export interface IRecentData{
    sourceId: string;
    bookId: string;
    page: number;
    date: string;
    name: string;
    percentage: number;
}