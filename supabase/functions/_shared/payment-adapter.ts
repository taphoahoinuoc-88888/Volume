/** Server-only provider-neutral contract. No bank integration or simulated money. */
export interface Preparation {reference:string;amountVnd:string;qr:string}
export interface VerifiedReceipt {
 provider:string;recipient_scope:string;external_event_id:string;external_transaction_id:string|null;
 reference:string;kind:'CREDIT'|'REVERSAL_NOTICE'|'RECONCILIATION_NOTICE';amount_vnd:string|null;
 currency:'VND';provider_occurred_at:string;provider_callback_received_at:string;evidence_digest:string;
}
export interface PaymentAdapter {
 preparePayment(reference:string,amountVnd:string):Promise<Preparation>;
 /** Adapter verifies origin, recipient and finality before returning normalized data. */
 verifyEvent(raw:unknown,receivedAt:string):Promise<VerifiedReceipt>;
}
export class PaymentUnavailable extends Error {constructor(){super('PAYMENT_PROVIDER_NOT_CONFIGURED');}}
export const unconfiguredAdapter:PaymentAdapter={
 async preparePayment(){throw new PaymentUnavailable();},
 async verifyEvent(){throw new PaymentUnavailable();},
};
export function integerVnd(value:unknown,positive=true):string {
 if(typeof value!=='string'||!/^\d+$/.test(value))throw new Error('INVALID_AMOUNT');
 const n=BigInt(value);if(n>(2n**63n-1n)||n<(positive?1n:0n))throw new Error('INVALID_AMOUNT');
 return n.toString();
}
export function preparationRequest(reference:string,remaining:unknown):{reference:string;amountVnd:string}{
 if(!reference||reference.length>200)throw new Error('INVALID_REFERENCE');
 return {reference,amountVnd:integerVnd(remaining)};
}
export function validateVerifiedReceipt(value:VerifiedReceipt):VerifiedReceipt {
 if(value.currency!=='VND'||!['CREDIT','REVERSAL_NOTICE','RECONCILIATION_NOTICE'].includes(value.kind))throw new Error('INVALID_EVENT');
 for(const[field,max]of [['provider',64],['recipient_scope',128],['external_event_id',200],['reference',200],['evidence_digest',256]]as const)
  if(typeof value[field]!=='string'||!value[field].trim()||value[field].length>max)throw new Error('INVALID_EVENT');
 if(value.kind==='CREDIT'&&(!value.external_transaction_id||value.amount_vnd===null))throw new Error('INVALID_EVENT');
 if(value.external_transaction_id!==null&&(!value.external_transaction_id.trim()||value.external_transaction_id.length>200))throw new Error('INVALID_EVENT');
 if(value.amount_vnd!==null)integerVnd(value.amount_vnd);
 if(!Number.isFinite(Date.parse(value.provider_occurred_at))||!Number.isFinite(Date.parse(value.provider_callback_received_at)))throw new Error('INVALID_EVENT');
 return {...value};
}
/** Normalized adapter attestation, never a public callback or signature verifier.
 * The concrete provider adapter must establish these facts server-side first. */
export function validateFinalReceipt(value:VerifiedReceipt,expectedRecipient:string,final:boolean):VerifiedReceipt {
 if(!expectedRecipient||value.recipient_scope!==expectedRecipient||!final)throw new Error('UNVERIFIED_PAYMENT');
 return validateVerifiedReceipt(value);
}
