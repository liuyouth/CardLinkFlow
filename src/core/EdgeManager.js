import { CONFIG } from '../config/constants.js';

/**
 * 边缘管理器类
 * 负责连接线的创建和渲染
 * @class EdgeManager
 */
export class EdgeManager {
    /**
     * 创建边缘管理器实例
     * @param {FlowChart} flowChart - 流程图实例的引用
     */
    constructor(flowChart) {
        /** @type {FlowChart} 流程图实例 */
        this.flowChart = flowChart;
        
        /** @type {Map<string, Object>} 边缘存储映射 */
        this.edges = new Map();
        this.virtualEdges = new Map(); // 存储虚拟连接
        this.isCreatingEdge = false;
        this.tempEdge = null;
        this.sourceNode = null;
        this.selectedEdge = null;
        
        this.initEdgeEvents();
    }

    initEdgeEvents() {
        // 从连接点开始连线
        this.flowChart.container.addEventListener('mousedown', (e) => {
            const port = e.target.closest('.node-port');
            if (port && port.classList.contains('output')) {
                e.stopPropagation();
                this.isCreatingEdge = true;
                this.sourceNode = port.closest('.flow-node');
                this.createTempEdge();
                this.addMouseMoveHandler();
            }
        });

        // 鼠标移动时更新临时连线
        this.mouseMoveHandler = (e) => {
            if (this.isCreatingEdge) {
                this.updateTempEdge(e);
            }
        };

        // 完成连线
        this.flowChart.container.addEventListener('mouseup', (e) => {
            if (this.isCreatingEdge) {
                const port = e.target.closest('.node-port');
                const targetNode = port?.closest('.flow-node');
                
                if (port?.classList.contains('input') && targetNode) {
                    if (this.validateConnection(this.sourceNode, targetNode)) {
                        this.completeConnection(targetNode);
                    } else {
                        targetNode.classList.add('invalid-target');
                        setTimeout(() => {
                            targetNode.classList.remove('invalid-target');
                        }, 500);
                    }
                }
                this.cancelConnection();
            }
        });

        // 右键删除连线
        this.flowChart.container.addEventListener('contextmenu', (e) => {
            const edge = e.target.closest('.edge');
            if (edge) {
                e.preventDefault();
                e.stopPropagation();
                this.showEdgeContextMenu(edge, e);
            }
        });
    }

    // 开始连线
    startConnection(node) {
        if (!this.validateSourceNode(node)) return;
        
        this.sourceNode = node;
        node.classList.add('connecting');
        
        // 创建临时连线
        this.createTempEdge();
        
        // 添加移动事件
        this.addMouseMoveHandler();
    }

    // 完成连线
    completeConnection(targetNode) {
        if (!this.validateConnection(this.sourceNode, targetNode)) {
            this.cancelConnection();
            return;
        }

        const sourceId = this.sourceNode.dataset.id;
        const targetId = targetNode.dataset.id;

        // 检查连接是否已存在
        if (this.isConnectionExists(sourceId, targetId)) {
            this.cancelConnection();
            return;
        }

        const edgeId = `edge-${Date.now()}`;
        const edgeData = {
            id: edgeId,
            source: sourceId,
            target: targetId,
            type: this.determineEdgeType(this.sourceNode, targetNode)
        };

        // 删除所有与这两个节点相关的虚拟连接线
        this.removeVirtualEdges(sourceId, targetId);
        
        // 添加实际连接
        this.addEdge(edgeData);
        this.cleanupConnection();
    }

    // 验证连线规则
    validateConnection(sourceNode, targetNode) {
        // 不能连接自己
        if (sourceNode === targetNode) return false;

        // 检查节点类型兼容性
        const sourceType = sourceNode.dataset.type;
        const targetType = targetNode.dataset.type;
        
        // 定义允许的连接规则
        const allowedConnections = {
            'resource': ['ai-model'],
            'ai-model': ['result'],
            'result': []
        };

        return allowedConnections[sourceType]?.includes(targetType) || false;
    }

    // 验证源节点
    validateSourceNode(node) {
        const type = node.dataset.type;
        return ['resource', 'ai-model'].includes(type);
    }

