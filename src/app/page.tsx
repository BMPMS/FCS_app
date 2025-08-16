'use client';

import '@fortawesome/fontawesome-free/css/all.min.css';
import '@fortawesome/fontawesome-pro/css/all.min.css';
import ARCH from "@/app/data/ARCHnew.json";
import COMPGRP1 from "@/app/data/COMPGRP1.json"
import CN from "@/app/data/CN.json";
import MFON from "@/app/data/MFON.json";
import MIN from "@/app/data/MIN.json";
import MEN from "@/app/data/MEN.json";
import MON from "@/app/data/MON.json";
import OEN from "@/app/data/OEN.json";
import OFON from "@/app/data/OFON.json";
import OIN from "@/app/data/OIN.json";
import PPN from "@/app/data/PPN.json";
import PPON from "@/app/data/PPON.json";
import {ChartData, ChartLink, ChartNode, DataLink, DataNode} from "@/types/data";
import { useState} from "react";
import {getLinkId} from "@/app/components/sharedFunctions";
import SidePanel from "@/app/components/sidePanel";
import SearchPanel from "@/app/components/searchPanel";
import MainForceChart from "@/app/components/MainForceChart";
import SearchResultsPanel from "@/app/components/searchResultsPanel";
import MenuToggleGroup from "@/app/components/MenuToggleGroup";

const addProps = (networkData: {network: string, network_desc: string, nodes: DataNode[], links: DataLink[] }) => {


    const {nodes,links, network, network_desc} = networkData;
    const allLinks = links.reduce((acc, entry,i) => {
        const source = `${entry.source.split("-")[0]}-${network}`;
        const target = `${entry.target.split("-")[0]}-${network}`;
        acc.push({
            source,
            target,
            type: entry.type,
            id: `${network}-${i}`
        })
        return acc;
    },[] as ChartLink[])

    if(!nodes.some((s) => s.nodeDepth === undefined)) return {network, network_desc, nodes: nodes as ChartNode[], links: allLinks};;

    let sourceNodes = allLinks
        .filter((f) => !allLinks.some((s) => s.target === f.source));
    const sourceNodeIds = [... new Set(sourceNodes.map((m) => m.source))];
    let targetNodeIds = [... new Set(sourceNodes.map((m) => m.target))];
    let currentDepth = 1;
    nodes.map((m) => {
        const nodeId  = `${m.node}-${network}`
        m.id = nodeId;
        if(!allLinks.some((s) => getLinkId(s, "source") === nodeId || getLinkId(s,"target") === nodeId)){
            m.nodeDepth = 0;
        }
        if(sourceNodeIds.includes(nodeId)){
            m.nodeDepth = currentDepth;
        }
        if(targetNodeIds.includes(nodeId)){
            m.nodeDepth = currentDepth + 1;
        }
    })

    currentDepth += 2

    while(nodes.some((s) => s.nodeDepth === undefined)){

        sourceNodes = allLinks
            .filter((f) => targetNodeIds.includes(getLinkId(f,"source")));
        targetNodeIds = [... new Set(sourceNodes.map((m) => getLinkId(m,"target")))];
        nodes.map((m) => {
            if (m.id && targetNodeIds.includes(m.id) && !m.nodeDepth) {
                m.nodeDepth = currentDepth;
            }
        });
        currentDepth += 1
    }


    return {network, network_desc, nodes: nodes as ChartNode[], links: allLinks};
}

const chartData: ChartData =  {
    architecture: ARCH.architectures,
    networks: [
        {id: "COMPGRP1",data: addProps(COMPGRP1)},
        {id: "CN",data: addProps(CN)},
        {id: "OEN",data: addProps(OEN)},
        {id: "OFON",data: addProps(OFON)},
        {id: "OIN",data: addProps(OIN)},
        {id: "MFON",data: addProps(MFON)},
        {id: "MEN",data: addProps(MEN)},
        {id: "MIN",data: addProps(MIN)},
        {id: "MON",data: addProps(MON)},
        {id: "PPN",data: addProps(PPN)},
        {id: "PPON",data: addProps(PPON)}]
};

