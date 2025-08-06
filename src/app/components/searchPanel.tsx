import React, { useState, ChangeEvent, KeyboardEvent } from "react";
import '../globals.css';

interface SearchPanelProps {
    onSearch?: (query: string) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchPanel({
                                        onSearch,
                                        placeholder = "Search...",
                                        className = "",
                                    }: SearchPanelProps) {
    const [query, setQuery] = useState("");
    const [toggleOpen, setToggleOpen] = useState(false);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            triggerSearch();
        }
    };

    const triggerSearch = () => {
        if (onSearch) {
            onSearch(query);
        } else {
            alert(`Searching for: ${query}`);
        }
    };

    return (
        <div
            className={`flex items-center bg-white border border-gray-300 rounded shadow px-2 h-9 w-64 ${className}`}
        >
            <input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="flex-grow h-full px-2 text-sm outline-none"
            />

            {/* Icons container with spacing */}
            <div className="flex items-center gap-3 ml-2">
                <button
                    type="button"
                    aria-label="Search"
                    onClick={triggerSearch}
                    className="flex items-center justify-center"
                >
                    <i className="fa-solid fa-magnifying-glass text-gray-600 hover:text-black text-base" />
                </button>

                <button
                    type="button"
                    aria-label={toggleOpen ? "Collapse" : "Expand"}
                    onClick={() => setToggleOpen(!toggleOpen)}
                    className="flex items-center justify-center"
                >
                    <i style={{ color: `${toggleOpen ?  "#fd8d3c": "#2171b5" }` }}
                        className={`fa-solid fa-${toggleOpen ? "up" : "down"}-from-dotted-line  hover:text-gray-800 text-base`}
                    />
                </button>
            </div>
        </div>
    );
}
