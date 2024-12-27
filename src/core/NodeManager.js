import { CONFIG } from '../config/constants.js';

/**
 * 节点管理器类
 * 负责节点的创建、更新和删除
 * @class NodeManager
 */
export class NodeManager {
    /**
     * 创建节点管理器实例
     * @param {FlowChart} flowChart - 流程图实例的引用
     */
    constructor(flowChart) {
        /** @type {FlowChart} 流程图实例 */
        this.flowChart = flowChart;
        
        /** @type {Map<string, Object>} 节点存储映射 */
        this.nodes = new Map();
        this.nodeCounter = {
            resource: 0,
            'ai-model': 0,
            result: 0
        };
    }

    /**
     * 创建资源节点
     * @async
     * @param {string} url - 资源URL
     * @throws {Error} 当URL未提供时抛出错误
     */
    async createResourceNode(url) {
        try {
            if (!url) throw new Error('Resource URL is required');

            const position = this.calculateResourceNodePosition();
            const nodeData = this.createResourceNodeData(url, position);
            
            this.addNode(nodeData);
            this.flowChart.layoutManager.calculateOptimalLayout();
            
        } catch (error) {
            console.error('Error creating resource node:', error);
        }
    }

    /**
     * 计算资源节点位置
     * @returns {{x: number, y: number}}
     */
    calculateResourceNodePosition() {
        const resourceNodes = Array.from(this.nodes.values())
            .filter(node => node.type === CONFIG.NODE_TYPES.RESOURCE);
        
        return {
            x: this.flowChart.areas.resource.x,
            y: resourceNodes.length === 0 ? 
                this.flowChart.areas.resource.y : 
                resourceNodes[resourceNodes.length - 1].position.y + CONFIG.NODE_SPACING
        };
    }

    /**
     * 创建资源节点数据
     * @param {string} url - 资源URL
     * @param {{x: number, y: number}} position - 节点位置
     * @returns {Object} 节点数据
     */
    createResourceNodeData(url, position) {
        return {
            id: `resource-${Date.now()}`,
            type: CONFIG.NODE_TYPES.RESOURCE,
            position,
            data: {
                label: '资源',
                type: 'Resource',
                url
            }
        };
    }

    /**
     * 添加节点
     * @param {Object} nodeData - 节点数据
     */
    addNode(nodeData) {
        this.nodes.set(nodeData.id, nodeData);
        const nodeElement = this.createNodeElement(nodeData);
        this.flowChart.container.appendChild(nodeElement);
    }

    /**
     * 添加API节点
     * @param {Object} api - API配置
     */
    addApiNode(api) {
        const position = this.calculateApiNodePosition();
        const nodeData = {
            id: `${api.id}-${Date.now()}`,
            type: CONFIG.NODE_TYPES.AI_MODEL,
            position,
            data: {
                label: api.name,
                type: 'AI Model',
                icon: api.icon
            }
        };

        this.addNode(nodeData);
        this.createResultNode(nodeData);
        this.flowChart.layoutManager.calculateOptimalLayout();
    }

    /**
     * 计算API节点位置
     * @returns {{x: number, y: number}}
     */
    calculateApiNodePosition() {
        const modelNodes = Array.from(this.nodes.values())
            .filter(node => node.type === CONFIG.NODE_TYPES.AI_MODEL);
        
        return {
            x: this.flowChart.areas.models.x,
            y: modelNodes.length === 0 ? 
                this.flowChart.areas.models.y : 
                modelNodes[modelNodes.length - 1].position.y + CONFIG.NODE_SPACING
        };
    }

    /**
     * 创建结果节点
     * @param {Object} modelNode - 模型节点数据
     */
    createResultNode(modelNode) {
        const resultNode = {
            id: `result-${modelNode.id}`,
            type: CONFIG.NODE_TYPES.RESULT,
            position: {
                x: this.flowChart.areas.results.x,
                y: modelNode.position.y
            },
            data: {
                label: `${modelNode.data.label} Result`,
                type: 'Processing Result',
                parentModel: modelNode.id
            }
        };

        this.addNode(resultNode);
    }

    /**
     * 获取节点内容HTML
     * @param {Object} nodeData - 节点数据
     * @returns {string} HTML字符串
     */
    getNodeContent(nodeData) {
        switch (nodeData.type) {
            case CONFIG.NODE_TYPES.RESOURCE:
                return this.getResourceNodeContent(nodeData);
            case CONFIG.NODE_TYPES.AI_MODEL:
                return this.getModelNodeContent(nodeData);
            case CONFIG.NODE_TYPES.RESULT:
                return this.getResultNodeContent(nodeData);
            default:
                return '';
        }
    }

