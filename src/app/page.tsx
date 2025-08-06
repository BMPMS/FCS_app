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
import {useState} from "react";
import {getLinkId} from "@/app/components/sharedFunctions";
import SidePanel from "@/app/components/sidePanel";
import SearchPanel from "@/app/components/searchPanel";
export default  function Home() {
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
        m.extraX = 0;
        m.extraY = 0;
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
    const [panelOpen, setPanelOpen] = useState(false);


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

    console.log(chartData);
  return (
      <>
          {/* Central Map Area */}
          <div className="w-full h-full bg-blue-100" />

          {/* Side Panel toggle icon (desktop) */}
          <div className="hidden sm:block absolute top-0 left-0 h-full w-[50px] bg-gray-800 z-10">
              <div
                  className="mt-[10px] ml-[10px] w-[30px] h-[30px] flex items-center justify-center bg-gray-800 rounded shadow cursor-pointer"
                  onClick={() => setPanelOpen(true)}
                  aria-label="Open menu"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setPanelOpen(true)}
              >
                  <i className="fa-solid fa-bars text-white text-xl"></i>
              </div>
          </div>

          {/* Mobile top-left UI group */}
          <div className="absolute top-[10px] left-0 z-20 ml-[10px] sm:ml-[60px] flex items-center gap-2">
              <div
                  className="block sm:hidden w-[30px] h-[30px] flex items-center justify-center bg-gray-800 rounded shadow cursor-pointer"
                  onClick={() => setPanelOpen(true)}
                  aria-label="Open menu"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setPanelOpen(true)}
              >
                  <i className="fa-solid fa-bars text-white text-xl"></i>
              </div>
              {/* Search Panel */}
              <SearchPanel
                  onSearch={(q) => console.log("Search query:", q)}
                  className="w-[260px]" // optional overrides
              />
          </div>

          {/* SidePanel component */}
          <SidePanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} />
      </>

  );
}
