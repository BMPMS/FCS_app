"use client"; // This marks the component to run on the client

import * as d3 from 'd3';
import {FC, useRef, useEffect} from "react";
import {ChainLink, ChainNode, ChartData, ChartLink} from "@/types/data";
import {
    buildDataGraph,
    drawChainForce,
    getDescriptionLines,
    getNodeChain, handleAnimationFlow
} from "@/app/components/ChainForceChart_functions";
import {drawArrowDefs} from "@/app/components/MainForceChart_functions";
import {COLORS, NODETYPE_ICONS} from "@/app/components/MainForceChart";
import Graph from "graphology";
import {Attributes} from "graphology-types";

type ChainForceChartProps = {
    containerClass: string;
    mainContainerClass: string;
    chartData: ChartData;
    searchNodes: string[];
    searchDirection:string;
    architectureId: number;
}

const ChainForceChart: FC<ChainForceChartProps> = ({
                                                                 containerClass,
    mainContainerClass,
                                                                 chartData,
                                                                 searchNodes,
                                                          searchDirection,
                                                                 architectureId
                                                     }) => {
    const currentDirection: React.RefObject<string> = useRef("input");
    const currentArchitectureId: React.RefObject<number> = useRef(-1);
    const currentGraph: React.RefObject< Graph<Attributes, Attributes, Attributes> | undefined> = useRef(undefined);
    const ref = useRef(null);

    useEffect(() => {

        // svgs and sizing
        if (!ref.current) return;
        const svg = d3.select<SVGSVGElement,unknown>(ref.current);

        const svgNode = svg.node();
        if (!svgNode) return;

        const containerNode = d3.select<Element, unknown>(`.${containerClass}Container`).node();
        if (!containerNode) return;


        let {  clientHeight: svgHeight  } = containerNode;
        const {clientWidth: svgWidth} = containerNode;
        const margin = {left: 10, right: 10, top: 50, bottom: 40};

        svg.attr('width', svgWidth)
            .attr('height', svgHeight);


        drawArrowDefs(svg,containerClass);

       // keeping filter in the chart for now in case multiple architecture view is needed later
        const currentArchitecture =  chartData.architecture
                .find((f) => f.arch_id === architectureId);

        if(!currentArchitecture)return;
       const currentNetworks = chartData.networks
           .filter((f) => currentArchitecture.layers.some((s) => s.network === f.id))
               .map(f => ({ ...f.data }));


        if(currentArchitectureId.current !== architectureId || currentDirection.current !== searchDirection){
            currentArchitectureId.current = architectureId;
            currentDirection.current = searchDirection;
            currentGraph.current = buildDataGraph(currentNetworks,currentArchitecture.routes);
        }
        if(currentGraph.current){
            const {allNodes:nodes, allLinks:links} = getNodeChain(currentGraph.current, searchNodes,searchDirection);
            const depthMax = d3.max(nodes, (d) => d.depth) || 0;

            const selectedNetworks = [...new Set(nodes.map((m) => m.network))];

            const mainGraphSvg = d3.select(`.svg_${mainContainerClass}`);
            if(mainGraphSvg.node()){
                mainGraphSvg.selectAll<SVGGElement,ChainNode>(".networkGroup")
                    .attr("opacity", (d) => searchNodes.length === 0 ? 1 : selectedNetworks.includes(d.network) ? 1  : 0.2);

                const networkLinkGroups = mainGraphSvg.selectAll<SVGGElement,ChartLink>(".networkLinkGroup");

                networkLinkGroups.attr("opacity", (d) => searchNodes.length === 0 ? 1 : selectedNetworks.includes(d.source) &&  selectedNetworks.includes(d.target)? 1  : 0.2);

                networkLinkGroups
                    .selectAll(".linkLine")
                    .attr("stroke-opacity",1)
            }
            svg.select(".nodeCountLabel")
                .attr("x",5)
                .attr("y",12)
                .attr("font-size",14)
                .attr("text-anchor", "start")
                .attr("font-weight",500)
                .text(`${nodes.length} nodes`)

            svg.select(".depthCountLabel")
                .attr("x",svgWidth - 5)
                .attr("y",12)
                .attr("font-size",14)
                .attr("text-anchor", "end")
                .attr("font-weight",500)
                .text(`${depthMax} levels`)


            const minNodeRadius = 12;

            const minHeightNeeded = (depthMax * (minNodeRadius * 4)) + margin.top - margin.bottom;

            if(svgHeight < minHeightNeeded){
                svgHeight = minHeightNeeded;
                svg.attr("height",svgHeight);
            };

            const depthHeight = (svgHeight - margin.top - margin.bottom)/(depthMax + 2);

            svg.select(".chartGroup")
                .attr("transform",`translate(0,${margin.top})`)

            const maxDepth = d3.max(nodes, (d) => d.depth) || 0;
            const maxPerDepth = d3.max(
                Array.from(d3.group(nodes, (g) => g.depth)),
                (m) => m[1].length) || 0;

            const collideRadius = (svgWidth/(maxPerDepth + 1))/2;

            const simulation = d3
                .forceSimulation()
                .force("x", d3.forceX<ChainNode>(svgWidth/2).strength(0.05))
                .force("y", d3.forceY<ChainNode>((d) => ((searchDirection === "input" ? d.depth : maxDepth - d.depth) + 1) * depthHeight).strength(1))
                .force("link", d3.forceLink<ChainNode,ChainLink>().id((d) => d.id).strength(0))
                .force("collide", d3.forceCollide<ChainNode>().radius(Math.max(collideRadius,minNodeRadius * 1.4)).strength(1).iterations(2))

            simulation.stop();

            drawChainForce(svg,nodes,links,simulation,minNodeRadius,searchNodes,containerClass);


                // need to decide how to handle this..
                const firstId = searchNodes.length === 0 ? "" : searchNodes[0];
                const matchingSearchNode = nodes.find((f) => f.id === firstId);
                const descriptionLines = searchNodes.length === 1 ?
                    getDescriptionLines(matchingSearchNode ? matchingSearchNode.desc : "", svgWidth - 20, 12)
                    : [];

                 svg.select(".description")
                      .attr("font-size",12)
                     .attr("fill",COLORS.darkgrey)
                      .attr("transform",`translate(${svgWidth/2},30)`)

                  const tSpanGroup = svg.select(".description")
                      .selectAll("tspan")
                     .data(descriptionLines)
                     .join("tspan");

                  tSpanGroup
                    .attr("x",0)
                   .attr("y", (d,i) => i * 11)
                  .html((d) => d)



            svg.select(".playButton")
                .attr("fill","white")
                .attr("stroke",COLORS.midgrey)
                .attr("r", searchDirection === "input" ?10 : 0)
                .attr("cx",20)
                .attr("cy", 30)
                .attr("cursor","pointer")
                .on("mouseover", (event) => {
                    d3.select(event.currentTarget).attr("fill",COLORS.lightgrey)
                })
                .on("mouseout", (event) => {
                    d3.select(event.currentTarget).attr("fill","white")
                })
                .on("click", () => {
                    if(currentGraph.current){
                        handleAnimationFlow(svg,300,containerClass,mainContainerClass, nodes,links,searchNodes,currentGraph.current);
                    }
                 })

            svg
                .select(".playButtonIcon")
                .attr("pointer-events","none")
                .attr("x",21)
                .attr("y", 30)
                .attr("font-size", 10)
                .attr("fill", COLORS.midgrey)
                .attr("text-anchor","middle")
                .style("dominant-baseline","middle")
                 .text( searchDirection === "input" ? NODETYPE_ICONS["play"] : "");

        }






    }, [containerClass, chartData, architectureId,searchNodes,searchDirection, mainContainerClass]);


    return (
        <>
            <svg className={"noselect"} ref={ref}>
                <circle className={"playButton"}/>
                <text className={"fa playButtonIcon"}/>
                <text className={"description"}/>
                <defs className={"arrowDefs"}>
                </defs>
                <text className={"nodeCountLabel"}></text>
                <text className={"depthCountLabel"}></text>
                <g className={"chartGroup"}>
                    <g className={"linkGroup"}/>
                    <g className={"nodeGroup"}/>
                </g>

            </svg></>
    );
};

export default ChainForceChart;
