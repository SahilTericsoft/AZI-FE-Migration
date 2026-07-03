/**
 * Service mount points on the backend monorepo (one prefix per migrated
 * service, exactly as defined by each `services/<name>/router.py`).
 *
 * The OLD frontend kept hundreds of fully-spelled endpoints in
 * `constants/APIConfig.tsx`. Here we keep only the per-service PREFIXES; each
 * feature module composes its own paths beneath its service (entities are
 * nested, e.g. `${SERVICE.facility}/facilities`, `.../facilities/{id}/toggle`).
 */

export const SERVICE = {
  userService: "/user-service",
  testConfig: "/test-config",
  lab: "/lab",
  labOs: "/lab-os",
  facility: "/facility",
  location: "/location",
  patient: "/patient", // PHI — requires auth
  testOrder: "/test-order", // PHI
  sample: "/sample", // PHI
  notification: "/notification",
  activityLog: "/activity-log",
  messaging: "/messaging",
  inventory: "/inventory",
  dynamicForm: "/dynamic-form",
  billing: "/billing",
  d2c: "/d2c", // PHI
  stateReporting: "/state-reporting", // PHI (whole router requires auth)
  sendout: "/sendout", // PHI (whole router requires auth)
  result: "/result", // PHI (whole router requires auth)
  integration: "/integration",
  support: "/support", // Support Center + Resources
} as const;

/** Sub-routers under the user service. */
export const USER_SERVICE = {
  auth: `${SERVICE.userService}/auth`,
  users: `${SERVICE.userService}/users`,
  accessControl: `${SERVICE.userService}/access-control`,
  staticData: `${SERVICE.userService}/static-data`,
} as const;

export type ServiceKey = keyof typeof SERVICE;
