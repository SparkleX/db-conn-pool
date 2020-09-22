import { Driver, Connection, DataSource, Result } from "db-conn";
import { GenericPool, GenericPoolConfig } from "..";

const poolConfig: GenericPoolConfig = {
	min: 2,
    max: 2
}

const mockClose = jest.fn();
const mockExecute = jest.fn();

const mockConnect = jest.fn();
const driver = {
	connect: mockConnect
}

const oConnection = {
	close:mockClose,
	execute:mockExecute,
}
const oConnection2 = {
	close:mockClose,
	execute:mockExecute,
}
beforeEach(() => {
	mockConnect.mockClear();
	mockClose.mockClear();
	mockExecute.mockClear();
});

test("connection pool", async () => {
	
	mockConnect
	.mockResolvedValueOnce(oConnection)
	.mockResolvedValueOnce(oConnection2);
	const pool: DataSource = new GenericPool(driver, null, poolConfig);
	const conn1 = await pool.getConnection();
	expect((pool as any).pool._availableObjects.length).toStrictEqual(1);	
	const conn2 = await pool.getConnection();
	expect((pool as any).pool._availableObjects.length).toStrictEqual(0);
	await conn1.close();
	expect((pool as any).pool._availableObjects.length).toStrictEqual(1);
	await conn2.close();
	expect((pool as any).pool._availableObjects.length).toStrictEqual(2);
	expect(mockClose.mock.calls.length).toBe(0);
	await pool.close();
	expect(mockClose.mock.calls.length).toBe(2);
});


test("test on borrow without sql", async () => {
	poolConfig.testOnBorrow = true;
	try {
		const pool: DataSource = new GenericPool(driver, null, poolConfig);
		fail('should throw exception');
	} catch(err) {

	}
});

test("test on borrow sql", async () => {
	mockConnect.mockResolvedValueOnce(oConnection);
	poolConfig.testOnBorrow = true;
	poolConfig.testOnBorrowSql = "select 1";
	const pool: DataSource = new GenericPool(driver, null, poolConfig);	
	const conn = await pool.getConnection();
	expect(mockExecute.mock.calls).toMatchSnapshot("mock execute");
});

test("test on borrow fail", async () => {
	mockConnect.mockResolvedValue(oConnection);
	mockExecute
		.mockRejectedValueOnce(null)
		.mockReturnValueOnce(null);	
	poolConfig.testOnBorrow = true;
	poolConfig.testOnBorrowSql = "select xxx";
	const pool: DataSource = new GenericPool(driver, null, poolConfig);
	const conn = await pool.getConnection();
	expect(mockExecute.mock.calls).toMatchSnapshot("mock execute");
});