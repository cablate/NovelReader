import { toTW } from "@/utility/method";
import { NextRequest, NextResponse } from "next/server";
import parse from 'node-html-parser';

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

    const res = await fetch(sourceObj.url(bookid),
    {
      method: 'GET',
      headers: sourceObj.headers
    }).then(res=>res.text()).then(res=>{
      const result = sourceObj.rule(res);
      return {name: result.name, data:result.data};
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
        "url": (id?: string) => {return `https://www.sto.cx/bookintro.aspx?id=${id}`},
        "headers":{
          'Accept': '*/*',
          'Content-Type': 'text/html; charset=utf-8',
        },
        "rule": (htmlString: string) => {
          const root = parse(htmlString);
          const nameEle = root.querySelectorAll('a')
          const name = nameEle[0]?.innerText;
          nameEle.map((item)=>{
            item.remove();
          })

          const content = root.querySelector('body')?.innerText;

          return {name, data: toTW(content)};
        }
    }
} as {[key: string]: {
    name: string,
    url: (id?: string|null) => string,
    headers: {[key: string]: string},
    rule: (htmlString: string) => {name: string, data: string}
}}