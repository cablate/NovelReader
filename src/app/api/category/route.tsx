import { NextRequest, NextResponse } from "next/server";
import parse from 'node-html-parser';
import { ICategory } from "@/utility/interface";
import { toTW } from "@/utility/method";

export async function GET(
	requestAPI: NextRequest,
) {

    let success = true;

    const id = requestAPI.nextUrl.searchParams.get('sourceid');
    const sourceObj = dict_source[id as string] ?? null;

    if (sourceObj == null) {
        return NextResponse.json({error: 'source not found'});
    }

    const res = await fetch(sourceObj.url,
    {
      method: 'GET',
      headers: sourceObj.headers
    }).then(res=>res.text()).then(res=>{
      const resArr = sourceObj.rule(res);
      return { pageName: sourceObj.name, data:resArr};
    });

    let resObj = {
      result: success,
      data: res
    };

    return NextResponse.json(resObj);
}

const dict_source = {
    sto: {
        name: "思兔閱讀",
        url: "https://www.sto.cx/pcindex.aspx",
        headers:{
          'Accept': '*/*',
          'Content-Type': 'text/html; charset=utf-8',
        },
        rule: (htmlString: string) => {
          const root = parse(htmlString);
          const classBody = root.querySelector('#showClass')
          const arrClass = classBody?.querySelectorAll('a') ?? [];
          const resArr = arrClass.filter(item => item.innerText != '全部').map((item)=>{
            const href = item.getAttribute('href');
            const query = new URLSearchParams(href?.split('?')[1] ?? '');
            const name = item.innerText;
            const id = query.get('c');
            return {
              name: toTW(name),
              id
            }
          })
          return [ {name: '本月熱門', id: '0'}, {name: '讀者推薦', id: '1'}, ...resArr];
        }
    }
} as { [key: string]: { name: string, url: string, headers: any, rule: (html: string)=> Array<ICategory> } }