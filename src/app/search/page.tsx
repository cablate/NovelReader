"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";


export default function Search() {
  const router = useRouter();

  return (
    <div className="flex flex-col w-full">
      <Link
			href={`/search/${'sto'}`}
			className={"flex flex-col items-start justify-center w-full px-[12px] py-[8px] border-b-2 border-gray-300"}			
		  >
        <div className="text-[16px] font-bold text-black">思兔閱讀</div>
        <div className="text-[14px] text-gray-500">https://www.sto.cx/mindex.aspx</div>
      </Link>
    </div>
  );
}