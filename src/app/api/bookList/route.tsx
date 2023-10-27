import { NextRequest, NextResponse } from "next/server";
import parse from 'node-html-parser';
import { ICategory } from "@/utility/interface";
import { toTW } from "@/utility/method";

export async function GET(
	requestAPI: NextRequest,
) {

    let success = true;

    const sourceid = requestAPI.nextUrl.searchParams.get('sourceid');
    const categoryid = requestAPI.nextUrl.searchParams.get('categoryid');
    const page = requestAPI.nextUrl.searchParams.get('page');
    const sourceObj = dict_source[sourceid as string] ?? null;

    if (sourceObj == null) {
        return NextResponse.json({error: 'source not found'});
    }
    let url = sourceObj.url(categoryid, page);

    // 特規 - 思兔閱讀
    if(sourceid === 'sto' && (categoryid === '0' || categoryid === '1')){
      url = sourceObj.ex_url();
    }
    
    const res = await fetch(url,
    {
      method: 'GET',
      headers: sourceObj.headers
    }).then(res=>res.text()).then(res=>{
      let result = {pageName: '', data:[] as ICategory[]};
      if(sourceid === 'sto' && (categoryid === '0' || categoryid === '1')){
        result = sourceObj.ex_rule(res, Number(categoryid));
      }
      else{
        result = sourceObj.rule(res);
      }
      
      return {pageName: result.pageName, data:result.data};
    });
    
    let resObj = {
      result: success,
      data: res
    };

    return NextResponse.json(resObj);
}

const dict_source = {
    "sto": {
        "name": "思兔閱讀",
        "url": (id?: string, page?: string) => {return `https://www.sto.cx/sbn.aspx?c=${id}&page=${page}`},
        "ex_url": () => {return "https://www.sto.cx/pcindex.aspx"},
        "headers":{
          'Accept': '*/*',
          'Content-Type': 'text/html; charset=utf-8',
        },
        "rule": (htmlString: string) => {
          const root = parse(htmlString);
          const category = root.querySelector('#showClass')?.querySelector('.sx')?.innerText;
          const arrClass = root.querySelectorAll('.slistbody')
          const resArr = arrClass.map((item)=>{
            const a = item.querySelector('a:not(:has(img))')?.innerText
            const href = item.querySelector('a:not(:has(img))')?.getAttribute('href');
            const name = a;
            const regex = /\/book-(\d+)-\d+\.html/;
            const match = href!.match(regex);

            if (match) {
              const id = match[1];
              return {
                name: toTW(name),
                id
              }
            } 
            else {
              return {
                name: toTW(name),
                id: null
              };
            }            
          })
          return {pageName: category, data: resArr};
        },
        "ex_rule": (htmlString: string, index: number) => {
          const root = parse(htmlString);
          const category = root.querySelectorAll('.lrit')[index]?.innerText;
          const arrBooks = root.querySelectorAll('.itjlist')[index]?.querySelectorAll('div');
          const resArr = arrBooks?.map((item)=>{
            const name = item.innerText;
            const href = item.querySelector('a')?.getAttribute('href');
            const regex = /\/book-(\d+)-\d+\.html/;
            const match = href!.match(regex);

            if (match) {
              const id = match[1];
              return {
                name: toTW(name),
                id
              }
            }
            else {
              return {
                name: toTW(name),
                id: null
              };
            }
          })
          return {pageName: category, data: resArr};
        }
    }
} as { 
  [key: string]: { 
    name: string, 
    url: any, 
    ex_url: any, 
    headers: any, 
    rule: (html: string)=> {pageName: string, data: Array<ICategory> },
    ex_rule: (html: string, index: number)=> {pageName: string, data: Array<ICategory> }
  }
}