    // 显示边缘上下文菜单
    showEdgeContextMenu(edge, event) {
        this.selectedEdge = edge;
        
        const menu = document.createElement('div');
        menu.className = 'edge-context-menu';
        menu.innerHTML = `
            <div class="menu-item delete">删除连线</div>
        `;
        
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;
        
        menu.querySelector('.delete').onclick = () => {
            const edgeId = this.selectedEdge.dataset.edgeId;
            this.removeEdge(edgeId);
            menu.remove();
        };
        
        document.body.appendChild(menu);
        
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        
        // 延迟添加事件监听,避免立即触发
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    // 取消连线
    cancelConnection() {
        if (this.sourceNode) {
            this.sourceNode.classList.remove('connecting');
        }
        if (this.tempEdge) {
            this.tempEdge.remove();
        }
        
        this.cleanupConnection();
    }

    // 清理连线状态
    cleanupConnection() {
        this.sourceNode = null;
        this.tempEdge = null;
        this.isCreatingEdge = false;
        
        // 移除鼠标移动事件
        document.removeEventListener('mousemove', this.mouseMoveHandler);
    }

    // 确定边的类型
    determineEdgeType(sourceNode, targetNode) {
        const sourceType = sourceNode.dataset.type;
        const targetType = targetNode.dataset.type;
        
        if (sourceType === 'resource' && targetType === 'ai-model') {
            return 'resource';
        } else if (sourceType === 'ai-model' && targetType === 'result') {
            return 'result';
        }
        return 'default';
    }

    createTempEdge() {
        this.tempEdge = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.tempEdge.classList.add('edge', 'virtual-edge', 'edge-creating');
        this.tempEdge.dataset.sourceId = this.sourceNode.dataset.id;
        this.tempEdge.style.position = 'absolute';
        this.tempEdge.style.width = '100%';
        this.tempEdge.style.height = '100%';
        this.flowChart.container.appendChild(this.tempEdge);
    }

    updateTempEdge(e) {
        if (!this.tempEdge || !this.sourceNode) return;

        const sourcePort = this.sourceNode.querySelector('.node-port.output');
        const sourceRect = sourcePort.getBoundingClientRect();
        const containerRect = this.flowChart.container.getBoundingClientRect();

        const startX = sourceRect.left - containerRect.left + sourceRect.width/2;
        const startY = sourceRect.top - containerRect.top + sourceRect.height/2;
        const endX = e.clientX - containerRect.left;
        const endY = e.clientY - containerRect.top;

        const path = this.createPath(startX, startY, endX, endY);
        this.tempEdge.innerHTML = `<path d="${path}" />`;
    }

    cleanupTempEdge() {
        if (this.tempEdge) {
            this.tempEdge.remove();
            this.tempEdge = null;
        }
        this.isCreatingEdge = false;
        this.sourcePort = null;
    }

    createPath(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1) * 0.5;
        return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    }

    /**
     * 添加连接线
     * @param {Object} edgeData - 连接线数据
     */
    addEdge(edgeData) {
        // 检查并移除已存在的虚拟连接
        const virtualEdgeKey = `${edgeData.source}-${edgeData.target}`;
        const existingVirtualEdge = this.virtualEdges.get(virtualEdgeKey);
        if (existingVirtualEdge) {
            const virtualEdgeElement = this.flowChart.container.querySelector(`[data-edge-id="${existingVirtualEdge.id}"]`);
            if (virtualEdgeElement) {
                virtualEdgeElement.remove();
            }
            this.virtualEdges.delete(virtualEdgeKey);
        }

        // 添加实际连接
        this.edges.set(edgeData.id, edgeData);
        this.renderEdge(edgeData);
    }

    /**
     * 渲染连接线
     * @param {Object} edgeData - 连接线数据
     */
    renderEdge(edgeData) {
        const sourceNode = this.flowChart.container.querySelector(`[data-id="${edgeData.source}"]`);
        const targetNode = this.flowChart.container.querySelector(`[data-id="${edgeData.target}"]`);
        
        if (!sourceNode || !targetNode) return;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('edge');
        svg.dataset.edgeId = edgeData.id;
        svg.dataset.type = edgeData.type;
        svg.style.position = 'absolute';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '1';

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = this.calculatePathFromNodes(sourceNode, targetNode);
        path.setAttribute('d', d);

        svg.appendChild(path);
        this.flowChart.container.appendChild(svg);
    }

