import * as d3 from "d3";

export interface DataNode {
    node:string;
    type: string;
    class: string;
    desc: string;
    id?: string;
    nodeDepth?: number;
}

export interface DataLink {
    source: string ;
    target: string ;
    type: string;
}

export interface ChainNode extends d3.SimulationNodeDatum {
    id: string;
    type: string;
    class: string;
    desc: string;
    network: string;
    depth: number;
    fail?: boolean;

}
export interface ChainLink  extends d3.SimulationLinkDatum<ChainNode>{
    id: string;
    source: string | ChainNode;
    target: string | ChainNode;
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

export interface ChartNode extends d3.SimulationNodeDatum{
    id: string;
    node:string;
    type: string;
    class: string;
    desc: string;
    nodeDepth: number;
    xPos?: number;
    yPos?:number;
    finalDepth?: boolean
}



export type NetworkLink =
{id: string;
    source: string;
    target: string;
    links: ArcRoute[];
    sourceDimensions: {[key: string] :{[key: string] : {[key: string] : number}}};
    targetDimensions: {[key: string] :{[key: string] : {[key: string] : number}}};
    sourcePositions: {x: number, y: number};
    targetPositions: {x: number, y: number};
}

export interface ChartLink {
    source: string ;
    target: string ;
    type: string;
    id: string;
}

export type ArcRoute = {
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


export type Layer = {
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


