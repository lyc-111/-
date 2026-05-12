/**
 * 系统配置
 * 全局常量和默认配置
 */

const CONFIG = {
    // 默认物理机配置
    DEFAULT_PM: {
        cpu: 16,      // 总CPU核数
        memory: 64,   // 总内存GB
    },
    
    // 模拟速度（1秒真实时间 = X秒模拟时间）
    SIMULATION_SPEED: 10,
    
    // 最大日志条数
    MAX_LOGS: 100,
    
    // 调度算法类型
    ALGORITHMS: {
        FCFS: 'fcfs',      // 先来先服务
        SJF: 'sjf',        // 最短作业优先
        BEST_FIT: 'best-fit', // 最佳适应
    }
};

// 物理机状态
let physicalMachines = [];
let taskQueue = [];
let runningTasks = [];
let completedTasks = [];
let simulationInterval = null;
let isRunning = false;

// 性能统计
let stats = {
    totalCpuUsage: 0,
    totalMemUsage: 0,
    measurementCount: 0,
    totalWaitTime: 0,
    completedCount: 0
};
