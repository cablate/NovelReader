"use client";

import { usePageNameProvider } from "@/app/_Provider/PageNameProvider";
import {api} from "@/utility/api";
import {IBookDetail, ICategory} from "@/utility/interface";
import {IconButton, makeStyles} from "@material-ui/core";
import CancelIcon from "@mui/icons-material/Cancel";
import {CircularProgress, Dialog, DialogTitle, Pagination, Skeleton} from "@mui/material";
import Button from "@mui/material/Button";
import {useQuery} from "@tanstack/react-query";
import {useRouter, useSearchParams} from "next/navigation";
import {useEffect, useState} from "react";
import styles from './page.module.scss';
import 'swiper/css'
import { Metadata } from "next";

export default function BookList({params}: {params: {sourceId: string; categoryId: string}}) {
  const router = useRouter();
  const sourceId = params.sourceId;
  const categoryId = params.categoryId;
  const searchParams = useSearchParams();
  const page = searchParams.get("page");

  const {setPageName} = usePageNameProvider();

  const [arrBooks, setArrBooks] = useState<Array<ICategory>>([]);
  const [currentPage, setCurrentPage] = useState<number>(page ? Number(page) : 1);

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [currentSelectedId, setCurrentSelectedId] = useState<string | undefined>(undefined);

  const {data: bookListData, isLoading: isBookListLoading} = useQuery(
    ["bookList", sourceId, categoryId, currentPage],
    ({signal}) =>
      api
        .get(`bookList?sourceid=${sourceId}&categoryid=${categoryId}&page=${currentPage}`, {signal})
        .then((res) => res.data)
        .then((data) => {
          return data.data;
        }),
  );

  const {data: preloadBookListData} = useQuery(["bookList", sourceId, categoryId, currentPage + 1], ({signal}) =>
    api
      .get(`bookList?sourceid=${sourceId}&categoryid=${categoryId}&page=${currentPage + 1}`, {signal})
      .then((res) => res.data)
      .then((data) => {
        return data.data;
      }),
  );

  useEffect(() => {
    if (!bookListData) return;
    setArrBooks(bookListData.data);
    setPageName(bookListData.pageName);
  }, [bookListData]);

  const swipe = false;

  return (
    <div className="w-full flex flex-col justify-between">
      <div className="flex flex-col flex-1 w-full overflow-auto">
        {isBookListLoading && <CircularProgress className="m-auto" />}

        {!isBookListLoading && arrBooks.length == 0 && <div className="m-auto text-gray-500">目前沒有資料</div>}

        {!isBookListLoading &&
          arrBooks.length > 0 &&
            <>
            {swipe ?
              <div className={styles['book-list-container']}>
                  {arrBooks.map((item, index) => {
                    return (
                        <div className={styles['book-card']} data-isCurrent={index === 0}>
                          {item.name}
                        </div>
                    )
                  })}
              </div>
              :
              <>
                {arrBooks.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center w-full px-[12px] py-[12px] border-b-2 border-gray-300 cursor-pointer select-none"
                    onClick={() => {
                      setIsDialogOpen(true);
                      setCurrentSelectedId(item.id);
                    }}
                  >
                    <div className="text-[16px] font-bold w-full leading-normal text-black text-ellipsis overflow-hidden whitespace-nowrap">
                      {item.name}
                    </div>
                  </div>
                  ))
                }
              </>
            }
            </>
        }
      </div>
      { !(sourceId === 'sto' && (categoryId == '0' || categoryId == '1')) &&
        <Pagination
          className="mx-auto my-[12px] text-black"
          count={50}
          page={currentPage}
          variant="outlined"
          shape="rounded"
          onChange={(event, page) => {
            setCurrentPage(page);
            router.push(`/search/${sourceId}/${categoryId}?page=${page}`);
          }}
        />
      }

      <SimpleDialog
        categoryId={categoryId}
        sourceId={sourceId}
        onClose={() => setIsDialogOpen(false)}
        selectedId={currentSelectedId}
        open={isDialogOpen}
      />
    </div>
  );
}

function SimpleDialog({
  categoryId,
  sourceId,
  onClose,
  selectedId,
  open,
}: {
  categoryId: string;
  sourceId: string;
  onClose?: () => void;
  selectedId: string | undefined;
  open?: boolean;
}) {
  const [bookDetail, setBookDetail] = useState<IBookDetail | undefined>(undefined);
  const router = useRouter();

  const {data: bookIntroData, isLoading: isBookIntroLoading} = useQuery(
    ["bookIntro", sourceId, selectedId],
    ({signal}) =>
      api
        .get(`bookIntro?sourceid=${sourceId}&bookid=${selectedId}`, {signal})
        .then((res) => res.data)
        .then((data) => {
          return data.data;
        }),
  );

  useEffect(() => {
    if (!bookIntroData) return;
    setBookDetail(bookIntroData);
  }, [bookIntroData]);

  const handleClose = () => {
    onClose && onClose();
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
    <Dialog onClose={() => handleClose()} open={open || false} className={classes.MuiPaper}>
      <DialogTitle className="flex flex-row items-center justify-between px-[12px] py-[8px] font-bold">
        <div className="font-bold">簡介</div>
        <IconButton onClick={() => handleClose()}>
          <CancelIcon />
        </IconButton>
      </DialogTitle>

      <div className="p-[12px] flex flex-col flex-1 overflow-hidden">
        <div className="text-[16px] font-bold w-full leading-normal text-black">
          {isBookIntroLoading && <Skeleton animation="wave" />}
          {!isBookIntroLoading && bookDetail && bookDetail.name}
        </div>

        <div className="flex-1 p-[12px] flex flex-col w-full items-center justify-between overflow-y-auto overflow-x-hidden">
          <div className="h-[90%] text-[14px] text-black overflow-y-auto overflow-x-hidden whitespace-pre-wrap">
            {isBookIntroLoading && (
              <>
                <Skeleton variant="rectangular" width={300} height={50} />
                <Skeleton variant="rectangular" className="mt-[6px]" width={300} height={50} />
                <Skeleton variant="rectangular" className="mt-[6px]" width={300} height={50} />
              </>
            )}
            {!isBookIntroLoading && bookDetail && bookDetail.data.replaceAll(/\s+/g, '\n')}
          </div>
          <div className="h-[10%] mt-[8px] flex flex-row w-full justify-end">
            {/* <Button color="primary" className="!px-[12px] !bg-[#42A5F5] !rounded-[5px] !mr-[6px]" variant="contained">選擇章節</Button> */}
            <Button
              color="primary"
              className="!px-[12px] !bg-[#42A5F5] !rounded-[5px]"
              variant="contained"
              onClick={() => router.push(`/book/${sourceId}/${selectedId}?c=${categoryId}page=1`)}
            >
              開始閱讀
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
