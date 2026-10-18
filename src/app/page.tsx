import { redirect } from "next/navigation";

// Until the board exists, the home page just sends people to log in.
export default function Home() {
  redirect("/login");
}
