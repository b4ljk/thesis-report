import { exampleRouter } from "~/server/api/routers/example";
import { createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "./routers/auth";
import { s3Router } from "./routers/s3";
import { secretKeyRoute } from "./routers/key";
import { signerRoute } from "./routers/signer";
import { otpRoute } from "./routers/otp";

export const appRouter = createTRPCRouter({
  auth_router: authRouter,
  s3_router: s3Router,
  key_router: secretKeyRoute,
  sign_router: signerRoute,
  otp_router: otpRoute,
});

export type AppRouter = typeof appRouter;
