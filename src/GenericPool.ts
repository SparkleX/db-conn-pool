import { DataSource, Connection, Driver } from "db-conn";
import * as genericPool from "generic-pool";
import { Pool, Factory }  from "generic-pool";
import { GenericPoolConfig } from ".";

class PoolFactory implements Factory<Connection>{
	driverConfig: any;
	driver: Driver
	poolConfig: GenericPoolConfig;
	constructor(driver: Driver, config: any, poolconfig: GenericPoolConfig) {
		this.driver = driver;
		this.driverConfig = config;
		this.poolConfig = poolconfig;
	}
	async create(): Promise<Connection> {
		const rt = await this.driver.connect(this.driverConfig);
		return rt;
	}
	async destroy(client: Connection): Promise<void> {
		await (client as any).__close();
	}
	async validate?(client: Connection): Promise<boolean> {
		try {
			await client.execute(this.poolConfig.testOnBorrowSql as string);
		}catch (err) {
			console.error("Connection validate failed");
			console.error(err);
			return false;
		}
		return true;
	}
}

export class GenericPool implements DataSource {
	pool: Pool<Connection>;
	constructor(driver: Driver, driverConfig: any, poolConfig: GenericPoolConfig) {
		if (poolConfig.testOnBorrow && ! poolConfig.testOnBorrowSql) {
			throw new Error(`testOnBorrowSql required`);
		}
		const factory = new PoolFactory(driver, driverConfig, poolConfig);
		this.pool = genericPool.createPool(factory, poolConfig);
	}
	public async getConnection(): Promise<Connection> {
		const rt: Connection = await this.pool.acquire();
		const that = this;
		(rt as any).__close = rt.close;
		rt.close = async function() {
			await that.pool.release(rt);
		}		
		return rt;
	}
	public async close(): Promise<void> {
		await this.pool.clear();
	}

}