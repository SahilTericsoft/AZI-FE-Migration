import { redirect } from "next/navigation";

/** Entry point — send users into the app (the shell guard bounces to /login). */
export default function RootPage() {
  redirect("/dashboard");
}
