export type Role='ADMIN'|'CEO'|'MANAGER'|'STAFF'|'USER';
export type AccountStatus='ACTIVE'|'DISABLED';
export type MembershipStatus='ACTIVE'|'INACTIVE';
export type Version=string;
export interface Profile {id:string;display_name:string;role:Role;account_status:AccountStatus;version:Version}
export interface Membership {id:string;profile_id:string;venue_id:string;status:MembershipStatus;extra_permissions:string[];version:Version}
export interface Venue {id:string;code:string;name:string;timezone:string;public_address?:string|null;is_public?:boolean;is_enabled:boolean;version?:Version}
export interface Access {profile:Profile;permissions:string[];venues:Venue[];memberships:Membership[]}
export interface Account extends Profile {memberships:Membership[]}
export interface StaffRow {membership_id:string;profile_id?:string;id?:string;display_name:string;role:Role;venue_id:string;status:MembershipStatus;account_status?:AccountStatus;version:Version;profile_version:Version;extra_permissions?:string[]}
export interface AuditRow {id:string;action:string;category:'SECURITY'|'BUSINESS';created_at:string;reason:string;venue_id:string|null;before_data:Record<string,unknown>|null;after_data:Record<string,unknown>|null}
