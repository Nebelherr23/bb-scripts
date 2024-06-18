import { NetscriptPort } from "NetscriptDefinitions";
import { Colors as Fonts} from '@/lib/utils';

export enum LogLevel {
    /* Constants defining the logging levels */
    DEBUG = 0,
    INFO = 10,
    WARNING = 20,
    ERROR = 30,
    CRITICAL = 40
}

export class Logger {
    /**
     * Class that serves as a logging handler in a specific script
     * Params:
     * min_level:LogLevel - The minimum level at which the log record should be emitted to the main logging process
     * mod:string - A string representing the module emitting the log
     * port:NetscriptPort - The port which the main process listens on
     */
    min_level: LogLevel = LogLevel.INFO;
    mod: string;
    port: NetscriptPort
    rawRecord:any
    constructor(mod: string, level: LogLevel, port: NetscriptPort) {
        this.port = port;
        this.mod = mod;
        this.min_level = level;
    }
    /** 
     * Emits the LogRecord to the main logging script
     */
    log(level: string,event:string="",msg:string="",extra:any={}) {
        if (this.min_level <= LogLevel[level]) {
            const out = {
                mod: this.mod,           /* Module appearing in the rendered log message */
                level: LogLevel[level],  /* Level with which we're emitting the message */
                event: event,            /* Event the record has been emitted for */
                msg: msg,                /* Additional message to emit */
                extra: extra             /* Extra data the record ships */
            }
            this.rawRecord = JSON.stringify(out);
            this.port.write(this.rawRecord);
        }
    }

    /**
     * Convenience methods for emitting records with a specific log level
     */
    debug(event:string="",msg:string="",extra:any={}) { this.log('DEBUG',event,msg,extra); }
    info(event:string="",msg:string="",extra:any={}) { this.log('INFO',event,msg,extra); }
    warning(event:string,msg:string,extra:any){ this.log('WARNING',event,msg,extra); }
    error(event:string,msg:string,extra:any) { this.log('ERROR',event,msg,extra); }
    critical(event:string,msg:string,extra:any) { this.log('CRITICAL',event,msg,extra); }
}
export function getLoggerPort(ns:NS):NetscriptPort {
    ns.printf(`Logger PID: ${Number(ns.read('/tmp/log-master.txt'))}`);
    return ns.getPortHandle(Number(ns.read('/tmp/log-master.txt')));
}

export abstract class BaseLogRecord {
    event: string
    msg: string
    extra: any
    level:LogLevel

    constructor(level: LogLevel, event: string, extra: any = {}) {
        this.event = event;
        this.extra = extra;
        this.msg = ""
        this.level = level
    }
}

export class LogRecord extends BaseLogRecord {
    mod:string;
    constructor(mod:string,level:string,event:string,extra:any) {
        super(LogLevel[level],event,extra);
        this.mod = mod;
    }   
}

export function getLogger(ns:NS,mod:string,level:LogLevel):Logger {
    let port:NetscriptPort = ns.getPortHandle(Number(ns.read('/tmp/log-master.txt')));
    return new Logger(mod,level,port);
}

export function coloredLogLevel(level:LogLevel|string):string {
    switch (level) {
        case LogLevel.DEBUG:
        case LogLevel['DEBUG']:
        case "DEBUG":
        case "debug":
            return `${Fonts.BLUE}DBG${Fonts.RESET}`;
        case LogLevel.INFO:
        case LogLevel['INFO']:
        case "INFO":
        case "info":
            return `${Fonts.GREEN}INF${Fonts.RESET}`;
        case LogLevel.WARNING:
        case LogLevel['WARNING']:
        case "WARNING":
        case "warning":
        case "WARN":
        case "warn":
            return `${Fonts.YELLOW}WRN${Fonts.RESET}`;
        case LogLevel.ERROR:
        case LogLevel['ERROR']:
        case "ERROR":
        case "error":
        case "ERR":
        case "err":
            return `${Fonts.RED}ERR${Fonts.RESET}`;
        case LogLevel.CRITICAL:
        case LogLevel['CRITICAL']:
        case "CRITICAL":
        case "critical":
        case "CRT":
        case "crt":
            return `${Fonts.PURPLE}CRT${Fonts.RESET}`;
    }
}