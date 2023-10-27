"use client"

import { IBookDetail, IRecentData } from "@/utility/interface";
import { Button, Dialog, DialogTitle } from "@mui/material";
import {IconButton, makeStyles} from "@material-ui/core";
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import { useRouter } from "next/navigation";
import Dropdown from "../Dropdown";

import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { api } from "@/utility/api";
import { Skeleton } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import CancelIcon from "@mui/icons-material/Cancel";

export default function RecentDataRow({data, handleDelete}: {data: IRecentData, handleDelete: (a:string, bid:string ) => void}){
    const router = useRouter();

    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [deleteId, setDeleteId] = useState<string | undefined>(undefined);

    const copyUrl = async (sourceId:string, bookId: string) =>{
      switch (sourceId) {
        case 'sto':
          return await navigator.clipboard.writeText(`https://www.sto.cx/book-${bookId}-1.html`);
      }
    }

    return(
      <>
        <div className="flex flex-row items-start w-full px-[12px] py-[8px] border-b-2 border-gray-300 cursor-pointer"
            onClick={()=> router.push(`/book/${data.sourceId}/${data.bookId}?page=${data.page}`)}
        >
            {/* 封面 */}
            {/* <img className="w-[60px] h-[80px]"/> */}

            {/* 資訊 */}
            <div className="flex flex-col flex-1 justify-start ml-[8px]">
                <div className="text-[12px] text-gray-500 mb-[8px]">{data.sourceId}</div>
                <div className="text-[16px] font-bold text-black">{data.name}</div>
            </div>

            {/* 尾部 */}
            <div className="flex flex-col justify-end items-end">
                <div className="text-[12px] text-blue-500">{data.date}</div>
                <Dropdown
                    placement="bottom-right"
                    appendTo='button'
                    menu={(
                        <ul>
                            <li onClick={(e)=>{e.preventDefault(); setIsDialogOpen(true)}}><DeleteForeverIcon/>刪除</li>
                            <li onClick={(e)=>{e.preventDefault(); copyUrl(data.sourceId, data.bookId)}}><ContentCopyIcon/>複製本書連結</li>
                        </ul>
                    )}>
                    <IconButton><MoreVertOutlinedIcon/></IconButton>
                </Dropdown>
            </div>

            
        </div>

        <SimpleDialog sourceId={data.sourceId} onClose={()=>{setIsDialogOpen(false)}} selectedId={deleteId} open={isDialogOpen} handleDelete={()=>handleDelete(data.sourceId, data.bookId)}/>
      </>
    )
}

function SimpleDialog({
    sourceId,
    onClose,
    selectedId,
    open,
    handleDelete
  }: {
    sourceId: string;
    onClose: () => void;
    selectedId: string | undefined;
    open: boolean;
    handleDelete: () => void;
  }) {   
    const handleClose = () => {
      onClose();
    };
  
    const useStyles = makeStyles(() => ({
      MuiPaper: {
        "& .MuiPaper-root": {
          width: "100%",
          height: "auto",
          overflow: "hidden",
          display: "flex",
        },
      },
    }));
  
    const classes = useStyles();
  
    return (
      <Dialog onClose={() => handleClose()} open={open} className={classes.MuiPaper}>
        <DialogTitle className="flex flex-row items-center justify-between px-[12px] py-[8px] font-bold">
          <div className="font-bold">刪除</div>
          <IconButton onClick={(e) => { e.stopPropagation(); handleClose()}}>
            <CancelIcon />
          </IconButton>
        </DialogTitle>

        <div className="p-[12px] flex flex-col w-full items-center justify-between overflow-y-auto overflow-x-hidden">
        
            <div className="p-[6px]">是否確認刪除？</div>

            <div className="mt-[8px] flex flex-row w-full justify-end">
                {/* <Button color="primary" className="!px-[12px] !bg-[#42A5F5] !rounded-[5px] !mr-[6px]" variant="contained">選擇章節</Button> */}
                <Button
                  color="primary"
                  className="!px-[12px] !bg-[#42A5F5] !rounded-[5px]"
                  variant="contained"
                  onClick={(e) => {e.stopPropagation(); handleDelete(); handleClose()}}
                >
                  刪除
                </Button>
            </div>
        </div>
      </Dialog>

    );
  }