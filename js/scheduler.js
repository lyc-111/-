/**
 * 调度器核心模块
 * 实现各种调度算法
 */

class Scheduler {
    constructor(algorithm = 'fcfs') {
        this.algorithm = algorithm;
    }

    /**
     * 选择调度算法并执行
     */
    schedule(tasks, machines) {
        switch(this.algorithm) {
            case 'fcfs':
                return this.fcfs(tasks, machines);
            case 'sjf':
                return this.sjf(tasks, machines);
            case 'best-fit':
                return this.bestFit(tasks, machines);
            default:
                return this.fcfs(tasks, machines);
        }
    }

    /**
     * 先来先服务算法 (FCFS)
     * 按任务提交顺序分配资源
     */
    fcfs(tasks, machines) {
    const allocations = [];
    const remainingTasks = [];
    
    for (let task of tasks) {
        // 按空闲资源排序，找最空闲的
        const sortedMachines = [...machines].sort((a, b) => {
            const aFree = (a.cpu.total - a.cpu.used) + (a.memory.total - a.memory.used);
            const bFree = (b.cpu.total - b.cpu.used) + (b.memory.total - b.memory.used);
            return bFree - aFree;  // 空闲多的排在前面
        });
        
        let allocated = false;
        
        for (let machine of sortedMachines) {
            if (this.canAllocate(task, machine)) {
                this.allocate(task, machine);
                allocations.push({ task, machine });
                allocated = true;
                log(`FCFS: 任务 ${task.name} 分配到 ${machine.id} (最空闲)`, 'success');
                break;
            }
        }
        
        if (!allocated) {
            remainingTasks.push(task);
            log(`FCFS: 任务 ${task.name} 资源不足，进入等待队列`, 'error');
        }
    }
    
    return { allocations, remainingTasks };
}


    /**
     * 最短作业优先 (SJF)
     * 优先分配运行时间短的任务
     */
    sjf(tasks, machines) {
        // 按运行时长排序
        const sortedTasks = [...tasks].sort((a, b) => a.duration - b.duration);
        return this.fcfs(sortedTasks, machines); // 复用FCFS的分配逻辑
    }

    /**
     * 最佳适应算法 (Best Fit)
     * 选择资源最匹配的物理机
     */
    bestFit(tasks, machines) {
        const allocations = [];
        const remainingTasks = [];
        
        for (let task of tasks) {
            let bestMachine = null;
            let minWaste = Infinity;
            
            for (let machine of machines) {
                if (this.canAllocate(task, machine)) {
                    // 计算资源浪费（剩余资源最少）
                    const cpuWaste = machine.cpu.total - machine.cpu.used - task.cpuReq;
                    const memWaste = machine.memory.total - machine.memory.used - task.memReq;
                    const totalWaste = cpuWaste + memWaste;
                    
                    if (totalWaste < minWaste) {
                        minWaste = totalWaste;
                        bestMachine = machine;
                    }
                }
            }
            
            if (bestMachine) {
                this.allocate(task, bestMachine);
                allocations.push({ task, machine: bestMachine });
                log(`Best Fit: 任务 ${task.name} 分配到 ${bestMachine.id} (浪费: ${minWaste})`, 'success');
            } else {
                remainingTasks.push(task);
                log(`Best Fit: 任务 ${task.name} 无合适物理机`, 'error');
            }
        }
        
        return { allocations, remainingTasks };
    }

    /**
     * 检查是否可以分配资源
     */
    canAllocate(task, machine) {
        const cpuAvailable = machine.cpu.total - machine.cpu.used;
        const memAvailable = machine.memory.total - machine.memory.used;
        return cpuAvailable >= task.cpuReq && memAvailable >= task.memReq;
    }

    /**
     * 分配资源
     */
    allocate(task, machine) {
        machine.cpu.used += task.cpuReq;
        machine.memory.used += task.memReq;
        task.status = 'running';
        task.startTime = Date.now();
        task.assignedMachine = machine.id;
        runningTasks.push(task);
    }

    /**
     * 释放资源
     */
    release(task) {
        const machine = physicalMachines.find(m => m.id === task.assignedMachine);
        if (machine) {
            machine.cpu.used -= task.cpuReq;
            machine.memory.used -= task.memReq;
            task.status = 'completed';
            task.endTime = Date.now();
            
            // 更新统计
            stats.completedCount++;
            stats.totalWaitTime += (task.startTime - task.submitTime) / 1000;
            
            log(`任务 ${task.name} 完成，释放 ${machine.id} 资源`, 'info');
        }
    }
}
