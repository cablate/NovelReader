"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect} from "react";
import {usePageNameProvider} from "../_Provider/PageNameProvider";

export default function Search() {
  const router = useRouter();
  const {setPageName} = usePageNameProvider();

  useEffect(() => {
    setPageName("常用網站");
  }, []);

  return (
    <div className="flex flex-col w-full">
      <Link
        href={`/search/${"sto"}`}
        className={"flex flex-col items-start justify-center w-full px-[12px] py-[8px] border-b-2 border-gray-300"}
      >
        <div className="text-[16px] font-bold text-black">思兔閱讀</div>
        <div className="text-[14px] text-gray-500">https://www.sto.cx/mindex.aspx</div>
      </Link>
    </div>
  );
}
