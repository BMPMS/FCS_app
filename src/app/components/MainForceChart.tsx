"use client"; // This marks the component to run on the client

import * as d3 from 'd3';
import {FC, useRef, useEffect, useState} from "react";
import {ChartData} from "@/types/data";
import {
    drawArrowDefs,
    drawGroupTree,
    drawZoomButtons,
    resetZoomLevels
} from "@/app/components/MainForceChart_functions";


export const MAX_CIRCLE_RADIUS = 75;
export const COLORS = {
    lightgreen: "#a1d99b",
    midgreen: "#41ab5d",
    darkgreen: "#006d2c",
    lightblue: "#6baed6",
    orange: "#fd8d3c",
    midblue: "#2171b5",
    darkblue: "#08306b",
    red: "#cb181d",
    grey: "#A0A0A0",
    lightgrey: "#E0E0E0",
    midgrey: "#C0C0C0",
    darkgrey: "#808080",
    black: "#484848"
};

export const NODEFLOW_COLORS = {
    input: COLORS.midblue,
    intermediate: COLORS.midgrey,
    output: COLORS.orange,
    successfulOutput: COLORS.orange,
    failedOutput: COLORS.red,
    successfulLink: COLORS.midgreen,
    suppressedLink: COLORS.red,
    link: COLORS.midgrey
};
export const NODETYPE_ICONS = {
    comp: "\uf661",
    all: "\ue439",
    any: "\ue438",
    suppression: "\uf714",
    layer: "\uf5fd",
    network: "\uf126",
    depth: "\uf3c5",
    play:"\uf04b"
};

export const ARROW_START_PATH = "M9,-4L1,0L9,4";
export const ARROW_END_PATH = "M1, -4L9,0L1,4";
export const ARROW_VIEWBOX = "0 -5 10 10";

export const ICONS = {zoomFit:"\uf0b2",zoomOut:"\uf010",zoomIn:"\uf00e"};

interface MainForceChartProps {
    chartData: ChartData;
    architectureId: number;
    containerClass: string;
    direction: string;
    searchNodes: string[];
}

const MainForceChart: FC<MainForceChartProps> = ({
                                                                 containerClass,
                                                                 chartData,
                                                                 direction,
                                                     architectureId,
                                                 searchNodes}) => {


    const [tick, setTick] = useState(0);
    const zoomLevel: React.RefObject<string> = useRef("start");
    const ref = useRef(null);

    // Modified hook that returns the tick value
    useEffect(() => {
        const handleResize = () => setTick(t => t + 1);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    useEffect(() => {

        // svgs and sizing
        if (!ref.current) return;
        const baseSvg = d3.select<SVGSVGElement,unknown>(ref.current);

        const svgNode = baseSvg.node();
        if (!svgNode) return;

        const containerNode = d3.select<Element, unknown>(`.${containerClass}Container`).node();
        if (!containerNode) return;
        const {  clientHeight: svgHeight, clientWidth: svgWidth } = containerNode;

        // keeping filter in the chart for now in case multiple architecture view is needed later
        const filteredChartData =
            {
            architecture: chartData.architecture
                .filter((f) => f.arch_id === architectureId)
                .map(f => ({ ...f })),
            networks: chartData.networks
        }

        baseSvg.attr('width', svgWidth)
            .attr('height', svgHeight)
            .style("background-color","transparent");

        drawArrowDefs(baseSvg,containerClass);

        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([ 1,10])
            .translateExtent([[0,0],[svgWidth,svgHeight]])
            .on("zoom", (event) => {
                const { x, y, k } = event.transform;
                if(k < 2 && zoomLevel.current !== "top"){
                    zoomLevel.current = "top";
                    resetZoomLevels(baseSvg,zoomLevel.current);
                }
                if(k >= 2 && k < 4.5 &&  zoomLevel.current !== "middle"){
                    zoomLevel.current = "middle";
                    resetZoomLevels(baseSvg,zoomLevel.current)
                }
                if(k >= 4.5 &&  zoomLevel.current !== "bottom"){
                    zoomLevel.current ="bottom";
                    resetZoomLevels(baseSvg,zoomLevel.current)
                }
                svg.attr("transform", `translate(${x},${y}) scale(${k})`);

            });

        drawZoomButtons(baseSvg,svgWidth,svgHeight,[],zoom);

        baseSvg.call(zoom).on("dblclick.zoom", null);

        // svg = parts which are affected by zoom
        const svg = baseSvg.select(".chartSvg");

        drawGroupTree(baseSvg,filteredChartData,svgWidth,svgHeight,direction, containerClass)


    }, [containerClass, chartData, direction,zoomLevel,architectureId, searchNodes, tick]);


    return (
        <>
            <svg className={`noselect svg_${containerClass}`} ref={ref}>
                <defs className={"arrowDefs"}>
                </defs>
                <g className={"chartSvg"}>
                    <g className={"chartGroup"}/>
                </g>
                <g className={"buttonsGroup"}/>
            </svg></>
    );
};

export default MainForceChart;
