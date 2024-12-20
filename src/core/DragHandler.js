export class DragHandler {
    constructor(flowChart) {
        this.flowChart = flowChart;
        this.container = flowChart.container;
        this.dragState = {
            isDragging: false,
            currentNode: null,
            startX: 0,
            startY: 0,
            originalX: 0,
            originalY: 0
        };
        
        this.init();
    }

    init() {
        this.container.addEventListener('mousedown', (e) => {
            // 如果是连接点或者正在连线，不处理拖拽
            if (e.target.closest('.node-port') || 
                this.flowChart.connectionState.isConnecting) {
                return;
            }
            
            const node = e.target.closest('.flow-node');
            if (!node) return;
            
            this.startDrag(e, node);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.dragState.isDragging && !this.flowChart.connectionState.isConnecting) {
                this.onDrag(e);
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.dragState.isDragging) {
                this.endDrag();
            }
        });
    }

    startDrag(e, node) {
        e.preventDefault();
        
        this.dragState = {
            isDragging: true,
            currentNode: node,
            startX: e.clientX,
            startY: e.clientY,
            originalX: node.offsetLeft,
            originalY: node.offsetTop
        };

        node.classList.add('dragging');
    }

    onDrag(e) {
        const { currentNode, startX, startY, originalX, originalY } = this.dragState;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        currentNode.style.left = `${originalX + dx}px`;
        currentNode.style.top = `${originalY + dy}px`;

        // 通知位置更新
        this.flowChart.handleNodeMove({
            node: currentNode,
            position: {
                x: originalX + dx,
                y: originalY + dy
            }
        });
    }

    endDrag() {
        this.dragState.currentNode.classList.remove('dragging');
        this.dragState = {
            isDragging: false,
            currentNode: null,
            startX: 0,
            startY: 0,
            originalX: 0,
            originalY: 0
        };
    }
} 