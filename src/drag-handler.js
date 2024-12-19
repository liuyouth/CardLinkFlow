export class DragHandler {
    constructor(container) {
        this.container = container;
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
        // 监听容器内的鼠标按下事件
        this.container.addEventListener('mousedown', (e) => {
            // 如果点击的是连接点或者其父元素是连接点，不启动拖动
            if (e.target.classList.contains('node-port') || 
                e.target.closest('.node-port')) {
                return;
            }
            
            const node = e.target.closest('.flow-node');
            if (!node) return;
            
            this.startDrag(e, node);
        });

        // 监听全局的鼠标移动和松开事件
        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('mouseup', () => this.endDrag());
    }

    startDrag(e, node) {
        // 如果节点正在连线状态，不启动拖动
        if (node.classList.contains('connecting')) {
            return;
        }

        e.preventDefault();
        
        // 记录初始状态
        this.dragState = {
            isDragging: true,
            currentNode: node,
            startX: e.clientX,
            startY: e.clientY,
            originalX: node.offsetLeft,
            originalY: node.offsetTop
        };

        // 添加拖动样式
        node.classList.add('dragging');
    }

    onDrag(e) {
        if (!this.dragState.isDragging) return;

        const { currentNode, startX, startY, originalX, originalY } = this.dragState;

        // 计算位移
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // 更新节点位置
        currentNode.style.left = `${originalX + dx}px`;
        currentNode.style.top = `${originalY + dy}px`;

        // 触发自定义事件，通知位置更新
        const event = new CustomEvent('node-moved', {
            detail: {
                node: currentNode,
                position: {
                    x: originalX + dx,
                    y: originalY + dy
                }
            }
        });
        this.container.dispatchEvent(event);
    }

    endDrag() {
        if (!this.dragState.isDragging) return;

        // 移除拖动样式
        this.dragState.currentNode.classList.remove('dragging');
        
        // 触发拖动结束事件
        const event = new CustomEvent('node-drag-end', {
            detail: {
                node: this.dragState.currentNode
            }
        });
        this.container.dispatchEvent(event);

        // 重置拖动状态
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