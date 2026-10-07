import {describe,it,expect} from 'vitest';
import {cashAmount,durationLabel,settlementLabel,pendingCashKey} from './session-finance';
describe('Sprint3 safe input and presentation',()=>{
 for(const value of ['0','-1','1.2','1e3',' 1','9223372036854775808',''])it('S3-T13 rejects cash '+JSON.stringify(value),()=>expect(()=>cashAmount(value)).toThrow());
 it('S3-T08/T42 retains exact integer precision',()=>{expect(cashAmount('9223372036854775807')).toBe('9223372036854775807');expect(cashAmount('000100001')).toBe('100001');});
 it('S3-T41 displays duration without money or time authority',()=>{expect(durationLabel('0')).toBe('0 phút');expect(durationLabel('5400000000')).toBe('1 giờ 30 phút');expect(durationLabel('86400000000')).toBe('1 ngày 0 giờ 0 phút');});
 it('S3-T61 Vietnamese debt/anomaly labels remain distinct',()=>{expect(settlementLabel('UNPAID')).toBe('Chưa thanh toán');expect(settlementLabel('PARTIAL')).toBe('Còn thiếu');expect(settlementLabel('PAID')).toBe('Đã thanh toán');expect(settlementLabel('NEEDS_RESOLUTION')).toBe('Cần quản lý xử lý');});
 it('S3-T56 uncertain cash draft is scoped to actor and exact session',()=>{expect(pendingCashKey('a','x')).not.toBe(pendingCashKey('b','x'));expect(pendingCashKey('a','x')).not.toBe(pendingCashKey('a','y'));});
});
