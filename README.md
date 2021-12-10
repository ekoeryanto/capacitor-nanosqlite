# capacitor-nanosqlite

Nano SQL Capacitor SQLite adapter

## Install

```bash
# npm install @capacitor-community/sqlite
# npm install @nano-sql/core
# npx cap sync
npm install capacitor-nanosqlite
```

## Usage
```ts
import { getMode } from 'capacitor-nanosqlite'

nSQL().createDatabase({
    id: 'namina',
    version: 2,
    mode: getMode(),
    // see nanosql.io for more detail
 })
```