import VerifyForgotForm from "./VerifyForgotForm";

export default async function VerifyForgotPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const email = typeof sp.email === "string" ? sp.email : "";
  return <VerifyForgotForm email={email} />;
}
