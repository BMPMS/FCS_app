import * as d3 from 'd3';
import {Architecture, ArcRoute, ChartData, ChartLink, ChartNode, Layer, Network, NetworkLink} from "@/types/data";
import {
    ARROW_END_PATH,
    ARROW_START_PATH,
    ARROW_VIEWBOX,
    COLORS,
    ICONS,
    MAX_CIRCLE_RADIUS,
    NODEFLOW_COLORS,
    NODETYPE_ICONS
} from "@/app/components/MainForceChart";

const networkMidData = [
    {position: "left", varName: "input", positionIndex: 0},
    {position: "left", varName: "intermediate", positionIndex: 1},
    {position: "left", varName: "output", positionIndex: 2},
    {position: "right", varName: "all", positionIndex: 0},
    {position: "right", varName: "any", positionIndex: 1},
    {position: "right", varName: "suppression", positionIndex: 2},
    {position: "right", varName: "comp", positionIndex: 3},
]
type GetZoomCalculations = {
    nodes: ChartNode[];
    height: number;
    width: number;
};

const markerIds = [
    "arrowEndGrey",
    "arrowStartGreen",
    "arrowEndGreen",
    "arrowStartRed",
    "arrowEndRed",
]
export const drawArrowDefs = (baseSvg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>, containerClass: string) => {

    const markerWidthHeight = 12;

    // final group - lineDotsMetricGroup - with the dots
    const markerGroups =  baseSvg.select(".arrowDefs")
        .selectAll(".arrowDefMarker")
        .data(markerIds)
        .join((group) => {
            const enter = group.append("marker").attr("class", "arrowDefMarker");
            enter.append("path").attr("class", "arrowDefPath");
            return enter;
        });

    markerGroups.attr("id", (d) => `${d}${containerClass}`)
        .attr("viewBox", ARROW_VIEWBOX)
        .attr("orient", "auto")
        .attr("markerWidth", markerWidthHeight)
        .attr("markerHeight", markerWidthHeight)
        .attr("refX",(d) => d.includes("Start") ? -2 : 8 );

    markerGroups.select(".arrowDefPath")
        .attr("id", (d) => `${d}Path${containerClass}`)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("fill", (d) => {
            if(d.includes("Green")) return COLORS.midgreen;
            if(d.includes("Red")) return COLORS.red;
            return COLORS.midgrey
        })
        .attr("d",(d) => d.includes("Start") ? ARROW_START_PATH : ARROW_END_PATH)
}

const getZoomCalculations = ({
                                 nodes,
                                 height,
                                 width,
                             }: GetZoomCalculations) => {
    // might have to have a maxRadius here
    const [xExtent0, xExtent1] = d3.extent(nodes, (d) => d.fx || d.x);
    const [yExtent0, yExtent1] = d3.extent(nodes, (d) => d.fy || d.y);

    if (xExtent0 !== undefined && xExtent1 !== undefined && yExtent0 !== undefined && yExtent1 !== undefined) {
        // minWidthHeight is a check to make sure it doesn't zoom to close with 1 or 2 nodes
        const minWidthHeight = MAX_CIRCLE_RADIUS * 5;
        let xWidth = xExtent1 - xExtent0 + MAX_CIRCLE_RADIUS * 2;
        let yWidth = yExtent1 - yExtent0 + MAX_CIRCLE_RADIUS * 2;

        xWidth = Math.max(xWidth, minWidthHeight);
        yWidth = Math.max(yWidth, minWidthHeight);

        const translateX = -(xExtent0 + xExtent1) / 2;
        const translateY = -(yExtent0 + yExtent1) / 2;
        const fitToScale = 0.9 / Math.max(xWidth / width, yWidth / height);
        return {translateX, translateY, fitToScale};
    }
    return {translateX: 0, translateY: 0, fitToScale: 1};
};

type PerformZoomAction = {
    baseSvg: d3.Selection<SVGSVGElement, unknown, HTMLElement, undefined>;
    nodes: ChartNode[];
    height: number;
    transitionTime: number;
    width: number;
    zoomAction: string;
    zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
};

