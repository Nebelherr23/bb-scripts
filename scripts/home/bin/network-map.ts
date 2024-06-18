import { Network, NetworkNode } from "@/lib/networks";
import { getLogger, LogRecord, LogLevel, Logger } from "@/lib/logging";

export async function main(ns: NS) {
    ns.tail();
    ns.disableLog('ALL');
    ns.printf(ns.read('/tmp/log-master.txt'));
    let logger: Logger = getLogger(ns, "NET-MAP", LogLevel.DEBUG);
    let to_scan: string[] = ["home"];
    let network: Network = new Network(ns);
    let looper: number = 99;
    let ignored: string[] = ["home", "darkweb", "hades-"]

    ns.atExit(() => {
        let nodes:NetworkNode[] = [];
        for (const node of network.servers.values()){
            nodes.push(node);
        }
        ns.write("/data/network.json",JSON.stringify(nodes),"w")
    });
    while (to_scan.length > 0 && looper-- > 0) {
        let parent = to_scan.pop();
        for (const server of ns.scan(parent)) {
            ns.printf(`Scanning ${server}`);
            if (network.findServer(server) == undefined) {
                to_scan.push(server);
            }
            if (!(ignored.filter((_) => { _.includes(server) }).length > 0)) {
                let node = new NetworkNode(ns.getServer(server));
                node.parent = parent;
                let rooted = node.exploitServer(ns);
                if (rooted) {
                    node.isRooted = true;
                    logger.info('root-success', "", { server: node.hostname });
                }
                network.addServer(node);
            }
        }
    }
}