"use client"

import { sourceNameTable } from "@/utility";
import { api } from "@/utility/api";
import { ICategory } from "@/utility/interface";
import { SendCurrentPageName } from "@/utility/method";
import { CircularProgress } from "@material-ui/core";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CategoryList({params}: {params: {sourceId: string}}){
    const router = useRouter();
    const sourceId = params.sourceId;
    const [arrCategory, setArrCategory] = useState<Array<ICategory>>([]);

    const { data: categoryData, isLoading: isCategoryLoading } = useQuery(['category', sourceId],
    ({ signal }) => (
        api.get(`/category?sourceid=${sourceId}`, { signal})
        .then((res) => res.data)
        .then((data) => {
            return data.data
        })
    ))

    useEffect(()=>{
        if(!categoryData) return;
        setArrCategory(categoryData.data)
        SendCurrentPageName(categoryData.pageName)
    }, [categoryData])

    return (
        <div className="flex flex-col w-full overflow-auto">
            {isCategoryLoading && <CircularProgress className="m-auto"/>}
            {!isCategoryLoading && arrCategory?.length == 0 && 
                <div className="m-auto text-gray-500">
                    目前沒有資料
                </div>
            }
            {!isCategoryLoading && arrCategory?.length > 0 && arrCategory.map((item, index)=>(
                <div key={index} className="flex flex-col items-start justify-center w-full px-[12px] py-[12px] border-b-2 border-gray-300 cursor-pointer select-none"
                    onClick={()=>{ router.push(`/search/${sourceId}/${item.id}?page=1`) }}
                >
                    <div className="text-[16px] font-bold text-black">{item.name}</div>
                </div>
            ))}
        </div>
    )
}