// 常量配置
const CONFIG = {
    ANIMATION_DURATION: 300,
    NODE_SPACING: 150,
    AREAS: {
        LEFT_MARGIN: 100,
        MODEL_WIDTH: 200,
        SPACING: 300
    },
    NODE_TYPES: {
        RESOURCE: 'resource',
        AI_MODEL: 'ai-model',
        RESULT: 'result'
    }
};

class FlowChart {
    constructor(container) {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;
        this.nodes = new Map();
        this.edges = new Map();
        this.selectedNode = null;
        this.scale = 1;
        
        // 初始化画布区域
        this.initCanvasAreas();
        
        // 初始化各个功能
        this.initEventListeners();
        this.initResourceInput();
        this.initModal();
        this.initApiList();
    }

    // 初始化画布区域
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

    // 节点拖拽相关
    setupNodeDrag(node, nodeData) {
        let dragState = {
            isDragging: false,
            startX: 0,
            startY: 0,
            initialX: 0,
            initialY: 0
        };

        const handlers = {
            onMouseDown: (e) => {
                if (e.button !== 0) return; // 只响应左键
                
                dragState = {
                    isDragging: true,
                    initialX: node.offsetLeft,
                    initialY: node.offsetTop,
                    startX: e.clientX,
                    startY: e.clientY
                };
                
                this.setDragStartState(node);
            },

            onMouseMove: (e) => {
                if (!dragState.isDragging) return;
                
                e.preventDefault();
                this.updateNodePosition(node, nodeData, e, dragState);
                this.updateEdgesWithAnimation();
            },

            onMouseUp: () => {
                if (!dragState.isDragging) return;
                
                this.setDragEndState(node);
                dragState.isDragging = false;
                this.calculateOptimalLayout();
            }
        };

        // 添加事件监听
        node.addEventListener('mousedown', handlers.onMouseDown);
        document.addEventListener('mousemove', handlers.onMouseMove);
        document.addEventListener('mouseup', handlers.onMouseUp);

        // 添加hover效果
        this.setupNodeHoverEffects(node);
    }

    setDragStartState(node) {
        node.style.zIndex = '1000';
        node.style.cursor = 'grabbing';
        node.style.transition = 'none';
    }

    setDragEndState(node) {
        node.style.zIndex = '';
        node.style.cursor = 'grab';
        node.style.transition = `box-shadow 0.2s ease`;
    }

    updateNodePosition(node, nodeData, event, dragState) {
        const dx = event.clientX - dragState.startX;
        const dy = event.clientY - dragState.startY;
        
        const newX = dragState.initialX + dx;
        const newY = dragState.initialY + dy;
        
        node.style.left = `${newX}px`;
        node.style.top = `${newY}px`;
        
        nodeData.position = { x: newX, y: newY };
    }

    setupNodeHoverEffects(node) {
        node.style.cursor = 'grab';
        
        node.addEventListener('mouseenter', () => {
            node.style.boxShadow = '0 0 0 1px rgba(82, 255, 168, 0.5)';
        });
        
        node.addEventListener('mouseleave', () => {
            if (!node.classList.contains('dragging')) {
                node.style.boxShadow = 'none';
            }
        });
    }

    // 边缘渲染相关
    renderEdge(edgeData) {
        try {
            const sourceNode = this.nodes.get(edgeData.source);
            const targetNode = this.nodes.get(edgeData.target);
            
            if (!sourceNode || !targetNode) {
                console.warn(`Invalid edge: missing ${!sourceNode ? 'source' : 'target'} node`);
                return;
            }

            const svg = this.createEdgeSVG(edgeData);
            const path = this.createEdgePath(sourceNode.position, targetNode.position, edgeData.type);
            
            svg.appendChild(path);
            this.container.appendChild(svg);
        } catch (error) {
            console.error('Error rendering edge:', error);
        }
    }

    createEdgeSVG(edgeData) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('edge');
        svg.dataset.type = edgeData.type;
        svg.dataset.edgeId = edgeData.id;
        return svg;
    }

    createEdgePath(source, target, edgeType) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.style.transition = `d ${CONFIG.ANIMATION_DURATION}ms ease`;
        
        const d = this.calculateEdgePath(source, target, edgeType);
        path.setAttribute('d', d);
        
        return path;
    }

    // 节点创建相关
    async createResourceNode(url) {
        try {
            if (!url) throw new Error('Resource URL is required');

            const position = this.calculateResourceNodePosition();
            const nodeData = this.createResourceNodeData(url, position);
            
            this.addNode(nodeData);
            await this.connectToModelNodes(nodeData);
            this.calculateOptimalLayout();
            
        } catch (error) {
            console.error('Error creating resource node:', error);
            // 这里可以添加用户提示
        }
    }

    calculateResourceNodePosition() {
        const resourceNodes = Array.from(this.nodes.values())
            .filter(node => node.type === CONFIG.NODE_TYPES.RESOURCE);
        
        return {
            x: this.areas.resource.x,
            y: resourceNodes.length === 0 ? 
                this.areas.resource.y : 
                resourceNodes[resourceNodes.length - 1].position.y + CONFIG.NODE_SPACING
        };
    }

    // ... 其他方法保持不变 ...
}

// 添加导出
window.FlowChart = FlowChart; 