    /**
     * 获取资源节点的HTML内容
     * @param {Object} nodeData - 节点数据
     * @returns {string} HTML字符串
     */
    getResourceNodeContent(nodeData) {
        return `
            <div class="node-content">
                <div class="resource-preview">
                    <img src="${nodeData.data.url}" 
                         alt="Resource preview" 
                         style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;"
                         onclick="showModal('${nodeData.data.url}')">
                </div>
                <div class="node-info">
                    <div class="node-label">${nodeData.data.label}</div>
                    <div class="node-type">${nodeData.data.type}</div>
                </div>
            </div>
        `;
    }

    /**
     * 获取AI模型节点的HTML内容
     * @param {Object} nodeData - 节点数据
     * @returns {string} HTML字符串
     */
    getModelNodeContent(nodeData) {
        return `
            <div class="node-content">
                <div class="api-icon">${nodeData.data.icon}</div>
                <div class="node-info">
                    <div class="node-label">${nodeData.data.label}</div>
                    <div class="node-type">${nodeData.data.type}</div>
                </div>
            </div>
        `;
    }

    /**
     * 获取结果节点的HTML内容
     * @param {Object} nodeData - 节点数据
     * @returns {string} HTML字符串
     */
    getResultNodeContent(nodeData) {
        const resourceNode = this.getResourceNodeForResult(nodeData);
        const resultImage = resourceNode ? resourceNode.data.url : '';

        return `
            <div class="node-content">
                <div class="result-preview">
                    <div class="result-header">
                        <div class="result-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="node-info">
                            <div class="node-label">${nodeData.data.label}</div>
                            <div class="node-type">${nodeData.data.type}</div>
                        </div>
                    </div>
                    ${resultImage ? `
                        <div class="resource-preview">
                            <img src="${resultImage}" 
                                 alt="Result preview" 
                                 style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px; margin-top: 8px;"
                                 onclick="showModal('${resultImage}')">
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 获取结果节点对应的资源节点
     * @param {Object} resultNode - 结果节点数据
     * @returns {Object|null} 资源节点数据
     */
    getResourceNodeForResult(resultNode) {
        const modelNode = this.nodes.get(resultNode.data.parentModel);
        if (!modelNode) return null;

        // 查找接到该模型的资源节点
        return Array.from(this.nodes.values())
            .find(node => 
                node.type === CONFIG.NODE_TYPES.RESOURCE &&
                Array.from(this.flowChart.edgeManager.edges.values())
                    .some(edge => 
                        edge.source === node.id && 
                        edge.target === modelNode.id
                    )
            );
    }

    createNode(type, data = {}) {
        const id = `${type}-${Date.now()}`;
        const position = this.calculateNodePosition(type);
        
        const node = document.createElement('div');
        node.className = 'flow-node';
        node.setAttribute('data-id', id);
        node.setAttribute('data-type', type);
        
        // 设置节点位置
        node.style.position = 'absolute';
        node.style.left = `${position.x}px`;
        node.style.top = `${position.y}px`;
        
        // ... 其他节点创建代码 ...

        return node;
    }

    calculateNodePosition(type) {
        const spacing = 50; // 节点之间的间距
        let x, y;

        switch (type) {
            case 'resource':
                // 资源节点在左侧垂直排列
                x = CONFIG.AREAS.LEFT_MARGIN;
                y = CONFIG.AREAS.TOP_MARGIN + (this.nodeCounter.resource * (CONFIG.NODE_HEIGHT + spacing));
                this.nodeCounter.resource++;
                break;

            case 'ai-model':
                // AI模型节点在中间垂直排列
                x = this.flowChart.centerX - CONFIG.NODE_WIDTH/2;
                y = CONFIG.AREAS.TOP_MARGIN + (this.nodeCounter['ai-model'] * (CONFIG.NODE_HEIGHT + spacing));
                this.nodeCounter['ai-model']++;
                break;

            case 'result':
                // 结果节点在右侧垂直排列
                x = this.flowChart.centerX + CONFIG.AREAS.SPACING;
                y = CONFIG.AREAS.TOP_MARGIN + (this.nodeCounter.result * (CONFIG.NODE_HEIGHT + spacing));
                this.nodeCounter.result++;
                break;

            default:
                x = 0;
                y = 0;
        }

        return { x, y };
    }

    getAreaNodeCount(type) {
        let count = 0;
        this.flowChart.container.querySelectorAll(`.flow-node[data-type="${type}"]`).forEach(() => {
            count++;
        });
        return count;
    }

    createNodeContent(nodeData) {
        let content = `
            <div class="node-content">
                <div class="node-info">
                    <div class="node-label">${nodeData.label}</div>
                    <div class="node-type">${nodeData.type}</div>
                </div>
            </div>
        `;

        // 如果是资源节点且有URL，添加预览
        if (nodeData.type === 'resource' && nodeData.url) {
            content = `
                <div class="node-content">
                    <div class="resource-preview">
                        <img src="${nodeData.url}" 
                             alt="Resource preview" 
                             style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
                    </div>
                    <div class="node-info">
                        <div class="node-label">${nodeData.label}</div>
                        <div class="node-type">${nodeData.type}</div>
                    </div>
                </div>
            `;
        }

        return content;
    }

    addConnectionPorts(node) {
        // 添加四个方向的连接点
        const ports = `
            <div class="node-port top" data-type="port"></div>
            <div class="node-port bottom" data-type="port"></div>
            <div class="node-port left" data-type="port"></div>
            <div class="node-port right" data-type="port"></div>
        `;
        node.insertAdjacentHTML('beforeend', ports);
        
        // 初始化连接点事件
        this.initializePortEvents(node);
    }

    createNodeElement(nodeData) {
        const node = document.createElement('div');
        node.className = 'flow-node';
        node.setAttribute('data-id', nodeData.id);
        node.setAttribute('data-type', nodeData.type);
        node.setAttribute('data-label', nodeData.data.label || '');
        if (nodeData.data.url) {
            node.setAttribute('data-url', nodeData.data.url);
        }
        
        // 设置节点位置
        node.style.position = 'absolute';
        node.style.left = `${nodeData.position.x}px`;
        node.style.top = `${nodeData.position.y}px`;
        
        // 创建节点内容
        node.innerHTML = this.createNodeContent(nodeData);
        
        // 添加连接点
        this.addConnectionPorts(node);
        
        return node;
    }

    initializePortEvents(node) {
        const ports = node.querySelectorAll('.node-port');
        
        ports.forEach(port => {
            // 开始连接
            port.addEventListener('mousedown', (e) => {
                e.stopPropagation(); // 防止与节点拖动冲突
                this.flowChart.startConnection(port);
            });

            // 连接过程
            port.addEventListener('mouseover', () => {
                if (this.flowChart.connectionState.isConnecting) {
                    const startNode = this.flowChart.connectionState.startNode;
                    const endNode = port.closest('.flow-node');
                    
                    if (startNode !== endNode) {
                        port.classList.add('connectable');
                    }
                }
            });

            port.addEventListener('mouseout', () => {
                port.classList.remove('connectable');
            });

            // 结束连接
            port.addEventListener('mouseup', () => {
                if (this.flowChart.connectionState.isConnecting) {
                    this.flowChart.finishConnection(port);
                }
            });
        });
    }

    isValidConnection(startPort, endPort) {
        const startNode = startPort.closest('.flow-node');
        const endNode = endPort.closest('.flow-node');
        
        // 只验证不能连接到自己
        return startNode !== endNode;
    }

    /**
     * 创建空节点
     * @param {string} type - 节点类型 (resource/ai-model/result)
     * @returns {void}
     */
    createEmptyNode(type = CONFIG.NODE_TYPES.RESOURCE) {
        try {
            const position = this.calculateNodePosition(type);
            const nodeData = {
                id: `${type}-${Date.now()}`,
                type: type,
                position: position,
                data: {
                    label: this.getDefaultLabel(type),
                    type: this.getDefaultType(type),
                    url: '' // 对于资源节点，初始为空URL
                }
            };
            
            this.addNode(nodeData);
            this.flowChart.layoutManager.calculateOptimalLayout();
            
        } catch (error) {
            console.error('Error creating empty node:', error);
        }
    }

    /**
     * 获取节点默认标签
     * @private
     * @param {string} type - 节点类型
     * @returns {string} 默认标签
     */
    getDefaultLabel(type) {
        const count = this.getAreaNodeCount(type);
        switch (type) {
            case CONFIG.NODE_TYPES.RESOURCE:
                return `资源 ${count + 1}`;
            case CONFIG.NODE_TYPES.AI_MODEL:
                return `模型 ${count + 1}`;
            case CONFIG.NODE_TYPES.RESULT:
                return `结果 ${count + 1}`;
            default:
                return `节点 ${count + 1}`;
        }
    }

    /**
     * 获取节点默认类型描述
     * @private
     * @param {string} type - 节点类型
     * @returns {string} 类型描述
     */
    getDefaultType(type) {
        switch (type) {
            case CONFIG.NODE_TYPES.RESOURCE:
                return 'Empty Resource';
            case CONFIG.NODE_TYPES.AI_MODEL:
                return 'Empty Model';
            case CONFIG.NODE_TYPES.RESULT:
                return 'Empty Result';
            default:
                return 'Empty Node';
        }
    }

    // ... 其他辅助方法
} 