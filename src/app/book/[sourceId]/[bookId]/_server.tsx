"use server";

import getBook from "./_api";

export default async function Server({
  params,
  searchParams,
}: {
  params: {sourceId: string; bookId: string};
  searchParams: {page: string};
}) {
  const sourceId = params.sourceId;
  const bookId = params.bookId;
  const {page} = searchParams;

  const book = await getBook(sourceId, bookId, page ? Number(page) : 1);

  return <>{<div dangerouslySetInnerHTML={{__html: book.context}} className="p-[16px] text-[16px]" />}</>;
}
