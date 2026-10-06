import {test as base,expect,login,customer,control} from './auth';
import {paymentTools,type PaymentFixture} from '../../integration/fixtures/payment';
export const test=base.extend<{payment:PaymentFixture}>({payment:async({volume,reset},use)=>{void reset;const p=paymentTools(volume);await p.reset();await use(p);}});
export {expect,login,customer,control};
