import { redirect } from "next/navigation";

export default function NewConversationPage() {
  // If you need to clear or reset state here, do it before redirecting
  redirect("/");
  // Return null (or an empty fragment) because we'll never actually render this component
  return null;
}
