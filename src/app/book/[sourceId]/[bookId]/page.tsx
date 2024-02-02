"use client";

import {api} from "@/utility/api";
import {IBookData, IBookDetail} from "@/utility/interface";
import {SendCurrentPageName} from "@/utility/method";
import {IconButton, makeStyles} from "@material-ui/core";
import CancelIcon from "@mui/icons-material/Cancel";
import {CircularProgress, Dialog, DialogTitle, Pagination, Skeleton} from "@mui/material";
import Button from "@mui/material/Button";
import {useQuery} from "@tanstack/react-query";
import { format } from "date-fns";
import {useRouter, useSearchParams} from "next/navigation";
import {useEffect, useRef, useState} from "react";

export default function BookList({params}: {params: {sourceId: string; bookId: string}}) {
  const router = useRouter();
  const sourceId = params.sourceId;
  const bookId = params.bookId;
  const searchParams = useSearchParams();
  const page = searchParams.get("page");

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
    SendCurrentPageName(book.name);
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

  const {data: preloadBook} = useQuery(["book", sourceId, bookId, currentPage + 1], ({signal}) =>
    api
      .get(`book?sourceid=${sourceId}&bookid=${bookId}&page=${currentPage + 1}`, {signal})
      .then((res) => res.data)
      .then((data) => {
        return data.data;
      }),
  );

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
          page: currentPage,
          name: bookData?.name,
          date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
          percentage: 100,
        };
      } else {
        const percentage = (scrollTop / (scrollHeight - windowHeight)) * 100;
        recentObj[`${sourceId}-${bookId}`] = {
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
        {isBookDataLoading && <CircularProgress className="m-auto" />}

        {!isBookDataLoading && !bookData && <div className="m-auto text-gray-500">目前沒有資料</div>}

        {!isBookDataLoading && bookData && (
          <div dangerouslySetInnerHTML={{__html: bookData.context}} className="p-[16px] text-[23px]" />
        )}
      </div>

      {/* <Pagination
        className="mx-auto my-[12px] text-black"
        count={bookData?.totalPage}
        page={currentPage}
        variant="outlined"
        shape="rounded"
        onChange={(event, page) => {
          setCurrentPage(page);
          router.push(`/book/${sourceId}/${bookId}?page=${page}`);
        }}
      /> */}


      <div className="border border-t-black flex flex-col justify-center align-middle p-[8px]">
        <div className="flex flex-row justify-between mb-[6px]">
          <Button variant="outlined" className="!bg-[#3f51b5] !text-[#FFF] !p-[2px]  !rounded-md" 
              onClick={()=> {setCurrentPage(page => page-1);router.push(`/book/${sourceId}/${bookId}?page=${currentPage - 1}`);}}
          >
            上一頁
          </Button>
          <Button variant="outlined" className="!bg-[#3f51b5] !text-[#FFF] !p-[2px]  !rounded-md"
              onClick={()=> {router.push(`/search/${sourceId}`)}}>
            回到列表
          </Button>
        </div>
        <Button variant="contained" className="!bg-[#3f51b5] !text-[#FFF] !p-[6px]  !rounded-md">下一頁</Button>
      </div>

      {/* <SimpleDialog sourceId={sourceId} onClose={()=> setIsDialogOpen(false)} selectedId={currentSelectedId} open={isDialogOpen}/> */}
    </div>
  );
}

function SimpleDialog({
  sourceId,
  onClose,
  selectedId,
  open,
}: {
  sourceId: string;
  onClose: () => void;
  selectedId: string | undefined;
  open: boolean;
}) {
  const [bookDetail, setBookDetail] = useState<IBookDetail | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const load = async () => {
    setBookDetail(undefined);
    setIsLoading(true);
    const res = await fetch(`/api/bookIntro?sourceid=${sourceId}&bookid=${selectedId}`);
    const data = await res.json();
    setIsLoading(false);
    setBookDetail(data.data);
  };
  useEffect(() => {
    load();
  }, [selectedId, sourceId]);

  const handleClose = () => {
    onClose();
  };

  const useStyles = makeStyles(() => ({
    MuiPaper: {
      "& .MuiPaper-root": {
        width: "100%",
        height: "60%",
        overflow: "hidden",
        display: "flex",
      },
    },
  }));

  const classes = useStyles();

  return (
    <Dialog onClose={() => handleClose()} open={open} className={classes.MuiPaper}>
      <DialogTitle className="flex flex-row items-center justify-between px-[12px] py-[8px] font-bold">
        <div className="font-bold">簡介</div>
        <IconButton onClick={() => handleClose()}>
          <CancelIcon />
        </IconButton>
      </DialogTitle>

      <div className="p-[12px] flex flex-col flex-1 overflow-hidden">
        <div className="text-[16px] font-bold w-full leading-normal text-black">
          {isLoading && <Skeleton animation="wave" />}
          {!isLoading && bookDetail && bookDetail.name}
        </div>

        <div className="flex-1 p-[12px] flex flex-col w-full items-center justify-between overflow-y-auto overflow-x-hidden">
          <div className="h-[90%] text-[14px] text-black overflow-y-auto overflow-x-hidden">
            {isLoading && (
              <>
                <Skeleton variant="rectangular" width={300} height={50} />
                <Skeleton variant="rectangular" className="mt-[6px]" width={300} height={50} />
                <Skeleton variant="rectangular" className="mt-[6px]" width={300} height={50} />
              </>
            )}
            {!isLoading && bookDetail && bookDetail.data}
          </div>
          <div className="h-[10%] mt-[8px] flex flex-row w-full justify-end">
            {/* <Button color="primary" className="!px-[12px] !bg-[#42A5F5] !rounded-[5px] !mr-[6px]" variant="contained">選擇章節</Button> */}
            <Button
              color="primary"
              className="!px-[12px] !bg-[#42A5F5] !rounded-[5px]"
              variant="contained"
              onClick={() => router.push(`/book/${sourceId}/${selectedId}?page=1`)}
            >
              開始閱讀
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
