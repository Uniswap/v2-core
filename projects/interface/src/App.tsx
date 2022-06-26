import { AppProvider } from "@/providers/app";
import { AppRoutes } from "@/routes/app";

function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

export default App;
