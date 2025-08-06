import React from 'react';

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose }) => {
    return (
        <>
            {/* Sliding Side Panel */}
            <div
                className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-30
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
                aria-hidden={!isOpen}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-300">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close menu"
                        className="text-gray-700 hover:text-gray-900 text-2xl font-bold leading-none cursor-pointer"
                    >
                        &times;
                    </button>
                </div>
                {/* Additional panel content can go here */}
                <div className="flex items-center justify-between p-4 ">
                    <h3>Can add content here..</h3>
                </div>

            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-transparent bg-opacity-30 z-20"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
        </>
    );
};

export default SidePanel;
