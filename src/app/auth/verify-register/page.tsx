import { Suspense } from "react";
import VerifyRegisterClient from "./VerifyRegisterClient";

export default function VerifyRegisterPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <VerifyRegisterClient />
    </Suspense>
  );
}