const getSearchData = (chartData: ChartData, architectureId: number) => {
    const architecture = chartData.architecture.find((f) => f.arch_id === architectureId);
    if(architecture){
        return architecture.layers.reduce((acc, entry,index) => {
            if(index === 0) {
                acc = {inputs: [], outputs: []};
            }
            const networkData = chartData.networks.find((f) => f.id === entry.network);
            if(networkData){
                const inputs = networkData.data.nodes
                    .filter((f) => f.class === "input")
                const outputs = networkData.data.nodes.filter((f) => f.class === "output");
                acc["inputs"] = acc["inputs"].concat(inputs.map((m) => m.id));
                acc["outputs"] = acc["outputs"].concat(outputs.map((m) => m.id));
            }
            return acc;
        },{} as { [key in "inputs" | "outputs"]:string[] })
    }
    return {inputs: [],outputs:[]};
}

const startArchitecture = chartData.architecture.length > 0 ? chartData.architecture[0].arch_id : 0;
const startSearchData = getSearchData(chartData,startArchitecture);

export default  function Home() {

    const mainDivClass = "mainForceChart";
    const chainDivClass = "searchResultsChain";
    const [panelOpen, setPanelOpen] = useState(false);
    const [direction, setDirection] = useState<"vertical" | "horizontal">('vertical');
    const [architectureId, setArchitectureId] = useState<number>(startArchitecture);
    const [searchNodes, setSearchNodes] = useState<string[]>([]);
    const [searchDirection, setSearchDirection] = useState<string>("input");
    const [searchData, setSearchData] = useState(startSearchData);


    const architectures = chartData.architecture.reduce((acc,entry) => {
        acc.push({
            label: entry.arch_name,
            id: entry.arch_id
        })
        return acc;
    }, [] as {label: string, id: number}[])

    const updateArchitectureId = (architectureId: number) => {
        setArchitectureId(architectureId);
        const newSearchData = getSearchData(chartData,architectureId);
        setSearchData(newSearchData);
    }

    const handleSearchResult = (searchNodes:string[], searchDirection: string) => {
       setSearchNodes(searchNodes);
       setSearchDirection(searchDirection);
    }

  return (
      <>
          {/* Central Chart Area */}
          <div className={` ${mainDivClass}Container ml-0 ${searchNodes.length === 0 ? "w-full md:ml-[50px] md:w-[calc(100%-50px)]" : "w-[calc(100%-360px)] md:ml-[330px] md:w-[calc(100%-330px)]"}   h-full bg-blue-100`}>
              <MainForceChart searchNodes={searchNodes} chartData={chartData} architectureId={architectureId} containerClass={mainDivClass} chainContainerClass={chainDivClass} direction={direction}/>
          </div>

          {/* Side Panel toggle icon (desktop) */}
          <div className="hidden sm:block absolute top-0 left-0 h-full w-[50px] bg-gray-800 z-10">
              <MenuToggleGroup direction={direction} setPanelOpen={setPanelOpen} setDirection={setDirection} containerClass="mt-[10px] ml-[10px]"/>
          </div>

          {/* Search Panel - with  mobile toggle group if needed */}
          <div className="absolute top-[10px] left-0 z-20 ml-[10px] sm:ml-[60px] flex items-center gap-2">
              <MenuToggleGroup direction={direction}  setPanelOpen={setPanelOpen} setDirection={setDirection} containerClass="block sm:hidden"/>
              {/* Search Panel */}
              <SearchPanel
                  searchOptions={searchData}
                  updateSearchResult={handleSearchResult}
                  className="w-[260px]" // optional overrides
              />
          </div>
          {/* SidePanel - only visible on menu click */}
          <SidePanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} architectures={architectures} updateArchitectureId={updateArchitectureId}/>
          {/* SearchResultsPanel - only visible on selecting valid search result */}
          <SearchResultsPanel chainContainerClass={chainDivClass} mainContainerClass = {mainDivClass} chartData={chartData} searchNodes={searchNodes} searchDirection={searchDirection} architectureId={architectureId}></SearchResultsPanel>
      </>

  );
}
