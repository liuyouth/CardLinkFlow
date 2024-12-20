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
        this.isManualConnectionMode = true; // 添加手动连接模式标志
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
            await this.connectToModelNodes(nodeData);
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
        this.connectToResourceNodes(nodeData);
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

        // 如果不是手动连接模式,才自动创建连接
        if (!this.isManualConnectionMode) {
            this.flowChart.edgeManager.addEdge({
                id: `edge-${modelNode.id}-${resultNode.id}`,
                source: modelNode.id,
                target: resultNode.id,
                type: 'result'
            });
        }
    }

    /**
     * 连接到资源节点
     * @param {Object} modelNode - 模型节点数据
     */
    connectToResourceNodes(modelNode) {
        // 如果是手动连接模式,则不执行自动连接
        if (this.isManualConnectionMode) return;

        const resourceNodes = Array.from(this.nodes.values())
            .filter(node => node.type === CONFIG.NODE_TYPES.RESOURCE);

        resourceNodes.forEach(resourceNode => {
            this.flowChart.edgeManager.addEdge({
                id: `edge-${resourceNode.id}-${modelNode.id}`,
                source: resourceNode.id,
                target: modelNode.id,
                type: 'resource'
            });
        });
    }

    /**
     * 连接到模型节点
     * @param {Object} resourceNode - 资源节点数据
     */
    connectToModelNodes(resourceNode) {
        // 如果是手动连接模式,则不执行自动连接
        if (this.isManualConnectionMode) return;

        const modelNodes = Array.from(this.nodes.values())
            .filter(node => node.type === CONFIG.NODE_TYPES.AI_MODEL);

        modelNodes.forEach(modelNode => {
            this.flowChart.edgeManager.addEdge({
                id: `edge-${resourceNode.id}-${modelNode.id}`,
                source: resourceNode.id,
                target: modelNode.id,
                type: 'resource'
            });
        });
    }

    /**
     * 创建节点DOM元素
     * @param {Object} nodeData - 节点数据
     * @returns {HTMLElement} 节点元素
     */
    createNodeElement(nodeData) {
        const node = document.createElement('div');
        node.className = 'flow-node';
        node.setAttribute('data-id', nodeData.id);
        node.setAttribute('data-type', nodeData.type);
        
        // 创���节点内容
        node.innerHTML = `
            <div class="node-content">
                <div class="node-icon">${nodeData.icon || ''}</div>
                <div class="node-info">
                    <div class="node-label">${nodeData.label}</div>
                    <div class="node-type">${nodeData.type}</div>
                </div>
            </div>
            
            <!-- 添加四个方向的连接点,都可以作为输入输出 -->
            <div class="node-port top" data-type="port"></div>
            <div class="node-port bottom" data-type="port"></div>
            <div class="node-port left" data-type="port"></div>
            <div class="node-port right" data-type="port"></div>
        `;

        // 设置节点位置在屏幕中心
        const centerX = window.innerWidth / 2 - 100; // 100是节点宽度的一半
        const centerY = window.innerHeight / 2 - 50; // 50是节点高度的一半
        
        node.style.left = `${centerX}px`;
        node.style.top = `${centerY}px`;

        // 初始化连接点事件
        this.initializePortEvents(node);
        
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

    // 判断连接是否有效
    isValidConnection(startPort, endPort) {
        const startNode = startPort.closest('.flow-node');
        const endNode = endPort.closest('.flow-node');
        
        // 只验证不能连接到自己
        return startNode !== endNode;
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

        // 查找连接到该模型的资源节点
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

    createNode(type, position) {
        const node = document.createElement('div');
        node.className = 'flow-node';
        node.setAttribute('data-type', type);
        
        // 添加输入输出连接点
        const inputPort = document.createElement('div');
        inputPort.className = 'node-port input';
        node.appendChild(inputPort);
        
        const outputPort = document.createElement('div');
        outputPort.className = 'node-port output';
        node.appendChild(outputPort);
        
        // 其他节点内容...
        
        return node;
    }

    // ... 其他辅助��法
} 