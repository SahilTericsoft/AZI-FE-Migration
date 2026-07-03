/**
 * Sidebar navigation structure — mirrors the live app's left panel
 * (CRM Operations, Order Management, …). Items with an `href` are implemented
 * and clickable; items without one are placeholders (shown disabled) so the
 * overall structure matches while we migrate domain-by-domain.
 */

import type { ElementType } from "react";

import {
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  FlaskConical,
  Folder,
  HelpCircle,
  LayoutDashboard,
  Lock,
  MapPin,
  Microscope,
  Network,
  Send,
  Settings,
  User,
  Users,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: ElementType;
  href?: string; // present = implemented/clickable
  /**
   * ACL feature code that gates this item (from `acl_seed.py`). When set, the
   * item is shown only if the logged-in user's grants include this code — the
   * single source of truth for both the sidebar and the route guard. Omit for
   * items everyone may see (e.g. Dashboard).
   */
  code?: string;
  children?: NavItem[];
}

export const NAV: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  {
    label: "CRM Operations",
    icon: Network,
    children: [
      { label: "Lab", icon: FlaskConical, href: "/lab", code: "labList" },
      { label: "Facility", icon: Building2, href: "/facility", code: "facilityList" },
      { label: "Location", icon: MapPin, href: "/location", code: "locationList" },
      { label: "Patient", icon: User, href: "/patient", code: "patientList" },
    ],
  },
  {
    label: "Order Management",
    icon: ClipboardList,
    children: [
      { label: "Test Order", icon: ClipboardList, href: "/test-order", code: "testOrderList" },
      { label: "Sample", icon: Microscope, href: "/sample", code: "sampleList" },
      { label: "Sendout", icon: Send, href: "/sendout", code: "sendoutsList" },
    ],
  },
  {
    label: "Lab Operations",
    icon: Microscope,
    children: [
      {
        label: "Test Configuration",
        icon: FlaskConical,
        href: "/test-configuration",
        code: "panelList",
      },
      { label: "Worklist", icon: ClipboardList, href: "/worklist" },
      { label: "Sample Processing", icon: Microscope, href: "/sample-processing" },
      { label: "Result", icon: FileText, href: "/result" },
      { label: "Instrument", icon: Microscope, href: "/instrument" },
      { label: "Inventory", icon: Boxes, href: "/inventory" },
    ],
  },
  { label: "System Settings", icon: Settings, href: "/system-settings" },
  {
    label: "User Management",
    icon: Users,
    href: "/user-management",
    code: "accessControlList",
  },
  {
    label: "Access Level",
    icon: Lock,
    href: "/access-control",
    code: "accessControlList",
  },
  { label: "Support Center", icon: HelpCircle, href: "/support-center" },
  { label: "Resources", icon: Folder, href: "/resources" },
];

const matchesPath = (pathname: string, href?: string) =>
  Boolean(href) && (pathname === href || pathname.startsWith(`${href}/`));

/** Resolve the header title for the current path. */
export function titleForPath(pathname: string): string {
  for (const item of NAV) {
    if (matchesPath(pathname, item.href)) return item.label;
    for (const child of item.children ?? []) {
      if (matchesPath(pathname, child.href)) return child.label;
    }
  }
  return "Dashboard";
}

/**
 * The ACL code gating the nav item that owns `pathname`, or undefined if the
 * route is ungated. The route guard uses this to decide access — same registry
 * the sidebar filters on, so visibility and access never drift apart.
 */
export function codeForPath(pathname: string): string | undefined {
  for (const item of NAV) {
    if (matchesPath(pathname, item.href)) return item.code;
    for (const child of item.children ?? []) {
      if (matchesPath(pathname, child.href)) return child.code;
    }
  }
  return undefined;
}
