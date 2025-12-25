'use client';

// Type definition for Sort component props
interface Props {
  sort: string; // Sort criteria
  perPage: number; // Items per page
  keyword: string; // Search keyword
}

export default function Sort({ sort, perPage, keyword }: Props) {
  return (
    <form action="/products" method="GET" className="w-full sm:w-auto">
      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="perPage" value={perPage} />
      <input type="hidden" name="keyword" value={keyword} />
      <select
        name="sort"
        value={sort}
        className="w-full sm:w-48 border border-stone-300 rounded-md px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2"
        onChange={(e) => e.currentTarget.form?.submit()}
      >
        <option value="new">Newest First</option>
        <option value="priceAsc">Price: Low to High</option>
      </select>
    </form>
  );
}