export class PropertiesPanel {
    constructor(flowChart) {
        this.flowChart = flowChart;
        this.panel = document.getElementById('propertiesPanel');
        this.nodeProperties = this.panel.querySelector('.node-properties');
        this.edgeProperties = this.panel.querySelector('.edge-properties');
        
        // 初始化面板相关元素
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        // 节点属性相关元素
        this.nodeId = document.getElementById('nodeId');
        this.nodeLabel = document.getElementById('nodeLabel');
        this.nodeType = document.getElementById('nodeType');
        this.nodeUrl = document.getElementById('nodeUrl');
        this.nodeInputs = document.getElementById('nodeInputs');
        this.nodeOutputs = document.getElementById('nodeOutputs');
        
        // 连接线属性相关元素
        this.edgeId = document.getElementById('edgeId');
        this.edgeType = document.getElementById('edgeType');
        this.edgeSource = document.getElementById('edgeSource');
        this.edgeTarget = document.getElementById('edgeTarget');
        // ... 其他属性元素
    }

    // 更新节点属性面板
    updateNodeProperties(node) {
        if (!node) return;
        
        // 更新基本属性
        this.nodeId.value = node.id;
        this.nodeLabel.value = node.label || '';
        this.nodeType.value = node.type || 'resource';
        this.nodeUrl.value = node.url || '';

        // 更新输入节点列表
        this.updateNodeConnections(node);

        this.showNodeProperties();
    }

    // 更新节点的连接信息
    updateNodeConnections(node) {
        if (!node || !node.id) return;
        
        // 清空现有内容
        this.nodeInputs.innerHTML = '';
        this.nodeOutputs.innerHTML = '';

        // 确保 edges 数组存在
        const edges = this.flowChart.edges || [];

        // 获取输入连接（目标节点是当前节点的边）
        const inputEdges = edges.filter(edge => edge.target === node.id);
        inputEdges.forEach(edge => {
            const sourceNode = this.flowChart.getNodeById(edge.source);
            if (sourceNode) {
                const item = this.createConnectionItem(sourceNode, edge.type);
                this.nodeInputs.appendChild(item);
            }
        });

        // 获取输出连接（源节点是当前节点的边）
        const outputEdges = edges.filter(edge => edge.source === node.id);
        outputEdges.forEach(edge => {
            const targetNode = this.flowChart.getNodeById(edge.target);
            if (targetNode) {
                const item = this.createConnectionItem(targetNode, edge.type);
                this.nodeOutputs.appendChild(item);
            }
        });
    }

    // 创建连接项元素
    createConnectionItem(node, type) {
        const item = document.createElement('div');
        item.className = 'connection-item';
        
        // 添加删除按钮
        item.innerHTML = `
            <div class="connection-info">
                <span class="connection-label">${node.label || node.id}</span>
                <span class="connection-type">${type || 'default'}</span>
            </div>
            <button class="delete-connection" title="删除连接">×</button>
        `;
        
        // 点击整个项目时高亮连线
        item.addEventListener('click', () => {
            // 移除所有高亮
            this.flowChart.container.querySelectorAll('.edge').forEach(edge => {
                edge.classList.remove('highlighted');
            });

            // 查找并高亮相关的边
            const edges = this.flowChart.container.querySelectorAll('.edge');
            edges.forEach(edge => {
                const sourceId = edge.getAttribute('data-source');
                const targetId = edge.getAttribute('data-target');
                const currentNodeId = this.flowChart.selectedNode.getAttribute('data-id');
                
                if ((sourceId === currentNodeId && targetId === node.id) ||
                    (targetId === currentNodeId && sourceId === node.id)) {
                    edge.classList.add('highlighted');
                }
            });
        });

        // 删除按钮点击事件
        const deleteBtn = item.querySelector('.delete-connection');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            
            // 找到对应的边
            const currentNodeId = this.flowChart.selectedNode.getAttribute('data-id');
            const edges = this.flowChart.container.querySelectorAll('.edge');
            
            edges.forEach(edge => {
                const sourceId = edge.getAttribute('data-source');
                const targetId = edge.getAttribute('data-target');
                
                if ((sourceId === currentNodeId && targetId === node.id) ||
                    (targetId === currentNodeId && sourceId === node.id)) {
                    // 删除边
                    const edgeId = edge.getAttribute('data-edge-id');
                    this.flowChart.edgeManager.deleteEdge(edgeId);
                    
                    // 更新连接列表
                    this.updateNodeConnections(this.flowChart.selectedNode);
                }
            });
        });
        
        return item;
    }

    // 显示节点属性面板
    showNodeProperties() {
        this.panel.classList.add('show');
        this.nodeProperties.style.display = 'block';
        this.edgeProperties.style.display = 'none';
    }

    // 更新连接线属性面板
    updateEdgeProperties(edge) {
        if (!edge) return;
        
        this.edgeId.value = edge.id;
        this.edgeType.value = edge.type || 'default';
        
        // 获取源节点和目标节点的标签
        const sourceNode = this.flowChart.getNodeById(edge.source);
        const targetNode = this.flowChart.getNodeById(edge.target);
        
        this.edgeSource.value = sourceNode ? (sourceNode.label || sourceNode.id) : edge.source;
        this.edgeTarget.value = targetNode ? (targetNode.label || targetNode.id) : edge.target;

        this.showEdgeProperties();
    }

    // 显示连接线属性面板
    showEdgeProperties() {
        this.panel.classList.add('show');
        this.nodeProperties.style.display = 'none';
        this.edgeProperties.style.display = 'block';
    }

    // 添加 show 方法
    show(target) {
        if (!target) return;
        
        if (target.type === 'node') {
            this.updateNodeProperties(target);
        } else if (target.type === 'edge') {
            this.updateEdgeProperties(target);
        }
    }

    // 添加 hide 方法
    hide() {
        this.panel.classList.remove('show');
        this.nodeProperties.style.display = 'none';
        this.edgeProperties.style.display = 'none';
    }

    // 绑定事件
    bindEvents() {
        // 关闭按钮事件
        const closeButton = this.panel.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            this.hide();
        });

        // 属性值变更事件
        this.nodeLabel.addEventListener('change', () => {
            const selectedNode = this.flowChart.selectedNode;
            if (selectedNode) {
                selectedNode.label = this.nodeLabel.value;
                this.flowChart.updateNode(selectedNode);
            }
        });

        // 节点类型变更事件
        this.nodeType.addEventListener('change', () => {
            const selectedNode = this.flowChart.selectedNode;
            if (selectedNode) {
                selectedNode.type = this.nodeType.value;
                this.flowChart.updateNode(selectedNode);
            }
        });

        // URL变更事件
        this.nodeUrl.addEventListener('change', () => {
            const selectedNode = this.flowChart.selectedNode;
            if (selectedNode) {
                selectedNode.url = this.nodeUrl.value;
                this.flowChart.updateNode(selectedNode);
            }
        });

        // 连接线类型变更事件
        this.edgeType.addEventListener('change', () => {
            const selectedEdge = this.flowChart.selectedEdge;
            if (selectedEdge) {
                selectedEdge.type = this.edgeType.value;
                this.flowChart.updateEdge(selectedEdge);
            }
        });
    }
} 