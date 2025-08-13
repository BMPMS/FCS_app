import React from 'react';

type StackDirection = 'vertical' | 'horizontal';

interface MenuToggleGroupProps {
    direction: StackDirection;
    setDirection: (dir: StackDirection) => void;
    setPanelOpen: (open: boolean) => void;
    containerClass?: string;
}

const MenuToggleGroup: React.FC<MenuToggleGroupProps> = ({
                                                             direction,
                                                             setDirection,
                                                             setPanelOpen,
                                                             containerClass = '',
                                                         }) => {
    return (
        <div
            className={`flex flex-row sm:flex-col sm:space-y-2 sm:space-x-0 space-x-2 ${containerClass}`}
        >
            <div
                className="w-[30px] h-[30px] flex items-center justify-center bg-gray-800 rounded shadow cursor-pointer"
                onClick={() => setPanelOpen(true)}
                aria-label="Open menu"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setPanelOpen(true)}
            >
                <i className="fa-solid fa-bars text-white text-xl"></i>
            </div>

            <div
                className="w-[30px] h-[30px] flex items-center justify-center bg-gray-800 rounded shadow cursor-pointer"
                onClick={() => setDirection(direction === "vertical" ? "horizontal" : "vertical")
                }
                aria-label="Toggle stack direction"
                role="button"
                tabIndex={1}
            >
                <i className={`fa-solid fa-grip-${direction} text-white text-xl`}></i>
            </div>
        </div>
    );
};

export default MenuToggleGroup;
