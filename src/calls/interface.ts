export interface Call {
  type?:
    | "CALL"
    | "CALLCODE"
    | "STATICCALL"
    | "DELEGATECALL"
    | "CREATE"
    | "CREATE2"
    | "SELFDESTRUCT";
  from?: string;
  to?: string;
  value?: string;
  gas?: string;
  gasUsed?: string;
  input?: string;
  output?: string;
  time?: string;
  error?: string;
  calls?: Call[];
  _gasIn?: string;
  _gasCost?: string;
  _outOff?: string;
  _outLen?: string;
}

export interface StructLog {
  depth: number;
  error: string;
  gas: number;
  gasCost: number;
  memory: string[];
  op: string;
  pc: number;
  stack: string[];
  storage: {};
}
