import NextLink from "next/link";

import { cn } from "@/lib/utils";

interface PaginationNavProps {
  basePath: string;
  className?: string;
  currentPage: number;
  totalPages: number;
}

function buildPageHref(basePath: string, page: number): string {
  if (page <= 1) {
    return basePath;
  }

  return `${basePath}?page=${page}`;
}

function getVisiblePages(currentPage: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export function PaginationNav({
  basePath,
  className,
  currentPage,
  totalPages,
}: PaginationNavProps) {
  if (totalPages <= 1) {
    return null;
  }

  const prevPage = currentPage - 1;
  const nextPage = currentPage + 1;
  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
    >
      {currentPage > 1 ? (
        <NextLink
          className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm font-medium transition-colors hover:bg-muted"
          href={buildPageHref(basePath, prevPage)}
        >
          Previous
        </NextLink>
      ) : (
        <span className="inline-flex h-9 cursor-not-allowed items-center rounded-md border border-input px-3 text-sm font-medium text-muted-foreground opacity-60">
          Previous
        </span>
      )}

      {visiblePages.map((page, index) => {
        if (page === "...") {
          return (
            <span
              className="inline-flex h-9 w-9 items-center justify-center text-sm text-muted-foreground"
              key={`ellipsis-${index}`}
            >
              ...
            </span>
          );
        }

        const isCurrent = page === currentPage;

        return isCurrent ? (
          <span
            aria-current="page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-primary bg-primary text-sm font-medium text-primary-foreground"
            key={page}
          >
            {page}
          </span>
        ) : (
          <NextLink
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input text-sm font-medium transition-colors hover:bg-muted"
            href={buildPageHref(basePath, page)}
            key={page}
          >
            {page}
          </NextLink>
        );
      })}

      {currentPage < totalPages ? (
        <NextLink
          className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm font-medium transition-colors hover:bg-muted"
          href={buildPageHref(basePath, nextPage)}
        >
          Next
        </NextLink>
      ) : (
        <span className="inline-flex h-9 cursor-not-allowed items-center rounded-md border border-input px-3 text-sm font-medium text-muted-foreground opacity-60">
          Next
        </span>
      )}
    </nav>
  );
}