    /**
     * 创建SVG元素
     * @param {Object} edgeData - 连接线数据
     * @returns {SVGElement} SVG元素
     */
    createEdgeSVG(edgeData) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('edge');
        svg.dataset.type = edgeData.type;
        svg.dataset.edgeId = edgeData.id;
        return svg;
    }

    /**
     * 创建路径元素
     * @param {Object} source - 源节点位置
     * @param {Object} target - 目标节点位置
     * @param {string} type - 连接线类型
     * @returns {SVGPathElement} 路径元素
     */
    createEdgePath(source, target, type) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.style.transition = `d ${CONFIG.ANIMATION_DURATION}ms ease`;
        
        // 添加创建动画
        const svg = path.parentElement;
        if (svg) {
            svg.classList.add('edge-creating');
            setTimeout(() => {
                svg.classList.remove('edge-creating');
            }, 500);
        }
        
        const d = this.calculateEdgePath(source, target, type);
        path.setAttribute('d', d);
        
        return path;
    }

    /**
     * 计算路径数据
     * @param {Object} source - 源节点位置
     * @param {Object} target - 目标节点位置
     * @param {string} type - 连接线类型
     * @returns {string} SVG路径数据
     */
    calculateEdgePath(source, target, type) {
        let sourceX, sourceY, targetX, targetY;

        if (type === 'resource') {
            sourceX = source.x + 200;  // 资源节点右侧
            sourceY = source.y + 25;   // 节点中心
            targetX = target.x;        // 模型节点左侧
            targetY = target.y + 25;   // 节点中心
        } else {
            sourceX = source.x + 200;  // 模型节点右侧
            sourceY = source.y + 25;   // 节点中心
            targetX = target.x;        // 结果节点左侧
            targetY = target.y + 25;   // 节点中心
        }

        const controlPoint = (targetX - sourceX) / 2;
        return `M${sourceX},${sourceY} C${sourceX + controlPoint},${sourceY} ${targetX - controlPoint},${targetY} ${targetX},${targetY}`;
    }

    /**
     * 更新所有连接线
     */
    updateEdges() {
        const edges = this.flowChart.container.querySelectorAll('.edge');
        edges.forEach(edge => edge.remove());
        
        this.edges.forEach(edge => {
            this.renderEdge(edge);
        });
    }

    /**
     * 带动画效果更新连接线
     */
    updateEdgesWithAnimation() {
        // 更新实际连接
        this.edges.forEach(edge => {
            const svg = this.flowChart.container.querySelector(`[data-edge-id="${edge.id}"]`);
            if (svg) {
                const sourceNode = this.flowChart.nodeManager.nodes.get(edge.source);
                const targetNode = this.flowChart.nodeManager.nodes.get(edge.target);
                
                if (sourceNode && targetNode) {
                    const path = svg.querySelector('path');
                    const d = this.calculateEdgePath(sourceNode.position, targetNode.position, edge.type);
                    path.setAttribute('d', d);
                }
            }
        });

        // 更新虚拟连接
        this.virtualEdges.forEach(edge => {
            const svg = this.flowChart.container.querySelector(`[data-edge-id="${edge.id}"]`);
            if (svg) {
                const sourceNode = this.flowChart.nodeManager.nodes.get(edge.source);
                const targetNode = this.flowChart.nodeManager.nodes.get(edge.target);
                
                if (sourceNode && targetNode) {
                    const path = svg.querySelector('path');
                    const d = this.calculateEdgePath(sourceNode.position, targetNode.position, 'virtual');
                    path.setAttribute('d', d);
                }
            }
        });
    }

    /**
     * 移除连接线
     * @param {string} edgeId - 连接线ID
     */
    removeEdge(edgeId) {
        const edge = this.flowChart.container.querySelector(`[data-edge-id="${edgeId}"]`);
        if (edge) {
            edge.classList.add('edge-removing');
            setTimeout(() => {
                edge.remove();
                this.edges.delete(edgeId);
            }, 300);
        }
    }

    /**
     * 高亮连接线
     * @param {string} edgeId - 连接线ID
     */
    highlightEdge(edgeId) {
        const edge = this.flowChart.container.querySelector(`[data-edge-id="${edgeId}"]`);
        if (edge) {
            edge.classList.add('highlighted');
        }
    }

    /**
     * 取消高亮连接线
     * @param {string} edgeId - 连接线ID
     */
    unhighlightEdge(edgeId) {
        const edge = this.flowChart.container.querySelector(`[data-edge-id="${edgeId}"]`);
        if (edge) {
            edge.classList.remove('highlighted');
        }
    }

    /**
     * 更新连接线动画
     * @param {string} edgeId - 连接线ID
     * @param {number} progress - 动画进度(0-1)
     */
    updateEdgeAnimation(edgeId, progress) {
        const edge = this.flowChart.container.querySelector(`[data-edge-id="${edgeId}"]`);
        if (edge) {
            const path = edge.querySelector('path');
            if (path) {
                const length = path.getTotalLength();
                path.style.strokeDasharray = length;
                path.style.strokeDashoffset = length * (1 - progress);
            }
        }
    }

    addMouseMoveHandler() {
        document.addEventListener('mousemove', this.mouseMoveHandler);
    }

    // 渲染虚拟连接
    addVirtualEdge(sourceNode, targetNode) {
        const sourceId = sourceNode.dataset.id;
        const targetId = targetNode.dataset.id;
        const virtualEdgeKey = `${sourceId}-${targetId}`;

        // 如果已经存在实际连接,则不添加虚拟连接
        const hasRealConnection = Array.from(this.edges.values()).some(
            edge => edge.source === sourceId && edge.target === targetId
        );

        if (!hasRealConnection) {
            const virtualEdgeData = {
                id: `virtual-edge-${virtualEdgeKey}`,
                source: sourceId,
                target: targetId,
                type: 'virtual'
            };

            this.virtualEdges.set(virtualEdgeKey, virtualEdgeData);
            this.renderVirtualEdge(virtualEdgeData);
        }
    }

    // 渲染虚拟连接线
    renderVirtualEdge(edgeData) {
        const sourceNode = this.flowChart.nodeManager.nodes.get(edgeData.source);
        const targetNode = this.flowChart.nodeManager.nodes.get(edgeData.target);
        
        if (!sourceNode || !targetNode) return;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('edge', 'virtual-edge');
        svg.dataset.edgeId = edgeData.id;
        svg.style.position = 'absolute';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';

        const path = this.createEdgePath(sourceNode.position, targetNode.position);
        svg.appendChild(path);
        this.flowChart.container.appendChild(svg);
    }

    // 检查连接是否已存在
    isConnectionExists(sourceId, targetId) {
        return Array.from(this.edges.values()).some(
            edge => edge.source === sourceId && edge.target === targetId
        );
    }

    // 添加删除虚拟连接线的方法
    removeVirtualEdges(sourceId, targetId) {
        // 查找并删除所有相关的虚拟连接线
        const virtualEdges = this.flowChart.container.querySelectorAll('.edge.virtual-edge');
        virtualEdges.forEach(edge => {
            const edgeSourceId = edge.dataset.sourceId;
            const edgeTargetId = edge.dataset.targetId;
            if (edgeSourceId === sourceId || edgeTargetId === targetId) {
                edge.remove();
            }
        });
    }

    /**
     * 更新与指定节点相关的所有边
     * @param {string} nodeId - 需要更新边的节点ID
     */
    updateEdgesForNode(nodeId) {
        // 更新所有相关的边
        const edges = this.flowChart.container.querySelectorAll('.edge');
        edges.forEach(edge => {
            const edgeData = this.edges.get(edge.dataset.edgeId);
            if (!edgeData) return;

            if (edgeData.source === nodeId || edgeData.target === nodeId) {
                const sourceNode = this.flowChart.container.querySelector(`[data-id="${edgeData.source}"]`);
                const targetNode = this.flowChart.container.querySelector(`[data-id="${edgeData.target}"]`);
                
                if (sourceNode && targetNode) {
                    const path = edge.querySelector('path');
                    if (path) {
                        const d = this.calculatePathFromNodes(sourceNode, targetNode);
                        path.setAttribute('d', d);
                    }
                }
            }
        });
    }

    /**
     * 根据两个节点计算路径
     * @param {HTMLElement} sourceNode 
     * @param {HTMLElement} targetNode 
     * @returns {string} SVG路径数据
     */
    calculatePathFromNodes(sourceNode, targetNode) {
        const sourcePort = sourceNode.querySelector('.node-port.output');
        const targetPort = targetNode.querySelector('.node-port.input');
        
        if (!sourcePort || !targetPort) return '';

        // 获取连接点的绝对位置
        const sourceRect = sourcePort.getBoundingClientRect();
        const targetRect = targetPort.getBoundingClientRect();
        const containerRect = this.flowChart.container.getBoundingClientRect();

        // 计算相对于容器的坐标
        const sourceX = sourceRect.left - containerRect.left + (sourceRect.width / 2);
        const sourceY = sourceRect.top - containerRect.top + (sourceRect.height / 2);
        const targetX = targetRect.left - containerRect.left + (targetRect.width / 2);
        const targetY = targetRect.top - containerRect.top + (targetRect.height / 2);

        // 计算控制点偏移量
        const controlPointOffset = Math.abs(targetX - sourceX) * 0.5;

        // 返回贝塞尔曲线路径
        return `M ${sourceX} ${sourceY} 
                C ${sourceX + controlPointOffset} ${sourceY},
                  ${targetX - controlPointOffset} ${targetY},
                  ${targetX} ${targetY}`;
    }

    // ... 其他边缘相关方法
} 