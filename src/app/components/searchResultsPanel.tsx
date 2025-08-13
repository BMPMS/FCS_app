import React from 'react';
import ChainForceChart from "@/app/components/ChainForceChart";
import {ChartData} from "@/types/data";

interface SearchResultsPanelProps {
    chartData: ChartData;
    searchNodes: string[];
    searchDirection: string;
    architectureId: number;
    mainContainerClass: string;
}
const SearchResultsPanel = ({ chartData,searchNodes,searchDirection, architectureId , mainContainerClass}: SearchResultsPanelProps) => {
    const divClass = "searchResultsChain";

    return (
        <div className={`${searchNodes.length > 0 ? '' : 'hidden'} fixed top-0 left-[0px] w-[360px] h-full  z-15 md:left-[50px] md:w-[280px]  bg-white shadow-lg`}>
           <div style={{ height: 'calc(100% - 60px)'}}  className={` ${divClass}Container mt-[60px] overflow-y-auto  w-full`}>
                <ChainForceChart mainContainerClass={mainContainerClass} containerClass={divClass} chartData={chartData} searchNodes={searchNodes} searchDirection={searchDirection} architectureId={architectureId}/>
           </div>
        </div>
    );
};

export default SearchResultsPanel;
