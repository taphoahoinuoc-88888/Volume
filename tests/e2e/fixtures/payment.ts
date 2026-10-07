import {test as base,expect,login,customer,control} from './auth';
import {paymentTools,startPaymentRuntime,type PaymentFixture} from '../../integration/fixtures/payment';
export const test=base.extend<{payment:PaymentFixture}>({payment:async({volume,reset},use)=>{void reset;const stop=await startPaymentRuntime(volume);try{await volume.login('admin1');const p=paymentTools(volume);await p.reset();await Promise.all(['user1','user2','managerA'].map(name=>volume.login(name)));await use(p);}finally{stop();}}});
export {expect,login,customer,control};
