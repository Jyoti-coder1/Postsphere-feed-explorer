import React, { useState, useEffect, useRef } from "react";

export default function SearchBar({ onSearch }) {
    const [query, setQuery] = useState("");
    const [mode, setMode] = useState("full"); // title | full | fuzzy
    const debRef = useRef(null);

    useEffect(() => {
        if (debRef.current) clearTimeout(debRef.current);
        debRef.current = setTimeout(() => {
            onSearch(query.trim(), mode);
        }, 350);
        return () => clearTimeout(debRef.current);
    }, [query, mode, onSearch]);

    return (
        <div className="searchbar">
            <input
                aria-label="Search posts"
                value={query}
                placeholder="Search posts, bodies, or author names..."
                onChange={(e) => setQuery(e.target.value)}
            />
            <div className="modes" role="radiogroup" aria-label="Search modes">
                <label>
                    <input type="radio" name="mode" checked={mode === "title"} onChange={() => setMode("title")} /> Title
                </label>
                <label>
                    <input type="radio" name="mode" checked={mode === "full"} onChange={() => setMode("full")} /> Full-text
                </label>
                <label>
                    <input type="radio" name="mode" checked={mode === "fuzzy"} onChange={() => setMode("fuzzy")} /> Fuzzy
                </label>
            </div>
        </div>
    );
}