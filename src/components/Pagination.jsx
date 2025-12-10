import React from "react";

export default function Pagination({ page, totalPages, onPage }) {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
        <div className="pagination" role="navigation" aria-label="Pagination">
            <button onClick={() => onPage(page - 1)} disabled={page <= 1}>Prev</button>
            {start > 1 && <button onClick={() => onPage(1)}>1</button>}
            {start > 2 && <span>…</span>}
            {pages.map(p => (
                <button key={p} className={p === page ? "active" : ""} onClick={() => onPage(p)}>{p}</button>
            ))}
            {end < totalPages - 1 && <span>…</span>}
            {end < totalPages && <button onClick={() => onPage(totalPages)}>{totalPages}</button>}
            <button onClick={() => onPage(page + 1)} disabled={page >= totalPages}>Next</button>
        </div>
    );
}