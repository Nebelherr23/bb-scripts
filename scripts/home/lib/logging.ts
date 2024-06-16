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
    log(level: LogLevel, record: BaseLogRecord) {
        if (this.min_level <= level) {
            const out = {
                mod: this.mod,          /* Module appearing in the rendered log message */
                level: LogLevel[level],           /* Level with which we're emitting the message */
                event: record.event,    /* Event the record has been emitted for */
                msg: record.msg,        /* Additional message to emit */
                extra: record.extra     /* Extra data the record ships */
            }
            this.rawRecord = JSON.stringify(out);
            this.port.write(this.rawRecord);
        }
    }

    /**
     * Convenience methods for emitting records with a specific log level
     */
    debug(record:BaseLogRecord) { this.log(LogLevel.DEBUG,record); }
    info(record:BaseLogRecord) { this.log(LogLevel.INFO,record); }
    warning(record:BaseLogRecord){ this.log(LogLevel.WARNING,record); }
    error(record:BaseLogRecord) { this.log(LogLevel.ERROR,record); }
    critical(record:BaseLogRecord) { this.log(LogLevel.CRITICAL,record); }

}
export function getLoggerPort(ns:NS):NetscriptPort {
    return ns.getPortHandle(Number(ns.read('/tmp/log-master.txt')));
}

export abstract class BaseLogRecord {
    event: string
    msg: string
    extra: any
    level:LogLevel

    constructor(level: LogLevel, event: string, extra: any) {
        this.event = event;
        this.extra = extra;
        this.msg = "Undefined msg"
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
    let port:NetscriptPort = ns.getPortHandle(Number(ns.read('/tmp/log-master.pid')));
    return new Logger(mod,level,port);
}

export function coloredLogLevel(level:LogLevel|string):string {
    switch (level) {
        case LogLevel.DEBUG:
            return `${Fonts.BLUE}DBG${Fonts.RESET}`;
        case LogLevel.INFO:
            return `${Fonts.GREEN}INF${Fonts.RESET}`;
        case LogLevel.WARNING:
            return `${Fonts.YELLOW}WRN${Fonts.RESET}`;
        case LogLevel.ERROR:
            return `${Fonts.RED}ERR${Fonts.RESET}`;
        case LogLevel.CRITICAL:
            return `${Fonts.PURPLE}CRT${Fonts.RESET}`;
    }
}