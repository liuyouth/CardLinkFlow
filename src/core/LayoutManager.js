import { CONFIG } from '../config/constants.js';

/**
 * 布局管理器类
 * 负责节点的自动布局
 * @class LayoutManager
 */
export class LayoutManager {
    /**
     * 创建布局管理器实例
     * @param {FlowChart} flowChart - 流程图实例的引用
     */
    constructor(flowChart) {
        /** @type {FlowChart} 流程图实例 */
        this.flowChart = flowChart;
    }

    /**
     * 计算最佳布局位置
     * 根据节点类型和关系自动调整位置
     */
    calculateOptimalLayout() {
        const nodes = Array.from(this.flowChart.container.querySelectorAll('.flow-node'));
        
        // 简单的网格布局
        const spacing = 200;
        const startX = window.innerWidth / 2 - spacing;
        const startY = window.innerHeight / 2 - spacing;

        nodes.forEach((node, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            
            const x = startX + (col * spacing);
            const y = startY + (row * spacing);

            node.style.left = `${x}px`;
            node.style.top = `${y}px`;

            // 更新连接线
            const nodeId = node.dataset.id;
            if (nodeId) {
                this.flowChart.edgeManager.updateEdgesForNode(nodeId);
            }
        });
    }

    // ... 其他布局相关方法
} 