const performZoomAction =  ({
                                baseSvg,
                                nodes,
                                height,
                                transitionTime,
                                width,
                                zoomAction,
                                zoom,
                            }: PerformZoomAction) =>  {
    baseSvg.selectAll(".buttonItems").attr("opacity",0);
    if (zoomAction === 'zoomIn') {
        baseSvg.interrupt().transition().duration(transitionTime).call(zoom.scaleBy, 2);
    }
    if (zoomAction === 'zoomOut') {
        baseSvg.interrupt().transition().duration(transitionTime).call(zoom.scaleBy, 0.5);
    }
    if (zoomAction === 'zoomFit') {
        const {translateX, translateY, fitToScale} = getZoomCalculations({
            nodes: nodes,
            height,
            width,
        });
        baseSvg
            .interrupt()
            .transition()
            .duration(transitionTime)
            .call(
                zoom.transform,
                d3.zoomIdentity
                  //  .translate(width / 2, height / 2)
                    .scale(fitToScale)
                    .translate(translateX, translateY),
            );
    }
};

export const drawZoomButtons = (
    baseSvg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
    width: number,
    height: number,
    nodes: ChartNode[],
    zoom:  d3.ZoomBehavior<SVGSVGElement , unknown>
) => {
    const buttonTypes = ["zoomFit","zoomOut","zoomIn"];
    const buttonMargin = 5;
    const buttonWidthHeight = 30;


    const buttonsGroup = baseSvg.select(".buttonsGroup")
        .selectAll(".buttonGroup")
        .data(buttonTypes)
        .join((group) => {
            const enter = group.append("g").attr("class", "buttonGroup");
            enter.append("rect").attr("class", "buttonRect");
            enter.append("text").attr("class", "fa fa-strong buttonIcon");
            return enter;
        });

    buttonsGroup.attr("transform",(d,i) => `translate(${width - buttonWidthHeight - buttonMargin},${height - buttonMargin - buttonWidthHeight - (i * (buttonWidthHeight + buttonMargin))})`)

    buttonsGroup.select(".buttonRect")
        .attr("cursor","pointer")
        .attr("width", buttonWidthHeight)
        .attr("height", buttonWidthHeight)
        .attr("fill", "white")
        .attr("stroke", COLORS.grey)
        .attr("stroke-width", 0.5)
        .attr("rx", 3)

        .attr("ry",3)
        .on("click", (event, d) => {
            performZoomAction({
                baseSvg,
                nodes,
                height,
                width,
                transitionTime: 500,
                zoomAction: d,
                zoom
            })
        })

    buttonsGroup.select(".buttonIcon")
        .attr("pointer-events", "none")
        .attr("fill", "#A0A0A0")
        .attr("text-anchor", "middle")
        .style("font-size", `${buttonWidthHeight * 0.6}px`)
        .attr("x", buttonWidthHeight/2)
        .attr("y", buttonWidthHeight * 0.7)
        .text((d) =>  ICONS[d as keyof typeof ICONS] ||"");
}


type NetworkData = {
    layer: number;
    layerIndex: number;
    network: string;
    description: string;
    nodes: ChartNode[];
    links: ChartLink[];
    posShift?: number;
}

type TreeData = {
    name: string;
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    layerData:  d3.HierarchyRectangularNode<LayerHierarchy>[];
    networkLinks: NetworkLink[];
    networkNodeLinks: NetworkLink[];
}

type LayerHierarchy = {
    name: string;
    value: number;
    networkData: NetworkData[];
    children?: LayerHierarchy[];
    architectureWidthHeight?: number;
    xPos?: number;
    yPos?: number;
}

type ArchitectureHierarchy = {
    name: string,
    value: number,
    data?: Architecture;
    children?: ArchitectureHierarchy[];
}


const getLayerData = (layers: Layer[],networks: { id: string, data: Network}[]) => {
    const allLayers = layers.reduce((acc, entry) => {
        const networkData = networks.find((f) => f.id === entry.network);
        const nodes = networkData? networkData.data.nodes : [];
        const links = networkData? networkData.data.links : [];

        const maxDepth = d3.max(nodes, (m) => m.nodeDepth)
        if(maxDepth){
            const matchingLayer = acc.filter((f) => f.layer === entry.layer + 1);
            acc.push({
                layerIndex: matchingLayer.length,
                layer: entry.layer + 1,
                network: entry.network,
                description: networkData?.data.network_desc || "",
                nodes,
                links
            })
        }
        return acc;
    },[] as NetworkData[])

    return Array.from(d3.group(allLayers, (d) => d.layer)).reduce((acc, entry) => {
        acc.push({
            name: String(entry[0]),
            value: 1,
            networkData: entry[1]
        })
        return acc;
    },[] as LayerHierarchy[])
}


