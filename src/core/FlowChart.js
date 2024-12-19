import { CONFIG } from '../config/constants.js';
import { ICONS } from '../config/icons.js';
import { NodeManager } from './NodeManager.js';
import { EdgeManager } from './EdgeManager.js';
import { DragManager } from './DragManager.js';
import { LayoutManager } from './LayoutManager.js';

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

        /** @type {HTMLElement} 容器元素 */
        this.container = container;
        
        /** @type {NodeManager} 节点管理器 */
        this.nodeManager = new NodeManager(this);
        
        /** @type {EdgeManager} 边缘管理器 */
        this.edgeManager = new EdgeManager(this);
        
        /** @type {DragManager} 拖拽管理器 */
        this.dragManager = new DragManager(this);
        
        /** @type {LayoutManager} 布局管理器 */
        this.layoutManager = new LayoutManager(this);
        
        // 初始化各个功能
        this.initCanvasAreas();
        this.initEventListeners();
        this.initResourceInput();
        this.initModal();
        this.initApiList();
        
        // 添加节点移动事件监听
        this.container.addEventListener('node-moved', (e) => {
            this.handleNodeMove(e.detail);
        });
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

    // ... 其他核心方法
} 