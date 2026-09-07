import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AdminAccess from "@/components/AdminAccess";
import Lab from "@/pages/Lab";
import Profile from "@/pages/Profile";
import Teams from "@/pages/Teams";
import Certifications from "@/pages/Certifications";
import TrabajaConNosotros from "@/pages/TrabajaConNosotros";
import Cursos from "@/pages/Cursos";
import CursoDetalle from "@/pages/CursoDetalle";
import Suscripcion from "@/pages/Suscripcion";
import Streaming from "@/pages/Streaming";
import Squads from "@/pages/Squads";
import Wallet from "@/pages/Wallet";
import TournamentRoom from "@/pages/TournamentRoom";
import Recursos from "@/pages/Recursos";
import Marketplace from "@/pages/Marketplace";
import Tutorias from "@/pages/Tutorias";
import BattleArena from "@/pages/BattleArena";
import Login from "@/pages/Login";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

import { AdminLayout } from "@/pages/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import Subscribers from "@/pages/admin/Subscribers";
import Courses from "@/pages/admin/Courses";
import Payments from "@/pages/admin/Payments";
import Machines from "@/pages/admin/Machines";
import AdminLabMachines from "@/pages/admin/AdminLabMachines";
import Alumnos from "@/pages/admin/Alumnos";
import Instructores from "@/pages/admin/Instructores";
import Affiliates from "@/pages/admin/Affiliates";
import Payouts from "@/pages/admin/Payouts";
import AdminMisiones from "@/pages/admin/AdminMisiones";
import AdminSquads from "@/pages/admin/AdminSquads";
import AdminTorneos from "@/pages/admin/AdminTorneos";

const queryClient = new QueryClient();

function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={Dashboard} />
        <Route path="/admin/subscribers" component={Subscribers} />
        <Route path="/admin/courses" component={Courses} />
        <Route path="/admin/payments" component={Payments} />
        <Route path="/admin/payouts" component={Payouts} />
        <Route path="/admin/machines" component={Machines} />
        <Route path="/admin/lab-machines" component={AdminLabMachines} />
        <Route path="/admin/alumnos" component={Alumnos} />
        <Route path="/admin/instructores" component={Instructores} />
        <Route path="/admin/affiliates" component={Affiliates} />
        <Route path="/admin/misiones" component={AdminMisiones} />
        <Route path="/admin/squads" component={AdminSquads} />
        <Route path="/admin/torneos" component={AdminTorneos} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/registro" component={Login} />
      <Route path="/lab" component={Lab} />
      <Route path="/perfil" component={Profile} />
      <Route path="/equipos" component={Teams} />
      <Route path="/certificaciones" component={Certifications} />
      <Route path="/trabaja" component={TrabajaConNosotros} />
      <Route path="/cursos" component={Cursos} />
      <Route path="/cursos/:id" component={CursoDetalle} />
      <Route path="/suscripcion" component={Suscripcion} />
      <Route path="/streaming" component={Streaming} />
      <Route path="/escuadras" component={Squads} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/torneo/:id" component={TournamentRoom} />
      <Route path="/recursos" component={Recursos} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/tutorias" component={Tutorias} />
      <Route path="/batalla/:id" component={BattleArena} />
      <Route path="/admin" component={AdminRouter} />
      <Route path="/admin/:rest*" component={AdminRouter} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
            <AdminAccess />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
