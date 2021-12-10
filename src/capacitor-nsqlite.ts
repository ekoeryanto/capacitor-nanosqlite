import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { nSQL, nanoSQL, nSQLv1Config } from '@nano-sql/core';
import { nanoSQLMemoryIndex } from '@nano-sql/core/lib/adapters/memoryIndex';
import { SQLiteAbstract } from '@nano-sql/core/lib/adapters/webSQL';
import type {
  InanoSQLTable,
  InanoSQLPlugin,
  InanoSQLInstance,
  SQLiteAbstractFns,
  InanoSQLAdapter,
} from '@nano-sql/core/lib/interfaces';

export { nSQL, nanoSQL, nSQLv1Config };

export class SQLiteCapacitor
  extends nanoSQLMemoryIndex
  implements InanoSQLAdapter {
  plugin: InanoSQLPlugin = {
    name: 'SQLite Capacitor Adapter',
    version: 1.0,
  };

  declare nSQL: InanoSQLInstance;

  private _connection: SQLiteConnection;

  private _db!: SQLiteDBConnection;

  private _ai: { [table: string]: number };

  private _sqlite: SQLiteAbstractFns;

  private _tableConfigs: {
    [tableName: string]: InanoSQLTable;
  };

  constructor() {
    super(false, false);
    this._connection = new SQLiteConnection(CapacitorSQLite);

    this._ai = {};
    this._query = this._query.bind(this);
    this._tableConfigs = {};
    this._sqlite = SQLiteAbstract(this._query, 500);
  }

  connect(id: string, complete: () => void, error: (err: any) => void): void {
    console.log(`nanoSQL "${id}" using SQLite`);
    Promise.all([
      this._connection.checkConnectionsConsistency(),
      this._connection.isConnection(id),
    ])
      .then(async ([consist, connection]) => {
        if (consist.result && connection.result) {
          this._db = await this._connection.retrieveConnection(id);
        } else {
          this._db = await this._connection.createConnection(
            id,
            false,
            'no-encryption',
            1,
          );
        }
        await this._db.open();
        complete();
      })
      .catch(err => {
        error(err);
      });
  }

  createTable(
    tableName: string,
    tableData: InanoSQLTable,
    complete: () => void,
    error: (err: any) => void,
  ): void {
    this._tableConfigs[tableName] = tableData;
    this._sqlite.createTable(tableName, tableData, this._ai, complete, error);
  }

  _query(
    _allowWrite: boolean,
    sql: string,
    args: any[],
    onRow: (row: any, i: number) => void,
    complete: () => void,
    error: (err: any) => void,
  ): void {
    this._db
      .query(sql, args)
      .then(({ values = [] }) => {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < values.length || 0; i++) {
          onRow(values[i], i);
        }
        complete();
      })
      .catch(error);
  }

  dropTable(
    table: string,
    complete: () => void,
    error: (err: any) => void,
  ): void {
    this._sqlite.dropTable(table, complete, error);
  }

  // eslint-disable-next-line class-methods-use-this
  disconnect(complete: () => void /* , _error?: (err: any) => void */): void {
    complete();
  }

  write(
    table: string,
    pk: any,
    row: { [key: string]: any },
    complete: (pkc: any) => void,
    error: (err: any) => void,
  ): void {
    this._sqlite.write(
      this._tableConfigs[table].pkType,
      this._tableConfigs[table].pkCol,
      table,
      pk,
      row,
      this._tableConfigs[table].ai,
      this._ai,
      complete,
      error,
    );
  }

  read(
    table: string,
    pk: any,
    complete: (row: { [key: string]: any } | undefined) => void,
    error: (err: any) => void,
  ): void {
    this._sqlite.read(table, pk, complete, error);
  }

  delete(
    table: string,
    pk: any,
    complete: () => void,
    error: (err: any) => void,
  ): void {
    this._sqlite.remove(table, pk, complete, error);
  }

  readMulti(
    table: string,
    type: 'range' | 'offset' | 'all',
    offsetOrLow: any,
    limitOrHigh: any,
    reverse: boolean,
    onRow: (row: { [key: string]: any }, i: number) => void,
    complete: () => void,
    error: (err: any) => void,
  ): void {
    this._sqlite.readMulti(
      table,
      type,
      offsetOrLow,
      limitOrHigh,
      reverse,
      onRow,
      complete,
      error,
    );
  }

  getTableIndex(
    table: string,
    complete: (index: any[]) => void,
    error: (err: any) => void,
  ): void {
    this._sqlite.getIndex(table, complete, error);
  }

  getTableIndexLength(
    table: string,
    complete: (length: number) => void,
    error: (err: any) => void,
  ): void {
    this._sqlite.getNumberOfRecords(table, complete, error);
  }
}

if (typeof window !== 'undefined') {
  (window as any).nSQL = nSQL;
  (window as any).nanoSQL = nanoSQL;
  (window as any).nSQLv1Config = nSQLv1Config;
}

export function getMode(): string | InanoSQLAdapter {
  let adapter: string | InanoSQLAdapter = 'PERM';
  if (
    Capacitor.isPluginAvailable('CapacitorSQLite') &&
    Capacitor.isNativePlatform()
  ) {
    console.log('CapacitorSQLite available and enabled');
    adapter = new SQLiteCapacitor();
  }

  return adapter;
}
