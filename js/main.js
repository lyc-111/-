/**
 * 主程序入口
 * 事件处理和逻辑协调
 */

let scheduler = new Scheduler('fcfs');
let taskIdCounter = 1;

/**
 * 初始化
 */
document.addEventListener('DOMContentLoaded', function() {
    initCharts();
    addPhysicalMachine(); // 默认添加一台物理机
    addPhysicalMachine();
    
    // 绑定表单提交
    document.getElementById('task-form').addEventListener('submit', handleTaskSubmit);
    
    // 绑定算法选择
    document.getElementById('algorithm-select').addEventListener('change', function(e) {
        scheduler = new Scheduler(e.target.value);
        log(`切换调度算法: ${e.target.value}`, 'info');
    });
});

/**
 * 添加物理机
 */
function addPhysicalMachine() {
    const id = `PM-${String(physicalMachines.length + 1).padStart(2, '0')}`;
    const pm = {
        id: id,
        cpu: { total: CONFIG.DEFAULT_PM.cpu, used: 0 },
        memory: { total: CONFIG.DEFAULT_PM.memory, used: 0 },
        status: 'idle'
    };
    physicalMachines.push(pm);
    renderPhysicalMachines();
    updateResourceChart();
    log(`添加物理机: ${id}`, 'info');
}

/**
 * 渲染物理机列表
 */
function renderPhysicalMachines() {
    const container = document.getElementById('pm-list');
    container.innerHTML = physicalMachines.map(pm => {
        const cpuPercent = (pm.cpu.used / pm.cpu.total * 100).toFixed(1);
        const memPercent = (pm.memory.used / pm.memory.total * 100).toFixed(1);
        const isFull = cpuPercent > 90 || memPercent > 90;
        
        return `
            <div class="pm-card ${isFull ? 'full' : (pm.cpu.used > 0 ? 'active' : '')}">
                <h4>${pm.id}</h4>
                <p>CPU: ${pm.cpu.used}/${pm.cpu.total}核 (${cpuPercent}%)</p>
                <p>内存: ${pm.memory.used}/${pm.memory.total}GB (${memPercent}%)</p>
            </div>
        `;
    }).join('');
}

/**
 * 处理任务提交
 */
function handleTaskSubmit(e) {
    e.preventDefault();
    
    const task = {
        id: `Task-${String(taskIdCounter++).padStart(3, '0')}`,
        name: document.getElementById('task-name').value,
        cpuReq: parseInt(document.getElementById('task-cpu').value),
        memReq: parseInt(document.getElementById('task-mem').value),
        duration: parseInt(document.getElementById('task-duration').value),
        priority: parseInt(document.getElementById('task-priority').value),
        submitTime: Date.now(),
        status: 'pending'
    };
    
    taskQueue.push(task);
    log(`提交任务: ${task.name} (CPU:${task.cpuReq}, 内存:${task.memReq}GB, 时长:${task.duration}s)`, 'info');
    updateTaskQueue();
    
    // 如果模拟正在运行，立即尝试调度
    if (isRunning) {
        runSchedule();
    }
    
    // 清空表单
    e.target.reset();
}

/**
 * 开始模拟
 */
function startSimulation() {
    if (isRunning) return;
    
    isRunning = true;
    log('=== 开始资源调度模拟 ===', 'success');
    
    // 立即执行一次调度
    runSchedule();
    
    // 定时调度（每2秒检查一次）
    simulationInterval = setInterval(() => {
        checkCompletedTasks();
        runSchedule();
        updateStats();
    }, 2000);
}

/**
 * 执行调度
 */
function runSchedule() {
    if (taskQueue.length === 0) return;
    
    const result = scheduler.schedule(taskQueue, physicalMachines);
    
    // 更新任务队列
    taskQueue = result.remainingTasks;
    
    // 更新显示
    renderPhysicalMachines();
    updateResourceChart();
    updateTaskQueue();
}

/**
 * 检查完成的任务
 */
function checkCompletedTasks() {
    const now = Date.now();
    const completed = [];
    
    runningTasks = runningTasks.filter(task => {
        const elapsed = (now - task.startTime) / 1000 * CONFIG.SIMULATION_SPEED;
        
        if (elapsed >= task.duration) {
            scheduler.release(task);
            completed.push(task);
            return false;
        }
        return true;
    });
    
    // 更新统计
    if (completed.length > 0) {
        physicalMachines.forEach(pm => {
            stats.totalCpuUsage += pm.cpu.used / pm.cpu.total;
            stats.totalMemUsage += pm.memory.used / pm.memory.total;
        });
        stats.measurementCount++;
        
        renderPhysicalMachines();
        updateResourceChart();
    }
}

/**
 * 重置模拟
 */
function resetSimulation() {
    isRunning = false;
    clearInterval(simulationInterval);
    
    // 重置所有状态
    physicalMachines.forEach(pm => {
        pm.cpu.used = 0;
        pm.memory.used = 0;
    });
    taskQueue = [];
    runningTasks = [];
    completedTasks = [];
    stats = {
        totalCpuUsage: 0,
        totalMemUsage: 0,
        measurementCount: 0,
        totalWaitTime: 0,
        completedCount: 0
    };
    
    renderPhysicalMachines();
    updateResourceChart();
    updateTaskQueue();
    updateStats();
    log('=== 模拟已重置 ===', 'info');
}

/**
 * 添加日志
 */
function log(message, type = 'info') {
    const container = document.getElementById('log-container');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
    
    // 限制日志数量
    while (container.children.length > CONFIG.MAX_LOGS) {
        container.removeChild(container.firstChild);
    }
}
