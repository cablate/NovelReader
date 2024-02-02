import { Metadata } from "next";
import getBook from "./_api";
import Client from "./_client";
import Server from "./_server";

export async function generateMetadata({
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
  return {
    title: book.name,
    description: book.name,
  } as Metadata
}

export default async function BookList({
  params,
  searchParams,
}: {
  params: {sourceId: string; bookId: string};
  searchParams: {page: string};
}) {
  return (
    <Client params={params}>
      <Server params={params} searchParams={searchParams} />
    </Client>
  );
}
