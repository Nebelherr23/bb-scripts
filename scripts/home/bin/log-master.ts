import { LogLevel, coloredLogLevel } from '@/lib/logging';

export async function main(ns:NS) {
    ns.tail();
    ns.disableLog('ALL');
    const port = ns.getPortHandle(ns.pid);
    ns.printf(`PID: ${ns.pid}`);
    ns.write('/tmp/log-master.txt',String(ns.pid),"w");
    port.clear();
    let running = true;
    function cleanup() {
        ns.tprintf('Logger died!');
        port.write("");
        port.clear();
        ns.rm('/tmp/log-master.pid',"home");
        running = false;
    }
    ns.atExit(cleanup);
    while (running) {
        if (port.empty()) await port.nextWrite();
        let logEvent:any = JSON.parse(port.read());
        ns.printf(JSON.stringify(logEvent));
        ns.tprintf(`[${logEvent.mod}:${coloredLogLevel(logEvent.level)}] ${logEvent.msg}`);
    }
}
