"use client";

import { usePageNameProvider } from "@/app/_Provider/PageNameProvider";
import {api} from "@/utility/api";
import {IBookData} from "@/utility/interface";
import {SendCurrentPageName} from "@/utility/method";
import Button from "@mui/material/Button";
import {useQuery} from "@tanstack/react-query";
import {format} from "date-fns";
import {useRouter, useSearchParams} from "next/navigation";
import {useEffect, useRef, useState} from "react";

export default function Client({
  params,
  children,
}: {
  params: {sourceId: string; bookId: string};
  children: React.ReactNode;
}) {
  const router = useRouter();
  const sourceId = params.sourceId;
  const bookId = params.bookId;
  const searchParams = useSearchParams();
  const page = searchParams.get("page");
  const categoryId = searchParams.get("c");
  const {setPageName} = usePageNameProvider();

  const refContext = useRef<HTMLDivElement>(null);

  const [bookData, setBookData] = useState<IBookData | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(page ? Number(page) : 1);

  const [firstLoad, setFirstLoad] = useState<boolean>(true);

  const {data: book, isLoading: isBookDataLoading} = useQuery(["book", sourceId, bookId, currentPage], ({signal}) =>
    api
      .get(`book?sourceid=${sourceId}&bookid=${bookId}&page=${currentPage}`, {signal})
      .then((res) => res.data)
      .then((data) => {
        return data.data;
      }),
  );
  useEffect(() => {
    if (!book) return;
    setBookData(book);
    setPageName(book.name);
  }, [book, currentPage]);

  useEffect(() => {
    if (!bookData) return;
    if (firstLoad && refContext.current) {
      const recentObj = localStorage.getItem("recent");
      const recent = recentObj ? JSON.parse(recentObj) : {};
      const recentBook = recent[`${sourceId}-${bookId}`];
      if (!recentBook) {
        setFirstLoad(false);
      } else {
        const scrollHeight = refContext.current.scrollHeight;
        const windowHeight = refContext.current.clientHeight;
        const scrollTop = (scrollHeight - windowHeight) * (recentBook.percentage / 100);
        refContext.current.scrollTop = scrollTop;
        setFirstLoad(false);
      }
    }
    if (!firstLoad && refContext.current) refContext.current.scrollTop = 0;
  }, [bookData]);

  // const {data: preloadBook} = useQuery(["book", sourceId, bookId, currentPage + 1], ({signal}) =>
  //   api
  //     .get(`book?sourceid=${sourceId}&bookid=${bookId}&page=${currentPage + 1}`, {signal})
  //     .then((res) => res.data)
  //     .then((data) => {
  //       return data.data;
  //     }),
  // );

  useEffect(() => {
    const saveScrollPercentage = () => {
      if (!refContext.current) return;
      const scrollHeight = refContext.current.scrollHeight;
      const scrollTop = refContext.current.scrollTop;
      const windowHeight = refContext.current.clientHeight;

      let recent = localStorage.getItem("recent");
      let recentObj = recent ? JSON.parse(recent) : {};

      if (scrollHeight - scrollTop === windowHeight) {
        recentObj[`${sourceId}-${bookId}`] = {
          categoryId: categoryId,
          page: currentPage,
          name: bookData?.name,
          date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
          percentage: 100,
        };
      } else {
        const percentage = (scrollTop / (scrollHeight - windowHeight)) * 100;
        recentObj[`${sourceId}-${bookId}`] = {
          categoryId: categoryId,
          page: currentPage,
          name: bookData?.name,
          date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
          percentage: percentage.toFixed(2),
        };
      }
      localStorage.setItem("recent", JSON.stringify(recentObj));
    };

    refContext.current?.addEventListener("scroll", saveScrollPercentage);
    return () => {
      refContext.current?.removeEventListener("scroll", saveScrollPercentage);
    };
  }, [bookData, currentPage, sourceId, bookId]);

  return (
    <div className="w-full flex flex-col justify-between">
      <div className="flex flex-col flex-1 w-full overflow-auto" ref={refContext}>
        {children}
      </div>

      <div className="border border-t-black flex flex-col justify-center align-middle p-[8px]">
        <div className="flex flex-row justify-between mb-[6px]">
          <Button
            variant="outlined"
            className="!bg-[#3f51b5] !text-[#FFF] !p-[2px]  !rounded-md"
            onClick={() => {
              if(currentPage -1 < 1) {
                router.back();
                return;
              }
              setCurrentPage((page) => page - 1);
              router.replace(`/book/${sourceId}/${bookId}?page=${currentPage - 1}`);
            }}
          >
            上一頁
          </Button>
          <Button
            variant="outlined"
            className="!bg-[#3f51b5] !text-[#FFF] !p-[2px]  !rounded-md"
            onClick={() => {
              router.push(`/search/${sourceId}/${categoryId}`);
            }}
          >
            回到列表
          </Button>
        </div>
        <Button
          variant="contained"
          className="!bg-[#3f51b5] !text-[#FFF] !p-[6px]  !rounded-md"
          onClick={() => {
            setCurrentPage((page) => page + 1);
            router.replace(`/book/${sourceId}/${bookId}?page=${currentPage + 1}`);
          }}
        >
          下一頁
        </Button>
      </div>
    </div>
  );
}
