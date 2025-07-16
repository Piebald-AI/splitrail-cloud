import { Suspense } from "react";
import SignInForm from "@/components/auth/signin-form";

export default function SignInPage() {
  return (
    <>
      <div className="max-w-md mx-auto">
        <Suspense fallback={<div>Loading...</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </>
  );
}
