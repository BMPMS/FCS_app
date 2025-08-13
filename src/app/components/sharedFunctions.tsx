import {ChainLink, ChartLink} from "@/types/data";

export const getLinkId = (link: ChartLink | ChainLink , direction: "source" | "target") => {
    const node = link[direction];
    if(typeof node === "string") return node;
    if (node.id) return  node.id;
    return "" // shouldn't happen
}
