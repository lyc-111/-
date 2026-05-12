/**
 * 可视化模块
 * 使用ECharts绘制图表
 */

let resourceChart = null;

/**
 * 初始化图表
 */
function initCharts() {
    resourceChart = echarts.init(document.getElementById('resource-chart'));
    updateResourceChart();
}

/**
 * 更新资源使用图表
 */
function updateResourceChart() {
    if (!resourceChart) return;
    
    const categories = physicalMachines.map(pm => pm.id);
    const cpuData = physicalMachines.map(pm => ({
        value: pm.cpu.used,
        itemStyle: { color: pm.cpu.used / pm.cpu.total > 0.8 ? '#dc3545' : '#667eea' }
    }));
    const memData = physicalMachines.map(pm => pm.memory.used);
    
    const option = {
        title: {
            text: '物理机资源使用情况',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        legend: {
            data: ['CPU使用(核)', '内存使用(GB)'],
            bottom: 0
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: categories
        },
        yAxis: {
            type: 'value',
            name: '资源量'
        },
        series: [
            {
                name: 'CPU使用(核)',
                type: 'bar',
                data: cpuData,
                markLine: {
                    data: physicalMachines.map(pm => ({
                        xAxis: pm.id,
                        yAxis: pm.cpu.total,
                        label: { formatter: 'CPU上限: {c}' }
                    }))
                }
            },
            {
                name: '内存使用(GB)',
                type: 'bar',
                data: memData
            }
        ]
    };
    
    resourceChart.setOption(option);
}

/**
 * 更新任务队列显示
 */
function updateTaskQueue() {
    const container = document.getElementById('task-queue');
    
    let html = '<h3>等待中</h3>';
    taskQueue.forEach(task => {
        html += `<div class="task-item pending">${task.name} (CPU:${task.cpuReq}, 内存:${task.memReq}GB)</div>`;
    });
    
    html += '<h3>运行中</h3>';
    runningTasks.forEach(task => {
        html += `<div class="task-item running">${task.name} → ${task.assignedMachine}</div>`;
    });
    
    container.innerHTML = html;
}

/**
 * 更新统计面板
 */
function updateStats() {
    if (stats.measurementCount === 0) return;
    
    const avgCpu = (stats.totalCpuUsage / stats.measurementCount * 100).toFixed(1);
    const avgMem = (stats.totalMemUsage / stats.measurementCount * 100).toFixed(1);
    const avgWait = stats.completedCount > 0 ? (stats.totalWaitTime / stats.completedCount).toFixed(1) : 0;
    
    document.getElementById('cpu-usage').textContent = avgCpu + '%';
    document.getElementById('mem-usage').textContent = avgMem + '%';
    document.getElementById('avg-wait').textContent = avgWait + 's';
    document.getElementById('throughput').textContent = stats.completedCount;
}
