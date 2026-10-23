import 'server-only';
export { authorize, can, AuthorizationError } from './policy.mjs';
// Never populate the actor from a submitted role/userId. Resolve a verified session
// and database memberships first. No authenticated endpoints exist at phase 0.
