import {ChartLink, HierarchyLink} from "@/types/data";

export const getLinkId = (link: ChartLink | HierarchyLink , direction: "source" | "target") => {
    const node = link[direction];
    if(typeof node === "string") return node;
    if (node.id) return  node.id;
    if ('data' in node) {
        return node.data.name
    }
    return "" // shouldn't happen
}
