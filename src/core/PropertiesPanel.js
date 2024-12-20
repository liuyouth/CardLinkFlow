export class PropertiesPanel {
    constructor(flowChart) {
        this.flowChart = flowChart;
        this.panel = document.getElementById('propertiesPanel');
        this.currentTarget = null;
        
        this.initPanelEvents();
    }

    initPanelEvents() {
        // 关闭按钮事件
        const closeBtn = this.panel.querySelector('.close-button');
        closeBtn.addEventListener('click', () => this.hide());

        // 节点属性变更事件
        const nodeInputs = this.panel.querySelectorAll('.node-properties .property-input');
        nodeInputs.forEach(input => {
            input.addEventListener('change', (e) => this.handleNodePropertyChange(e));
        });

        // 连接线属性变更事件
        const edgeInputs = this.panel.querySelectorAll('.edge-properties .property-input');
        edgeInputs.forEach(input => {
            input.addEventListener('change', (e) => this.handleEdgePropertyChange(e));
        });
    }

    show(target) {
        this.currentTarget = target;
        this.panel.classList.add('show');
        
        if (target.classList.contains('flow-node')) {
            this.showNodeProperties(target);
        } else if (target.classList.contains('edge')) {
            this.showEdgeProperties(target);
        }
    }

    hide() {
        this.panel.classList.remove('show');
        this.currentTarget = null;
    }

    showNodeProperties(node) {
        // 显示节点属性区域
        this.panel.querySelector('.node-properties').style.display = 'block';
        this.panel.querySelector('.edge-properties').style.display = 'none';

        // 填充节点属性
        document.getElementById('nodeLabel').value = node.querySelector('.node-label').textContent;
        document.getElementById('nodeType').value = node.dataset.type;
        document.getElementById('nodeUrl').value = node.dataset.url || '';
    }

    showEdgeProperties(edge) {
        // 显示连接线属性区域
        this.panel.querySelector('.node-properties').style.display = 'none';
        this.panel.querySelector('.edge-properties').style.display = 'block';

        // 填充连接线属性
        document.getElementById('edgeType').value = edge.dataset.type || 'default';
        document.getElementById('edgeSpeed').value = edge.dataset.speed || '30';
        document.getElementById('edgeColor').value = edge.dataset.color || '#ffffff';
    }

    handleNodePropertyChange(e) {
        if (!this.currentTarget) return;

        const node = this.currentTarget;
        switch (e.target.id) {
            case 'nodeLabel':
                node.querySelector('.node-label').textContent = e.target.value;
                break;
            case 'nodeType':
                node.dataset.type = e.target.value;
                break;
            case 'nodeUrl':
                node.dataset.url = e.target.value;
                if (node.querySelector('img')) {
                    node.querySelector('img').src = e.target.value;
                }
                break;
        }
    }

    handleEdgePropertyChange(e) {
        if (!this.currentTarget) return;

        const edge = this.currentTarget;
        const path = edge.querySelector('path');
        
        switch (e.target.id) {
            case 'edgeType':
                edge.dataset.type = e.target.value;
                break;
            case 'edgeSpeed':
                edge.style.setProperty('--flow-speed', `${e.target.value}s`);
                break;
            case 'edgeColor':
                path.style.stroke = e.target.value;
                edge.dataset.color = e.target.value;
                break;
        }
    }
} 