export const trimPathToRadius = (
    pathD: string,
    sourceRadius: number = 0,
    targetRadius: number = 0
): string => {
    const svgNS = "http://www.w3.org/2000/svg";

    // Create a temporary SVG path element
    const tempPath = document.createElementNS(svgNS, "path");
    tempPath.setAttribute("d", pathD);

    // Append to DOM temporarily to allow length measurement
    document.body.appendChild(tempPath);

    const totalLength = tempPath.getTotalLength();

    // Ensure radii are within bounds
    const trimStart = Math.min(sourceRadius, totalLength);
    const trimEnd = Math.max(totalLength - targetRadius, trimStart);
    const startPoint = tempPath.getPointAtLength(trimStart);
    const endPoint = tempPath.getPointAtLength(trimEnd);

    // Remove the temporary path from the DOM
    document.body.removeChild(tempPath);

    // Return a new line path
    return `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
}


const getNetworkLinks = (networkRoutes: ArcRoute[], type: string) =>
    Array.from(d3.group(networkRoutes, (d) => `${d[`source_${type}` as keyof typeof d]}|${d[`dest_${type}` as keyof typeof d]}`))
        .reduce((acc, entry) => {
            let source = "";
            let target = ""
            const groupSplit = entry[0].split("|");

            if(type === "net"){
                source = groupSplit[0];
                target = groupSplit[1];
            } else {
                source = `${groupSplit[0]}-${entry[1][0].source_net}`;
                target = `${groupSplit[1]}-${entry[1][0].dest_net}`;
            }

            acc.push({
                source,
                target,
                links: entry[1]
            })
            return acc;
        },[] as {source: string, target: string, links:ArcRoute[]}[])
        .reduce((acc, entry,index) => {
            acc.push({
                id: `${type}-${index}`,
                source: entry.source,
                target: entry.target,
                links: entry.links
            })
            return acc;
        },[] as NetworkLink[])
const getTreeData = (
    chartData: ChartData,
    svgWidth: number,
    svgHeight: number,
    marginTop: number,
    direction: string
) => {

    // build architecture list
    const allArchitectures = chartData.architecture.reduce((acc, entry) => {
        acc.push({
            name: entry.arch_name,
            value: 1,
            data: entry
        })
        return acc;
    },[] as ArchitectureHierarchy[])

    // build hierarchy and tree for architectures only
    const architectureHierarchy = d3.hierarchy<ArchitectureHierarchy>({
        name: "root",
        children: allArchitectures,
        value: 0});

    architectureHierarchy.sum((d) => d.value);

    // binary EXCEPT vertical 3 or less, then slice
    const architectureTile = direction === "vertical" || allArchitectures.length >= 3
        ? d3.treemapBinary : d3.treemapSlice;

    const newTree = d3.treemap<ArchitectureHierarchy>()
        .tile(architectureTile )
        .size([svgWidth, svgHeight - marginTop])
        .round(true)
        .padding(0);

    const treemapData = newTree(architectureHierarchy);

    // work with architectureTree children
    // (currently redundant as one architecture at a time)
    if(treemapData.children){
        // still need to add links (final step after framework in from experiment code)
        return treemapData.children.reduce((acc,entry) => {
            if(entry.data && entry.data.data){
                // get layer data (same as experiment)
                const layerData = getLayerData(entry.data.data.layers, chartData.networks);
                // now build slice or dice (depending on direction) hierarchy and treemap for layers within architectures
                // using architecture boundaries
                const currentHierarchy = d3.hierarchy<LayerHierarchy>({
                    name: "root",
                    children: layerData,
                    networkData: [],
                    value: 0});
                 currentHierarchy.sum((d) => d.value);
                // generate the tree
                const currentTree = d3.treemap<LayerHierarchy>()
                    .tile(direction === "horizontal" ? d3.treemapDice : d3.treemapSlice)
                    .size([entry.x1 + entry.x0, entry.y1 - entry.y0])
                    .round(true)
                    .padding(0);
                const currentTreeData = currentTree(currentHierarchy);
                if(currentTreeData.children){
                    // for each child, create a network entry
                    acc.push({
                        name: entry.data.name,
                        x0: entry.x0,
                        x1: entry.x1,
                        y0: entry.y0,
                        y1: entry.y1,
                        networkLinks: getNetworkLinks(entry.data.data.routes, "net"),
                        networkNodeLinks: getNetworkLinks(entry.data.data.routes, "node"),
                        layerData: currentTreeData.children
                    })
                }
            }
            return acc;
        },[] as TreeData[])
    }
    return [];
}


export const drawGroupTree = (
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
    chartData: ChartData,
    svgWidth: number,
    svgHeight: number,
    direction: string,
    containerClass: string

) => {

    const marginTop = 30;
    // currently array of networks with positioning and data (can also have multiple architectures if needed)
    const treeData =  getTreeData(chartData,svgWidth,svgHeight, marginTop,direction);
    let nodeHeight = 0;
    let nodeWidth = 0;

    // set nodeHeight + width depending on direction
    if(direction === "vertical"){
        const minHeight = d3.min(treeData, (d) => d3.min(d.layerData, (m) => m.y1 - m.y0)) || 0;
        const maxNetworksInALayer = d3.max(treeData, (d) => d3.max(d.layerData, (m) => m.data.networkData.length)) || 0;
        const minArchitectureWidth = d3.min(treeData, (d) => d.x1 - d.x0) || 0;

        nodeWidth = (minArchitectureWidth/maxNetworksInALayer)/2;
        nodeHeight = minHeight/2;
    } else {
        const minWidth = d3.min(treeData, (d) => d3.min(d.layerData, (m) => m.x1 - m.x0)) || 0;
        const maxNetworksInALayer = d3.max(treeData, (d) => d3.max(d.layerData, (m) => m.data.networkData.length)) || 0;
        const minArchitectureHeight = d3.min(treeData, (d) => d.y1 - d.y0) || 0;

        nodeWidth = minWidth/2;
        nodeHeight =  (minArchitectureHeight/maxNetworksInALayer)/2;

    }

    svg.select(".chartGroup").attr("transform",`translate(0,${marginTop})`)

    // outside rect for each architecture (currently only one)
    const architectureGroup = svg.select(".chartGroup")
        .selectAll(".architectureGroup")
        .data(treeData)
        .join((group) => {
            const enter = group.append("g").attr("class", "architectureGroup");
            enter.append("rect").attr("class", "backgroundArchitectureRect");
            enter.append("g").attr("class", "layersGroup");
            return enter;
        });

    architectureGroup.select(".backgroundArchitectureRect")
        .attr("width",(d) => d.x1-d.x0)
        .attr("height", (d) => d.y1 - d.y0 )
        .attr("fill","white")
        .attr("fill-opacity", (d,i) =>  0.3 + (i * treeData.length/6))
        .attr("transform",  (d) => `translate(${d.x0},${d.y0 })`);

    // for each layer within architecture
    const layersGroup = architectureGroup.select(".layersGroup")
        .selectAll(".layerGroup")
        .data((d) => {
            d.layerData.map((m) => {
                // pre-calculate position for use later down the hierarchy
                m.data.architectureWidthHeight = direction === "vertical" ? d.x1 - d.x0 : d.y1 - d.y0;
                m.data.xPos = d.x0 + m.x0 + (direction === "horizontal" ? (m.x1 - m.x0)/2: 0);
                m.data.yPos = d.y0 + m.y0 + (direction === "vertical" ? (m.y1 - m.y0)/2 : 0);
            })
            return d.layerData;
        })
        .join((group) => {
            const enter = group.append("g").attr("class", "layerGroup");
            enter.append("line").attr("class", "layerLine");
            enter.append("text").attr("class", "layerLabel");
            enter.append("g").attr("class", "networksGroup");
            return enter;
        });

    // position layer groups + draw line + label
    layersGroup.attr("transform", (d) => `translate(${d.data.xPos},${d.data.yPos})`)

    layersGroup.select(".layerLine")
        .attr("x1",(d) => direction === "vertical" ? d.x0 : -(d.x1 - d.x0)/2)
        .attr("x2",(d) => direction === "vertical" ? d.x1 : -(d.x1 - d.x0)/2)
        .attr("y1", (d) => direction === "vertical" ? - (d.y1 - d.y0)/2 : d.y0)
        .attr("y2", (d) => direction === "vertical" ? - (d.y1 - d.y0)/2 : d.y1)
        .attr("stroke",COLORS.lightgrey)
        .attr("stroke-width",0.5);

    layersGroup.select(".layerLabel")
        .attr("x",(d) =>  direction === "vertical" ? d.x0 : -(d.x1 - d.x0)/2)
        .attr("y", (d) =>  direction === "vertical" ? - (d.y1 - d.y0)/2 : d.y0)
        .attr("dx",5)
        .attr("dy",14)
        .attr("font-size",14)
        .attr("fill",COLORS.midgrey)
        .text((d) => `Layer ${d.data.name}`)


    // networkPositions array - stores positions for use with links
    const networkPositions: {[key: string] : {x: number, y: number}} = {}

    const getMaxPerDepth = (nodes: ChartNode[]) => {
        const depthGroup = Array.from(d3.group(nodes, (g) => g.nodeDepth));
        return d3.max(depthGroup,(m) => m[1].length);
    }

    const maxPerDepth =
        d3.max(treeData, (architecture) =>
            d3.max(architecture.layerData, (layer) =>
                d3.max(layer.data.networkData, (network) => getMaxPerDepth(network.nodes))
            )) || 0;

    // responsive circle radius
    const networkCircleRadius = ((direction === "vertical"? nodeWidth : nodeHeight)/(maxPerDepth + 1))/2;


    const networkGroup = layersGroup.select(".networksGroup")
        .selectAll<SVGGElement,{layer: number, x:number, y: number}[]>(".networkGroup")
        .data((d) => {
            const xSlice = (d.data.architectureWidthHeight || 2)/d.data.networkData.length;
            // posShift depending on # of networks in a layer and network dimensions
            d.data.networkData.map((m,i) => {
                const posShift = (xSlice/2) + (i * xSlice);
                m.posShift = posShift;
                networkPositions[m.network] = {
                    x: (d.data.xPos || 0) + (direction === "vertical" ? posShift || 0 : 0),
                    y: (d.data.yPos || 0) + (direction === "vertical" ? 0 : posShift || 0 )}
            })
            return d.data.networkData;
        })
        .join((group) => {
            const enter = group.append("g").attr("class", "networkGroup");
            enter.append("rect").attr("class", "networkRect");
            enter.append("text").attr("class", "networkRectLabel");
            enter.append("g").attr("class","networkMidGroup");
            enter.append("g").attr("class","networkNodesGroup");
            enter.append("g").attr("class","networkNodeLinksGroup");
            return enter;
        });

    networkGroup
        .attr("id",(d) => d.network)
        .attr("transform",(d) => `translate(${(direction === "vertical" ? d.posShift || 0 : 0)},${(direction === "vertical" ? 0 : d.posShift || 0 )})`)

    networkGroup.select(".networkRect")
        .attr("stroke", COLORS.darkblue)
        .attr("stroke-width", 1)
        .attr("fill","white")
        .attr("rx", networkCircleRadius)
        .attr("ry",networkCircleRadius)
        .attr("width", nodeWidth)
        .attr("height",nodeHeight)
        .attr("x",   -nodeWidth/2  )
        .attr("y",  -nodeHeight/2 );

    networkGroup.select(".networkRectLabel")
        .attr("fill", COLORS.darkblue)
        .style("dominant-baseline","middle")
        .attr("y",  2 )
        .text((d) => d.network);


    // mid refers to zoom level - small menu which gives a summary but doesn't show individual nodes and links
    // see networkMidData above for definition of these groups (which will make data reduce clearer)
    const midSideMargin = 5;
    const networkIndexMax = d3.max(networkMidData, (d) => d.positionIndex) ||0;
    const midGroupRadius = (nodeHeight/(networkIndexMax + 2))/2;
    const midGroupLeftCount = networkMidData.filter((f) => f.position === "left").length;
    const midGroupRightCount = networkMidData.filter((f) => f.position === "right").length;
    const midGroupLeftYStep = (nodeHeight - midSideMargin)/midGroupLeftCount;
    const midGroupRightYStep = (nodeHeight - midSideMargin)/midGroupRightCount;

    const networkMidGroup = networkGroup.select(".networkMidGroup")
        .selectAll(".networkMidGroups")
        .data((d) => {
            return networkMidData.reduce((acc, entry) => {
                let matchingNodes = [];
                if(entry.position === "left"){
                    matchingNodes = d.nodes.filter((f) => f.class === entry.varName);
                } else {
                    matchingNodes = d.nodes.filter((f) => f.type === entry.varName);
                }
                acc.push({
                    position: entry.position,
                    positionIndex: entry.positionIndex,
                    varName: entry.varName,
                    dataCount: matchingNodes.length
                })
                return acc;
            },[] as { position: string, positionIndex: number, varName: string, dataCount: number }[])

        })
        .join((group) => {
            const enter = group.append("g").attr("class", "networkMidGroups");
            enter.append("circle").attr("class", "midGroupCircle");
            enter.append("text").attr("class", "fa midGroupCircleIcon");
            enter.append("text").attr("class", "midGroupLabel");
            return enter;
        });

    networkMidGroup
        .attr("opacity", (d) => d.dataCount === 0 ? 0.2 : 1)
        .attr("transform",`translate(${-nodeWidth/2},${-nodeHeight/2 + midSideMargin/2})`)

    networkMidGroup.select(".midGroupCircle")
        .attr("fill",(d) => d.position === "left"
            ? NODEFLOW_COLORS[d.varName as keyof typeof NODEFLOW_COLORS]
        : "white")
        .attr("stroke", (d) => d.position === "left" ? "transparent" : COLORS.grey)
        .attr("stroke-width",0.5)
        .attr("r",midGroupRadius)
        .attr("cx", (d) => d.position === "left"
            ? midSideMargin + midGroupRadius
            : nodeWidth - midSideMargin - midGroupRadius)
        .attr("cy",(d) => (d.positionIndex + 0.5)  * (d.position === "left" ? midGroupLeftYStep : midGroupRightYStep))


    networkMidGroup.select(".midGroupCircleIcon")
        .attr("fill",COLORS.grey)
        .attr("text-anchor","middle")
        .attr("font-size", midGroupRadius)
        .style("dominant-baseline","middle")
        .attr("dy",-midGroupRadius * 0.05)
        .attr("x",  nodeWidth - midSideMargin - midGroupRadius)
        .attr("y",(d) => (d.positionIndex + 0.5)  * (d.position === "left" ? midGroupLeftYStep : midGroupRightYStep))
        .text((d) => d.position === "right" ? NODETYPE_ICONS[d.varName as keyof typeof NODETYPE_ICONS] : "")

    networkMidGroup.select(".midGroupLabel")
        .attr("fill",COLORS.black)
        .attr("text-anchor",(d) => d.position === "left" ? "start" : "end")
        .attr("font-size", midGroupRadius)
        .style("dominant-baseline","middle")
        .attr("dy",midGroupRadius * 0.05)
        .attr("x", (d) => d.position === "left"
            ? midSideMargin + (midGroupRadius * 2) + 3
            : nodeWidth - midSideMargin - (midGroupRadius * 2) - 3)
        .attr("y",(d) => (d.positionIndex + 0.5)  * (d.position === "left" ? midGroupLeftYStep : midGroupRightYStep))
        .text((d) =>  `${d.dataCount} ${d.varName}`);

    // nodePositions array - stores positions for use with links
    const nodePositions: { [key: string]: {x: number,y:number} } = {};

    // network nodes
    const networkNodesGroup = networkGroup.select(".networkNodesGroup")
        .selectAll(".networkNodeGroup")
        .data((d) => {
            // group by depth and define point scale
            const depthGroup = Array.from(d3.group(d.nodes, (g) => g.nodeDepth));
            const depthScale = d3.scalePoint<number>()
                .domain(depthGroup.map((m) => m[0]))
                .range([0,(direction === "vertical" ? nodeHeight : nodeWidth) - 2 - networkCircleRadius * 3]);
            return depthGroup.reduce((acc, entry) => {
                // shiftIndex (node position within depth), shiftDepth (depth position within network)
                // can't say left or right as switches vertical/horizontal
                const shiftIndex = ((maxPerDepth - entry[1].length) * (networkCircleRadius * 2))/2;
                const shiftDepth =  (networkCircleRadius * 1.5 + 1)
                // calculate + save positions
                // flag if final depth for network
                entry[1].forEach((node, index) => {
                    const depthPos = depthScale(entry[0]) || 0;
                    const indexPos = (networkCircleRadius * 2) + (index * (networkCircleRadius * 2));
                    node.xPos =   (direction === "vertical" ? indexPos + shiftIndex : depthPos + shiftDepth) ;
                    node.yPos = (direction === "vertical" ? depthPos + shiftDepth: indexPos + shiftIndex);
                    node.finalDepth = entry[0] === depthGroup.length - 1;
                    nodePositions[node.id] = {x: node.xPos, y: node.yPos};
                    acc.push(node);
                })
                return acc;
            }, [] as ChartNode[])
        })
        .join((group) => {
            const enter = group.append("g").attr("class", "networkNodeGroup");
            enter.append("circle").attr("class", "nodeCircle");
            enter.append("text").attr("class", "fa nodeCircleIcon");
            enter.append("text").attr("class", "nodeCircleLabel");
            return enter;
        });

    networkNodesGroup.attr("transform",(d) => `translate(${(d.xPos || 0) - (nodeWidth/2)},${(d.yPos || 0) - (nodeHeight/2)})`)

    networkNodesGroup.select(".nodeCircle")
        .attr("fill", (d) => NODEFLOW_COLORS[d.class as keyof typeof NODEFLOW_COLORS])
        .attr("r",networkCircleRadius * 0.9);

    networkNodesGroup.select(".nodeCircleIcon")
        .attr("fill", "white")
        .attr("text-anchor","middle")
        .attr("font-size", networkCircleRadius)
        .style("dominant-baseline","middle")
        .attr("dy",-networkCircleRadius * 0.05)
        .text((d) => NODETYPE_ICONS[d.type as keyof typeof NODETYPE_ICONS]);

    networkNodesGroup.select(".nodeCircleLabel")
        .attr("visibility","hidden")
        .attr("fill", COLORS.black)
        .attr("text-anchor",(d) => d.finalDepth ? "start" : "end")
        .attr("font-size", networkCircleRadius * 0.8)
        .style("dominant-baseline","middle")
        .attr("dy",-networkCircleRadius * 0.05)
        .attr("transform",(d) => `translate(0,${(d.finalDepth ? -networkCircleRadius : networkCircleRadius) * 1.2}) rotate(-30)`)
        .text((d) => d.node);


    const networkNodeLinksGroup = networkGroup.select(".networkNodeLinksGroup")
        .selectAll(".networkNodeLinkGroup")
        .data((d) => d.links)
        .join((group) => {
            const enter = group.append("g").attr("class", "networkNodeLinkGroup");
            enter.append("path").attr("class", "linkLine");
            enter.append("path").attr("class", "linkAnimatePath");
            return enter;
        });

    networkNodeLinksGroup.attr("transform",`translate(${-(nodeWidth/2)},${-(nodeHeight/2)})`)

    networkNodeLinksGroup
        .select(".linkAnimatePath")
        .attr("id", (d) => `linkAnimatePath${d.id}`)
        .attr("stroke-width",  networkCircleRadius/3)
        .attr("stroke-opacity", 0)
        .attr("stroke", (d) =>
            d.type === "suppress"
                ? NODEFLOW_COLORS.suppressedLink
                : NODEFLOW_COLORS.successfulLink
        )

    networkNodeLinksGroup.select(".linkLine")
        .attr("id", (d) => `linkPath${d.id}`)
        .attr("marker-end",`url(#arrowEndGrey${containerClass})`)
        .attr("stroke",COLORS.midgrey)
        .attr("stroke-width",networkCircleRadius/8)
        .attr("d", (d) => {
            const sourcePosition = nodePositions[d.source as keyof typeof nodePositions];
            const targetPosition = nodePositions[d.target as keyof typeof nodePositions];
            const originalPath = `M${sourcePosition.x},${sourcePosition.y}L${targetPosition.x},${targetPosition.y}`;
            const path = trimPathToRadius(originalPath, networkCircleRadius, networkCircleRadius);
            svg.select(`#linkAnimatePath${d.id}`)
                .attr("d",path);
            return path
        })

    const networkLinksGroup = svg.select(".chartGroup")
        .selectAll(".networkLinkGroup")
        .data(treeData.map((m) => m.networkLinks).flat())
        .join((group) => {
            const enter = group.append("g").attr("class", "networkLinkGroup");
            enter.append("path").attr("class", "linkLine");
            enter.append("path").attr("class", "networkLinkAnimatePath");
            return enter;
        });

    networkLinksGroup
        .select(".networkLinkAnimatePath")
        .attr("id", (d) => `linkAnimatePath${d.id}`)
        .attr("stroke-width",  0.75)
        .attr("stroke-opacity", 0)
        .attr("marker-end",`url(#arrowEndGrey${containerClass})`)
        .attr("stroke", COLORS.midgrey) // link between networks so always successful if animated

    networkLinksGroup.select(".linkLine")
        .attr("id", (d) => `linkPath${d.id}`)
        .attr("stroke",COLORS.midgrey)
        .attr("stroke-opacity",1)
        .attr("marker-end",`url(#arrowEndGrey${containerClass})`)
        .attr("stroke-width",0.75)
        .attr("d", (d) => {
            let {x: sourceX, y: sourceY} = networkPositions[d.source as keyof typeof d];
            let {x: targetX, y: targetY} = networkPositions[d.target as keyof typeof d];
            const shiftBy = 0.5 +  (direction === "vertical" ? nodeHeight/2 : nodeWidth/2);
            if(direction === "vertical"){
                if(sourceY < targetY){
                    sourceY += shiftBy;
                    targetY -= shiftBy;
                } else {
                    sourceY -= shiftBy;
                    targetY += shiftBy;
                }
            } else {
                if(sourceX < targetX){
                    sourceX += shiftBy;
                    targetX -= shiftBy;
                } else {
                    sourceX -= shiftBy;
                    targetX += shiftBy;
                }
            }
            const path = `M${sourceX},${sourceY}L${targetX},${targetY}`;
                svg.select(`#linkAnimatePath${d.id}`)
                    .attr("d",path);
             return path;
        })

    const networkNodesLinksGroup = svg.select(".chartGroup")
        .selectAll(".nodesLinkGroup")
        .data(treeData.map((m) => m.networkNodeLinks).flat())
        .join((group) => {
            const enter = group.append("g").attr("class", "nodesLinkGroup");
            enter.append("path").attr("class", "linkLine");
            enter.append("path").attr("class", "linkAnimatePath");
            return enter;
        });

    networkNodesLinksGroup.attr("transform",`translate(${-nodeWidth/2},${-nodeHeight/2})`)

    networkNodesLinksGroup
        .select(".linkAnimatePath")
        .attr("id", (d) => `linkAnimatePath${d.id}`)
        .attr("stroke-width",  networkCircleRadius/3)
        .attr("stroke-opacity", 0)
        .attr("stroke",  NODEFLOW_COLORS.successfulLink) // always successful if animated - just network-network

    networkNodesLinksGroup.select(".linkLine")
        .attr("id", (d) => `linkPath${d.id}`)
        .attr("stroke",COLORS.midgrey)
        .attr("marker-end",`url(#arrowEndGrey${containerClass})`)
        .attr("stroke-width",networkCircleRadius/8)
        .attr("d", (d) => {
            const sourceNetwork = typeof d.source === "string" ? d.source.split("-")[1] : "";
            const sourceNetworkPosition = networkPositions[sourceNetwork];
            const sourceNodePosition = nodePositions[d.source as keyof typeof nodePositions];
            if(!sourceNodePosition || !sourceNetworkPosition) return "";
            const sourcePosition = {
                x: sourceNodePosition.x + sourceNetworkPosition.x,
                y: sourceNodePosition.y + sourceNetworkPosition.y};
            const targetNetwork = typeof d.target === "string" ? d.target.split("-")[1] : "";
            const targetNetworkPosition = networkPositions[targetNetwork];
            const targetNodePosition = nodePositions[d.target as keyof typeof nodePositions];
            if(!targetNodePosition || !targetNetworkPosition) return "";
            const targetPosition = {
                x: targetNodePosition.x + targetNetworkPosition.x,
                y: targetNodePosition.y + targetNetworkPosition.y};

            const originalPath = `M${sourcePosition.x},${sourcePosition.y}L${targetPosition.x},${targetPosition.y}`;
            const path =  trimPathToRadius(originalPath,networkCircleRadius,networkCircleRadius)
            svg.select(`#linkAnimatePath${d.id}`)
                .attr("d",path);
            return path;
          })

    resetZoomLevels(svg,"top");
}

const getLabelFontSize = (zoomLevel: string) => {
    if(zoomLevel === "top") return 16;
    return 12;
}
const getLabelDx = (zoomLevel: string, nodeWidth: number) => {
    if(zoomLevel === "top") return 0;
    return -nodeWidth/2;
}
const getLabelDy = (zoomLevel: string, nodeHeight: number) => {
    if(zoomLevel === "top") return 0;
    return -(nodeHeight + getLabelFontSize(zoomLevel) + 2)/2;
}

const getLabelTextAnchor = (zoomLevel: string) => {
    if(zoomLevel === "top") return "middle";
    return "start";
}
export const resetZoomLevels = (svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>, zoomLevel: string) => {

    const networkNode = d3.select(".networkRect");
    if(networkNode.node()){
        const nodeWidth = +networkNode.attr("width") || 0;
        const nodeHeight  = +networkNode.attr("height") || 0;

        svg.selectAll(".networkRectLabel")
            .attr("font-size",getLabelFontSize(zoomLevel))
            .attr("dx",getLabelDx(zoomLevel,nodeWidth))
            .attr("dy",getLabelDy(zoomLevel,nodeHeight))
            .attr("text-anchor",getLabelTextAnchor(zoomLevel));

        svg.selectAll(".networkMidGroup")
            .attr("display",zoomLevel === "middle" ? "block" : "none");

        svg.selectAll(".networkLinkGroup")
            .attr("display",zoomLevel === "bottom" ? "none" : "block");

        svg.selectAll(".nodesLinkGroup")
            .attr("display",zoomLevel === "bottom" ? "block" : "none");

        svg.selectAll(".networkNodeLinksGroup")
            .attr("display",zoomLevel === "bottom" ? "block" : "none");

        svg.selectAll(".networkNodesGroup")
            .attr("display",zoomLevel === "bottom" ? "block" : "none");
    }
}


