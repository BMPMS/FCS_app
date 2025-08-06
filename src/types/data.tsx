import {ScaleLinear} from "d3";
import * as d3 from "d3";

export interface DataNode {
    node:string;
    type: string;
    class: string;
    desc: string;
    id?: string;
    nodeDepth?: number;
    extraX?: number;
    extraY?:number;
}

export interface DataLink {
    source: string ;
    target: string ;
    type: string;
}

export interface HierarchyNode extends d3.SimulationNodeDatum  {
    name: string;
    type: string;
    label: string;
    value: number;
    fail?: boolean;
    depth?: number;
    data?: ChartNode;
    children?:HierarchyNode[];
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
}

export interface ChartNode extends d3.SimulationNodeDatum {
    id: string;
    node:string;
    type: string;
    class: string;
    desc: string;
    nodeDepth: number;
    extraX: number;
    extraY: number;
    fail?: boolean;
    network?: string;
    oppositePos?:number;
    bounds?: {x: number, widthOrHeight: number, opposite: number, top: number};
    treePositionScale?:  ScaleLinear<number, number, never>;
}

export interface HierarchyLink extends d3.SimulationLinkDatum<d3.HierarchyNode<HierarchyNode>>{
    source: string | d3.HierarchyNode<HierarchyNode>;
    target: string | d3.HierarchyNode<HierarchyNode>;
    type: string;
}


export interface ChartLink extends d3.SimulationLinkDatum<ChartNode>{
    source: string | ChartNode;
    target: string | ChartNode;
    type: string;
    id: string;
}

type ArcRoute = {
    source_net: string;
    source_node: string;
    dest_net: string;
    dest_node: string;
}

export type Network = {
    network: string;
    network_desc: string;
    nodes: ChartNode[];
    links: ChartLink[];
}


type Layer = {
    layer: number;
    network: string;
}
export type Architecture = {
    arch_id: number;
    arch_name: string;
    arch_num_layers: number;
    layers:Layer[];
    routes: ArcRoute[];
}

export type ArchFile = {
    num_arch: number;
    architectures: Architecture[];
}

export type ChartData = {
    architecture: Architecture[],
    networks: { id: string, data: Network}[];
}
export interface ForceExperimentChartProps {
    chartData: ChartData;
    containerClass: string;
    direction: string;
    flowMode: boolean;
}

export  type NodeChain = {
    type: string;
    id: string;
    index: number;
    source: string;
    originNode: string;
    linkOrNodeType: string;
    target: string;
}
