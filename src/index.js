import { FlowChart } from './core/FlowChart.js';

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

// 初始化流程图
window.addEventListener('load', () => {
    const canvas = document.getElementById('flow-canvas');
    const flowChart = new FlowChart(canvas);
    
    // 设置右键菜单
    canvas.addEventListener('contextmenu', (e) => {
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