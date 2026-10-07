import {test as base,expect,login,customer,control} from './payment';
import {financeTools,type FinanceFixture} from '../../integration/fixtures/session-finance';
export const test=base.extend<{finance:FinanceFixture}>({finance:async({payment},use)=>{for(const name of ['admin1','ceo','managerA','managerB','staffA','user1','user2'])await payment.login(name);await use(financeTools(payment));}});
export {expect,login,customer,control};
