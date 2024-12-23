/**
 * 全局配置常量
 * @constant {Object} CONFIG
 */
export const CONFIG = {
    /** 动画持续时间(毫秒) */
    ANIMATION_DURATION: 300,
    
    /** 节点之间的垂直间距 */
    NODE_SPACING: 150,
    
    /** 布局相关的区域配置 */
    AREAS: {
        /** 左侧边距 */
        LEFT_MARGIN: 50,
        /** 顶部边距 */
        TOP_MARGIN: 50,
        /** 模型节点宽度 */
        MODEL_WIDTH: 300,
        /** 区域之间的水平间距 */
        SPACING: 400
    },
    
    /** 节点类型枚举 */
    NODE_TYPES: {
        /** 资源节点类型 */
        RESOURCE: 'resource',
        /** AI模型节点类型 */
        AI_MODEL: 'ai-model',
        /** 结果节点类型 */
        RESULT: 'result'
    },
    
    /** 节点尺寸 */
    NODE_WIDTH: 200,
    NODE_HEIGHT: 80
}; 