import { FlowChart } from './core/FlowChart.js';
import { DragHandler } from './drag-handler.js';

/**
 * 将 FlowChart 类导出到全局作用域
 * 使其可以通过 window.FlowChart 访问
 */
window.FlowChart = FlowChart;

// 添加全局图片预览函数
window.showModal = (imageUrl) => {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    if (modal && modalImg) {
        modal.style.display = 'block';
        modalImg.src = imageUrl;
    }
};

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 获取画布容器
    const container = document.getElementById('flow-canvas');
    
    // 初始化拖拽处理器
    new DragHandler(container);
    
    // 初始化流程图
    const flowChart = new FlowChart(container);
    
    // 设置右键菜单
    container.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const menu = document.querySelector('.context-menu');
        menu.style.display = 'block';
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
    });

    // 点击其他区域关闭右键菜单
    document.addEventListener('click', () => {
        document.querySelector('.context-menu').style.display = 'none';
    });
}); 