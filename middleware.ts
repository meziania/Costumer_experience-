import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/admin/login" },
});

export const config = {
  matcher: ["/admin", "/admin/clients/:path*", "/admin/leads/:path*"],
};
