import {describe,it,expect} from 'vitest';
import {money,remainingSeconds,initialSeconds,timer} from './table-payment';
describe('server-anchored initial timer/display only',()=>{
 const start='2026-10-06T12:00:00Z';
 it('T63 starts60:00 then59:59 without client price/time authority',()=>{expect(timer(initialSeconds(start,start))).toBe('60:00');expect(timer(initialSeconds(start,start,1))).toBe('59:59');});
 it('T61 reload elapsed server time never resets',()=>expect(initialSeconds(start,'2026-10-06T12:15:00Z')).toBe(2700));
 it('T62 stops initial countdown at0, no invented extension',()=>expect(initialSeconds(start,'2026-10-06T13:10:00Z')).toBe(0));
 it('T11 fixed hold deadline partial payment cannot extend',()=>expect(remainingSeconds('2026-10-06T12:05:00Z',start,120)).toBe(180));
 it('T60 renders integer money larger than JS safe integer exactly',()=>expect(money('9007199254740993')).toContain('9.007.199.254.740.993'));
});
