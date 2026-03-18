import ThreadNode from "./ThreadNode";
import { canRenderChildren } from "../../utils/threadHelpers";

export default function ThreadTree({
    nodes,
    depth = 0,
    selectedNodeId = null,
    onSelectNode,
    compact = false,
}) {
    if (!nodes || nodes.length === 0) return null;

    return (
        <div className={depth > 0 ? `${compact ? "ml-3 pl-3" : "ml-5 pl-4"} border-l border-white/10` : "space-y-3"}>
            {nodes.map((node) => (
                <ThreadNode
                    key={node.id}
                    node={node}
                    depth={depth}
                    isSelected={selectedNodeId === node.id}
                    onSelect={onSelectNode}
                    compact={compact}
                >
                    {node.replies?.length > 0 && canRenderChildren(depth) ? (
                        <ThreadTree
                            nodes={node.replies}
                            depth={depth + 1}
                            selectedNodeId={selectedNodeId}
                            onSelectNode={onSelectNode}
                            compact={compact}
                        />
                    ) : null}
                </ThreadNode>
            ))}
        </div>
    );
}
