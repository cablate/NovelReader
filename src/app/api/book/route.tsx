import { NextRequest, NextResponse } from "next/server";
import parse from 'node-html-parser';
import { ICategory } from "@/utility/interface";
import { toTW } from "@/utility/method";

export async function GET(
	requestAPI: NextRequest,
) {

    let success = true;

    const sourceid = requestAPI.nextUrl.searchParams.get('sourceid');
    const bookid = requestAPI.nextUrl.searchParams.get('bookid');
    const page = requestAPI.nextUrl.searchParams.get('page');
    const sourceObj = dict_source[sourceid as string] ?? null;

    if (sourceObj == null) {
        return NextResponse.json({error: 'source not found'});
    }

    const res = await fetch(sourceObj.url(bookid, page),
    {
      method: 'GET',
      headers: sourceObj.headers
    }).then(res=>res.text()).then(res=>{
      const result = sourceObj.rule(res);
      return result;
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
        "url": (id?: string, page?: string) => {return `https://www.sto.cx/book-${id}-${page}.html`},
        "headers":{
          'Accept': '*/*',
          'Content-Type': 'text/html; charset=utf-8',
        },
        "rule": (htmlString: string) => {
          const root = parse(htmlString);
          const name = root.querySelector('.bookbox > h1')?.innerText;
          const ads = root.querySelectorAll('[id^="a_d"]')
          ads.forEach((item)=>{
            item.remove();
          })
          let totalPage = 1
          const bookContent = root.querySelector('#BookContent')?.innerHTML;
          const webPages = root.querySelectorAll('#webPage > a')
          if(webPages.length > 0){
            const lastPageHref = webPages[webPages.length - 1].getAttribute('href');
            const match = lastPageHref?.match(/-(\d+)\.html$/);
            if(match){
              totalPage = Number(match[1]);
            }
          }

          return {name: toTW(name as string), context: toTW(bookContent as string), totalPage};
        }
    }
} as { [key: string]: { name: string, url: any, headers: any, rule: (html: string)=> {name: string, context: string, totalPage: number} }}