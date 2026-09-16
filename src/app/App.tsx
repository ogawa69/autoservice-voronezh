import { HomePage } from "@/pages/home";
import { AppProviders } from "./components/AppProviders/AppProviders";
import "./styles.css";

export default function App() {
  return (
    <AppProviders>
      <HomePage />
    </AppProviders>
  );
}
