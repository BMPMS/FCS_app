import React, { useState, ChangeEvent, useRef, useEffect } from "react";
import '../globals.css';

interface SearchPanelProps {
    updateSearchResult: (queries: string[], direction: string) => void;
    className: string;
    searchOptions: { inputs: string[], outputs: string[] };
}

export default function SearchPanel({
                                        updateSearchResult,
                                        className,
                                        searchOptions
                                    }: SearchPanelProps) {

    const [query, setQuery] = useState("");
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [toggleOpen, setToggleOpen] = useState(false);
    const [placeholder, setPlaceholder] = useState("Search inputs");
    const [currentSearchOptions, setCurrentSearchOptions] = useState(searchOptions["inputs"]);
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        setCurrentSearchOptions(searchOptions["inputs"])
    }, [searchOptions])

    const panelRef = useRef<HTMLDivElement>(null); // ref for outside click

    const currentDirection = toggleOpen ? "output" : "input";

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setShowOptions(value !== "");
    };

    const handleToggleOption = (option: string) => {
        const isSelected = selectedOptions.includes(option);
        const newSelected = isSelected
            ? selectedOptions.filter(o => o !== option)
            : [...selectedOptions, option];

        setSelectedOptions(newSelected);
        updateSearchResult(newSelected, currentDirection);

        // If last selected option was removed, hide options
        if (isSelected && newSelected.length === 0) {
            setShowOptions(false);
            setQuery(""); // Optional: clear input as well
        }
    };

    const handleToggleOpen = () => {
        const newDirection = !toggleOpen;
        setToggleOpen(newDirection);
        setPlaceholder(newDirection ? "Search outputs" : "Search inputs");
        const newOptions = searchOptions[newDirection ? "outputs" : "inputs"];
        setCurrentSearchOptions(newOptions);
        setQuery("");
        setShowOptions(false);
        setSelectedOptions([]);
        updateSearchResult([], newDirection ? "output" : "input");

    };

    // Hide dropdown when clicking outside the panel
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setShowOptions(false);
                setQuery("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Separate and sort selected and unselected filtered options
    const filteredSelected = currentSearchOptions
        .filter(opt => selectedOptions.includes(opt) && opt.toLowerCase().includes(query.toLowerCase()));
    const filteredUnselected = currentSearchOptions
        .filter(opt => !selectedOptions.includes(opt) && opt.toLowerCase().includes(query.toLowerCase()));

    const finalOptions = [...filteredSelected, ...filteredUnselected];

    return (
        <div
            ref={panelRef}
            className={`flex flex-col bg-white border border-gray-300 rounded shadow px-2 py-2 w-64 ${className}`}
        >
            <div className="flex items-center h-4 w-full">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() =>  setShowOptions(true)}
                    className="flex-grow h-full px-2 text-sm outline-none"
                />
                <button
                    type="button"
                    aria-label={toggleOpen ? "Collapse" : "Expand"}
                    onClick={handleToggleOpen}
                    className="flex items-center justify-center ml-2"
                >
                    <i
                        style={{ color: toggleOpen ? "#fd8d3c" : "#2171b5" }}
                        className={`fa-solid fa-${toggleOpen ? "up" : "down"}-from-dotted-line hover:text-gray-800 text-base`}
                    />
                </button>
            </div>

            {showOptions && finalOptions.length > 0 && (
                <ul className="mt-1 max-h-40 overflow-auto border border-gray-300 rounded bg-white shadow-sm text-sm">
                    {finalOptions.map(option => {
                        const isSelected = selectedOptions.includes(option);
                        return (
                            <li
                                key={option}
                                onClick={() => handleToggleOption(option)}
                                className={`cursor-pointer px-3 py-1 flex items-center justify-between 
                                    ${isSelected ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
                            >
                                <span>{option}</span>
                                {isSelected && (
                                    <i className="fa-solid fa-check text-green-500 text-xs ml-2" />
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
