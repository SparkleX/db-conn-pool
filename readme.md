# Generic Pool Support for [db-conn](https://www.npmjs.com/package/db-conn)

Example

```
const dbConfig = {

}
const poolConfig: any = {
    min: 2,
    max: 5
}
const driver = new XXXDriver();
const pool: DataSource = new GenericPool(driver, dbConfig, poolConfig);
const conn1 = await pool.getConnection();
const conn2 = await pool.getConnection();
await conn1.close();
await conn2.close();
await pool.close();
```

---


