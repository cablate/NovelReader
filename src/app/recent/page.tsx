"use client"

import RecentDataRow from "@/components/RecentDataRow";
import { IRecentData } from "@/utility/interface";
import { SendCurrentPageName } from "@/utility/method";
import { useEffect, useState } from "react";
import { usePageNameProvider } from "../_Provider/PageNameProvider";

export default function Recent() {
  const [recentData, setRecentData] = useState<Array<IRecentData>>([]);
  const {setPageName} = usePageNameProvider();
  

  useEffect(() => {
    setPageName('最近閱讀');
    const recent = localStorage.getItem("recent");
    const recentObj = recent ? JSON.parse(recent) : {};
    const data = [] as Array<IRecentData>;
    for (const key in recentObj) {
      const obj = {
        sourceId: key.split('-')[0],
        bookId: key.split('-')[1],
        page: recentObj[key].page,
        date: recentObj[key].date,
        name: recentObj[key].name,
        percentage: recentObj[key].percentage
      }
      data.push(obj);
    }
    setRecentData(data);
  }, []);

  const handleDelete = (sourceId: string, bookId: string) => {
    const newData = recentData.filter(item => item.sourceId != sourceId || item.bookId != bookId)
    setRecentData(newData);
    let recentObj = {} as any;
    newData.forEach(item => {
      recentObj[`${item.sourceId}-${item.bookId}`] = {
        page: item.page,
        date: item.date,
        name: item.name,
        percentage: item.percentage
      }
    })
    localStorage.setItem("recent", JSON.stringify(recentObj));
  }

  return (
    <>
      {recentData.length === 0 && 
        <div className="m-auto text-gray-500">
          目前沒有資料
        </div>
      }
      
      {recentData.length > 0 &&
        <div className="flex flex-col items-center w-full">
          {recentData.map((item, index) => (
            <RecentDataRow key={item.name+index} data={item} handleDelete={handleDelete}/>
          ))}
        </div>
      }
    </>
    
  );
}
