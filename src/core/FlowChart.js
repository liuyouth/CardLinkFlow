import { CONFIG } from '../config/constants.js';
import { ICONS } from '../config/icons.js';
import { NodeManager } from './NodeManager.js';
import { EdgeManager } from './EdgeManager.js';
import { DragHandler } from './DragHandler.js';
import { LayoutManager } from './LayoutManager.js';
import { PropertiesPanel } from './PropertiesPanel.js';

/**
 * 流程图主类
 * @class FlowChart
 */
export class FlowChart {
    /**
     * 创建流程图实例
     * @param {HTMLElement} container - 流程图容器元素
     * @throws {Error} 当容器元素未提供时抛出错误
     */
    constructor(container) {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;
        
        // 添加边和节点的存储
        this.edges = [];
        this.nodes = [];
        
        // 添加连线状态
        this.connectionState = {
            isConnecting: false,
            startPort: null,
            startNode: null,
            tempEdge: null
        };

        // 初始化各个管理器
        this.nodeManager = new NodeManager(this);
        this.edgeManager = new EdgeManager(this);
        this.dragHandler = new DragHandler(this);
        this.layoutManager = new LayoutManager(this);
        
        // 初始化功能
        this.initCanvasAreas();
        this.initEventListeners();
        this.initResourceInput();
        this.initModal();
        this.initApiList();
        
        this.propertiesPanel = new PropertiesPanel(this);
        
        // 添加节点和连接线的点击事件
        this.container.addEventListener('click', (e) => {
            const path = e.target.closest('.edge-path');
            const node = e.target.closest('.flow-node');
            
            // 如果点击的是连接线
            if (path) {
                const edge = path.closest('.edge');
                if (edge) {
                    e.stopPropagation(); // 阻止事件冒泡
                    this.handleEdgeClick(edge);
                }
                return;
            }

            // 如果点击的是节点
            if (node) {
                e.stopPropagation(); // 阻止事件冒泡
                this.handleNodeClick(node);
                return;
            }

            // 如果点击空白处，取消所有选中状态
            this.clearSelection();
        });

        // 添加选中状态的属性
        this.selectedNode = null;
        this.selectedEdge = null;

        // 添加键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedEdge) {
                    const edgeId = this.selectedEdge.getAttribute('data-edge-id');
                    this.edgeManager.deleteEdge(edgeId);
                    this.selectedEdge = null;
                }
            }
        });

        // 添加导出导入按钮到工具栏
        this.addExportImportButtons();
    }

    /**
     * 初始化画布区域
     * 计算并设置资源、模型和结果区域的位置
     * @private
     */
    initCanvasAreas() {
        this.centerX = window.innerWidth / 2;
        this.centerY = window.innerHeight / 2;
        
        this.areas = {
            resource: { 
                x: CONFIG.AREAS.LEFT_MARGIN, 
                y: this.centerY - 50
            },
            models: { 
                x: this.centerX - CONFIG.AREAS.MODEL_WIDTH/2,
                y: this.centerY - 50
            },
            results: { 
                x: this.centerX + CONFIG.AREAS.SPACING,
                y: this.centerY - 50
            }
        };
    }

    initEventListeners() {
        // 添加拖拽事件
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            const nodeType = e.dataTransfer.getData('node-type');
            if (nodeType) {
                this.nodeManager.createNode(nodeType, {
                    x: e.clientX - this.container.offsetLeft,
                    y: e.clientY - this.container.offsetTop
                });
            }
        });

        // 添加缩放事件
        this.container.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                this.scale *= delta;
                this.scale = Math.max(0.5, Math.min(2, this.scale));
                this.updateScale();
            }
        });

        // 添加连线相关的事件监听
        this.container.addEventListener('mousedown', (e) => {
            const port = e.target.closest('.node-port');
            if (port) {
                e.stopPropagation();
                this.startConnection(port);
            }
        });

        this.container.addEventListener('mousemove', (e) => {
            if (this.connectionState.isConnecting) {
                this.updateTempConnection(e);
            }
        });

        this.container.addEventListener('mouseup', (e) => {
            if (this.connectionState.isConnecting) {
                const port = e.target.closest('.node-port');
                if (port) {
                    this.finishConnection(port);
                } else {
                    this.cancelConnection();
                }
            }
        });
    }

    initResourceInput() {
        const input = document.getElementById('resourceInput');
        if (input) {
            input.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    const url = e.target.value.trim();
                    if (url) {
                        await this.nodeManager.createResourceNode(url);
                        input.value = ''; // 清空输入框
                    }
                }
            });
        }
    }

    initModal() {
        const modal = document.getElementById('imageModal');
        const closeBtn = modal?.querySelector('.close-button');
        
        if (modal && closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };

            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            };

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.style.display === 'block') {
                    modal.style.display = 'none';
                }
            });
        }
    }

    initApiList() {
        const apiList = document.getElementById('apiList');
        if (!apiList) return;

        const apis = [
            { id: 'gpt-4', name: 'GPT-4', icon: ICONS.CODE },
            { id: 'claude', name: 'Claude', icon: ICONS.CODE },
            { id: 'gemini', name: 'Gemini', icon: ICONS.CODE },
            { id: 'llama', name: 'Llama 2', icon: ICONS.CODE },
            { id: 'mistral', name: 'Mistral', icon: ICONS.CODE }
        ];

        apis.forEach(api => {
            const button = document.createElement('button');
            button.className = 'api-button';
            button.innerHTML = `
                <div class="api-icon">${api.icon}</div>
                <span>${api.name}</span>
            `;
            
            button.addEventListener('click', () => this.nodeManager.addApiNode(api));
            apiList.appendChild(button);
        });
    }

    // 添加处理节点移动的方法
    handleNodeMove(detail) {
        const { node } = detail;
        const nodeId = node.getAttribute('data-id');
        
        // 使用 EdgeManager 来更新边
        this.edgeManager.updateEdgesForNode(nodeId);
    }

    startConnection(port) {
        const node = port.closest('.flow-node');
        if (!node) return;

        this.connectionState = {
            isConnecting: true,
            startPort: port,
            startNode: node,
            tempEdge: this.edgeManager.createTempEdge()
        };

        port.classList.add('connecting');
        node.classList.add('connecting');
    }

    updateTempConnection(e) {
        if (!this.connectionState.tempEdge) return;

        const containerRect = this.container.getBoundingClientRect();
        const endX = e.clientX - containerRect.left;
        const endY = e.clientY - containerRect.top;

        this.edgeManager.updateTempEdge(
            this.connectionState.startPort,
            { x: endX, y: endY }
        );
    }

    finishConnection(endPort) {
        const endNode = endPort.closest('.flow-node');
        if (!endNode || !this.connectionState.startNode) return;

        if (this.edgeManager.validateConnection(this.connectionState.startNode, endNode)) {
            this.edgeManager.createConnection(
                this.connectionState.startPort,
                endPort
            );
        }

        this.cleanupConnection();
    }

    cancelConnection() {
        this.cleanupConnection();
    }

    cleanupConnection() {
        if (this.connectionState.startPort) {
            this.connectionState.startPort.classList.remove('connecting');
        }
        if (this.connectionState.startNode) {
            this.connectionState.startNode.classList.remove('connecting');
        }
        if (this.connectionState.tempEdge) {
            this.connectionState.tempEdge.remove();
        }

        this.connectionState = {
            isConnecting: false,
            startPort: null,
            startNode: null,
            tempEdge: null
        };
    }

    // 添加选中节点的方法
    selectNode(node) {
        // 如果之前有选中的节点，移除其选中状态
        if (this.selectedNode) {
            this.selectedNode.classList.remove('selected');
        }
        
        // 清除选中的边
        if (this.selectedEdge) {
            this.selectedEdge.classList.remove('selected');
            this.selectedEdge = null;
        }

        // 设置新的选中节点
        this.selectedNode = node;
        if (node) {
            node.classList.add('selected');
        }
    }

    // 添加选中边的方法
    selectEdge(edge) {
        // 如果之前有选中的边，移除其选中状态
        if (this.selectedEdge) {
            this.selectedEdge.classList.remove('selected');
        }
        
        // 清除选中的节点
        if (this.selectedNode) {
            this.selectedNode.classList.remove('selected');
            this.selectedNode = null;
        }

        // 设置新的选中边
        this.selectedEdge = edge;
        if (edge) {
            edge.classList.add('selected');
        }
    }

    // 修改 handleNodeClick 方法
    handleNodeClick(node) {
        // 如果正在连线，不处理点击事件
        if (this.connectionState.isConnecting) return;

        const nodeData = {
            type: 'node',
            id: node.getAttribute('data-id'),
            label: node.getAttribute('data-label') || '',
            nodeType: node.getAttribute('data-type') || 'resource',
            url: node.getAttribute('data-url') || ''
        };
        
        // 将节点添加到 nodes 数组中（如果不存在）
        if (!this.nodes.find(n => n.id === nodeData.id)) {
            this.nodes.push(nodeData);
        }
        
        this.selectNode(node);
        this.propertiesPanel.show(nodeData);
    }

    // 修改 handleEdgeClick 方法
    handleEdgeClick(edge) {
        // 如果正在连线，不处理点击事件
        if (this.connectionState.isConnecting) return;

        const edgeData = {
            type: 'edge',
            id: edge.getAttribute('data-edge-id'),
            edgeType: edge.getAttribute('data-type') || 'default',
            source: edge.getAttribute('data-source'),
            target: edge.getAttribute('data-target')
        };
        
        this.selectEdge(edge);
        this.propertiesPanel.show(edgeData);
    }

    // 添加更新节点的方法
    updateNode(nodeData) {
        if (!this.selectedNode) return;
        
        // 更新节点的属性
        this.selectedNode.setAttribute('data-label', nodeData.label);
        this.selectedNode.setAttribute('data-type', nodeData.type);
        this.selectedNode.setAttribute('data-url', nodeData.url);
        
        // 更新节点的显示
        const labelElement = this.selectedNode.querySelector('.node-label');
        if (labelElement) {
            labelElement.textContent = nodeData.label;
        }
        
        // 触发节点更新事件
        this.container.dispatchEvent(new CustomEvent('nodeUpdated', { 
            detail: { node: this.selectedNode }
        }));
    }

    // 添加更新边的方法
    updateEdge(edgeData) {
        if (!this.selectedEdge) return;
        
        // 更新边的属性
        this.selectedEdge.setAttribute('data-type', edgeData.type);
        
        // 更新边的样式
        this.selectedEdge.className = `edge ${edgeData.type}`;
        
        // 触发边更新事件
        this.container.dispatchEvent(new CustomEvent('edgeUpdated', { 
            detail: { edge: this.selectedEdge }
        }));
    }

    // 添加获取节点的方法
    getNodeById(id) {
        return this.nodes.find(node => node.id === id);
    }

    // 添加获取边的方法
    getEdgeById(id) {
        return this.edges.find(edge => edge.id === id);
    }

    // 在创建连接时添加到 edges 数组
    addEdge(edge) {
        this.edges.push(edge);
    }

    // 在删除连接时从 edges 数组中移除
    removeEdge(edgeId) {
        this.edges = this.edges.filter(edge => edge.id !== edgeId);
    }

    // 添加清除选中状态的方法
    clearSelection() {
        if (this.selectedNode) {
            this.selectedNode.classList.remove('selected');
            this.selectedNode = null;
        }
        if (this.selectedEdge) {
            this.selectedEdge.classList.remove('selected');
            this.selectedEdge = null;
        }
        // 隐藏属性面板
        this.propertiesPanel.hide();
    }

    // 添加导出导入按钮
    addExportImportButtons() {
        const apiList = document.getElementById('apiList');
        if (!apiList) return;

        // 添加导出按钮
        const exportButton = document.createElement('button');
        exportButton.className = 'api-button';
        exportButton.innerHTML = `
            <div class="api-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
            </div>
            <span>导出配置</span>
        `;
        exportButton.addEventListener('click', () => this.exportConfig());

        // 添加导入按钮和文件输入
        const importButton = document.createElement('button');
        importButton.className = 'api-button';
        importButton.innerHTML = `
            <div class="api-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M5 20h14v-2H5v2zm0-10h4v6h6v-6h4l-7-7-7 7z"/>
                </svg>
            </div>
            <span>导入配置</span>
        `;

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', (e) => this.importConfig(e.target.files[0]));

        importButton.addEventListener('click', () => fileInput.click());

        apiList.appendChild(exportButton);
        apiList.appendChild(importButton);
        apiList.appendChild(fileInput);
    }

    // 导出配置
    exportConfig() {
        const config = {
            nodes: [],
            edges: []
        };

        // 收集所有节点信息
        this.container.querySelectorAll('.flow-node').forEach(node => {
            config.nodes.push({
                id: node.getAttribute('data-id'),
                type: node.getAttribute('data-type'),
                label: node.getAttribute('data-label') || '',
                url: node.getAttribute('data-url') || '',
                position: {
                    x: parseInt(node.style.left),
                    y: parseInt(node.style.top)
                }
            });
        });

        // 收集所有边的信息，包括完整的属性
        this.edges.forEach(edge => {
            const edgeElement = this.container.querySelector(`[data-edge-id="${edge.id}"]`);
            if (edgeElement) {
                const path = edgeElement.querySelector('path');
                config.edges.push({
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    type: edge.type,
                    // 从 edge 对象中获取连接点类型
                    sourcePortType: edge.sourcePortType || 'right',  // 默认值
                    targetPortType: edge.targetPortType || 'left',   // 默认值
                    style: {
                        strokeWidth: path?.getAttribute('stroke-width') || '2',
                        strokeColor: path?.getAttribute('stroke') || 'rgba(255, 255, 255, 0.3)',
                        strokeStyle: path?.getAttribute('stroke-dasharray') || 'none',
                        animationSpeed: edgeElement.style.getPropertyValue('--animation-speed') || '1'
                    }
                });
            }
        });

        // 创建并下载配置文件
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flowchart-config-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 导入配置
    async importConfig(file) {
        if (!file) return;

        try {
            const config = JSON.parse(await file.text());
            
            // 清空现有的节点和边
            this.clearAll();

            // 创建节点
            for (const nodeData of config.nodes) {
                const node = document.createElement('div');
                node.className = 'flow-node';
                node.setAttribute('data-id', nodeData.id);
                node.setAttribute('data-type', nodeData.type);
                node.setAttribute('data-label', nodeData.label);
                if (nodeData.url) {
                    node.setAttribute('data-url', nodeData.url);
                }

                // 设置节点位置
                node.style.position = 'absolute';
                node.style.left = `${nodeData.position.x}px`;
                node.style.top = `${nodeData.position.y}px`;

                // 创建节点内容
                node.innerHTML = this.nodeManager.createNodeContent(nodeData);
                
                // 添加连接点
                this.nodeManager.addConnectionPorts(node);
                
                this.container.appendChild(node);
                // 将节点添加到 nodes 数组
                this.nodes.push(nodeData);
            }

            // 等待所有节点创建完成后再创建边
            setTimeout(() => {
                // 创建边
                for (const edgeData of config.edges) {
                    // 直接使用 EdgeManager 的 addEdge 方法添加边
                    this.edgeManager.addEdge({
                        id: edgeData.id,
                        source: edgeData.source,
                        target: edgeData.target,
                        type: edgeData.type,
                        sourcePortType: edgeData.sourcePortType,
                        targetPortType: edgeData.targetPortType,
                        style: edgeData.style
                    });

                    // 将边添加到 edges 数组
                    this.edges.push(edgeData);
                }
            }, 100);

        } catch (error) {
            console.error('Error importing config:', error);
            alert('导入配置文件失败，请检查文件格式是否正确。');
        }
    }

    // 清空所有节点和边
    clearAll() {
        // 清空节点
        this.container.querySelectorAll('.flow-node').forEach(node => node.remove());
        
        // 清空边
        this.container.querySelectorAll('.edge').forEach(edge => edge.remove());
        
        // 清空数组
        this.edges = [];
        this.nodes = [];
        
        // 重置计数器
        this.nodeManager.nodeCounter = {
            resource: 0,
            'ai-model': 0,
            result: 0
        };
    }

    // ... 其他核心方法
} 