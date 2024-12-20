import { FlowChart } from './core/FlowChart.js';

document.addEventListener('DOMContentLoaded', () => {
    // 获取画布容器
    const container = document.getElementById('flow-canvas');
    
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

    // 添加全局图片预览函数
    window.showModal = (imageUrl) => {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        if (modal && modalImg) {
            modal.style.display = 'block';
            modalImg.src = imageUrl;
        }
    };
}); 