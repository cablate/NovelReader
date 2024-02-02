export default async function getBook(sourceId: string, bookId: string, page: number) {
  const {data} = await fetch(
    `http://192.168.69.159:5000/api/book?sourceid=${sourceId}&bookid=${bookId}&page=${page}`,
  ).then((res) => res.json());
  return data;
}
