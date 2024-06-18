import { Server } from 'NetscriptDefinitions';
import { LogLevel, Logger, getLogger } from '@/lib/logging';

export class NetworkNode {
    parent: string;
    hostname: string;
    corp: string;
    isRooted: boolean;
    hasBackdoor: boolean;
    portsRequired: number;
    portsOpen: string[];
    hackRequired: number;

    constructor(server: Server) {
        this.hostname = server.hostname;
        this.hasBackdoor = server.backdoorInstalled == undefined ? false : server.backdoorInstalled;
        this.corp = server.organizationName == undefined ? "" : server.organizationName;
        this.portsRequired = server.numOpenPortsRequired == undefined ? 0 : server.numOpenPortsRequired;
        this.portsOpen = [];
        this.hackRequired = server.requiredHackingSkill == undefined ? 0 : server.requiredHackingSkill;
        this.isRooted = server.hasAdminRights;
    }

    canBeNuked(): boolean {
        if (this.isRooted) { return false; }
        return this.portsOpen.length >= this.portsRequired!;
    }

    exploitServer(ns: NS): boolean {
        try {
            ns.brutessh(this.hostname);
            this.portsOpen.push('ssh');
        } catch { }
        try {
            ns.ftpcrack(this.hostname);
            this.portsOpen.push('ftp');
        } catch { }
        try {
            ns.relaysmtp(this.hostname)
            this.portsOpen.push('smtp');
        } catch { }
        try {
            ns.httpworm(this.hostname);
            this.portsOpen.push('http');
        } catch { }
        try {
            ns.sqlinject(this.hostname);
            this.portsOpen.push('sql');
        } catch { }
        if (this.canBeNuked() && !this.isRooted) {
            ns.nuke(this.hostname);
            return true;
        }
        return false;
    }

    toJson(): string {
        return JSON.stringify(this);
    }
}

export class Network {
    servers: Map<string, NetworkNode> = new Map<string, NetworkNode>();
    last_updated: number;
    logger: Logger;

    constructor(ns: NS) {
        this.logger = getLogger(ns, 'NET', LogLevel.DEBUG);
    }

    /**
     * Looks up a Network Node by hostname
     * @param hostname the server name that should be looked up
     * @returns NetworkNode|boolean Returns the Network Node if existing or false
     */
    findServer(hostname: string): NetworkNode {
        return this.servers.get(hostname);
    }

    addServer(server: NetworkNode) {
        let host = server.hostname
        if (!this.servers.has(host)) {
            this.servers.set(host, server);
            this.logger.info('NEW', `Discovered: ${server.hostname} (Parent: ${server.parent})`);
        }
    }

    /**
     * Returns the parent Network Node of the target 
     * @param hostname hostname of the child server
     */
    getParentServer(hostname: string): NetworkNode {
        let child:NetworkNode = this.findServer(hostname);
        if (child) { return this.findServer(child.parent); }
    }
}