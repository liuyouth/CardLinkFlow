import { CONFIG } from '../config/constants.js';

/**
 * 拖拽管理器类
 * 负责节点的拖拽交互
 * @class DragManager
 */
export class DragManager {
    /**
     * 创建拖拽管理器实例
     * @param {FlowChart} flowChart - 流程图实例的引用
     */
    constructor(flowChart) {
        /** @type {FlowChart} 流程图实例 */
        this.flowChart = flowChart;
    }

    /**
     * 设置节点的拖拽功能
     * @param {HTMLElement} node - 节点DOM元素
     * @param {Object} nodeData - 节点数据
     */
    setupNodeDrag(node, nodeData) {
        let dragState = {
            isDragging: false,
            startX: 0,
            startY: 0,
            initialX: 0,
            initialY: 0
        };

        const handlers = this.createDragHandlers(node, nodeData, dragState);
        this.bindDragEvents(node, handlers);
        this.setupNodeHoverEffects(node);
    }

    /**
     * 创建拖拽事件处理函数
     * @param {HTMLElement} node - 节点DOM元素
     * @param {Object} nodeData - 节点数据
     * @param {Object} dragState - 拖拽状态
     * @returns {Object} 事件处理函数集合
     */
    createDragHandlers(node, nodeData, dragState) {
        return {
            onMouseDown: (e) => {
                if (e.button !== 0) return; // 只响应左键
                
                dragState.isDragging = true;
                dragState.initialX = node.offsetLeft;
                dragState.initialY = node.offsetTop;
                dragState.startX = e.clientX;
                dragState.startY = e.clientY;
                
                this.setDragStartState(node);
            },

            onMouseMove: (e) => {
                if (!dragState.isDragging) return;
                
                e.preventDefault();
                this.updateNodePosition(node, nodeData, e, dragState);
                this.flowChart.edgeManager.updateEdgesWithAnimation();
            },

            onMouseUp: () => {
                if (!dragState.isDragging) return;
                
                this.setDragEndState(node);
                dragState.isDragging = false;
                this.flowChart.layoutManager.calculateOptimalLayout();
            }
        };
    }

    /**
     * 绑定拖拽事件
     * @param {HTMLElement} node - 节点DOM元素
     * @param {Object} handlers - 事件处理函数集合
     */
    bindDragEvents(node, handlers) {
        node.addEventListener('mousedown', handlers.onMouseDown);
        document.addEventListener('mousemove', handlers.onMouseMove);
        document.addEventListener('mouseup', handlers.onMouseUp);
    }

    /**
     * 设置拖拽开始状态
     * @param {HTMLElement} node - 节点DOM元素
     */
    setDragStartState(node) {
        node.style.zIndex = '1000';
        node.style.cursor = 'grabbing';
        node.style.transition = 'none';
        node.classList.add('dragging');
    }

    /**
     * 设置拖拽结束状态
     * @param {HTMLElement} node - 节点DOM元素
     */
    setDragEndState(node) {
        node.style.zIndex = '';
        node.style.cursor = 'grab';
        node.style.transition = 'all 0.2s ease';
        node.classList.remove('dragging');
    }

    /**
     * 更新节点位置
     * @param {HTMLElement} node - 节点DOM元素
     * @param {Object} nodeData - 节点数据
     * @param {MouseEvent} event - 鼠标事件
     * @param {Object} dragState - 拖拽状态
     */
    updateNodePosition(node, nodeData, event, dragState) {
        const dx = event.clientX - dragState.startX;
        const dy = event.clientY - dragState.startY;
        
        const newX = dragState.initialX + dx;
        const newY = dragState.initialY + dy;
        
        node.style.left = `${newX}px`;
        node.style.top = `${newY}px`;
        
        nodeData.position = { x: newX, y: newY };
    }

    /**
     * 设置节点悬停效果
     * @param {HTMLElement} node - 节点DOM元素
     */
    setupNodeHoverEffects(node) {
        node.style.cursor = 'grab';
        
        node.addEventListener('mouseenter', () => {
            if (!node.classList.contains('dragging')) {
                node.style.boxShadow = '0 0 0 1px rgba(82, 255, 168, 0.5)';
            }
        });
        
        node.addEventListener('mouseleave', () => {
            if (!node.classList.contains('dragging')) {
                node.style.boxShadow = 'none';
            }
        });
    }
} 