import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Register from "@/pages/register";
import Login from "@/pages/login";
import TruckingDashboard from "@/pages/trucking-dashboard";
import ShippingDashboard from "@/pages/shipping-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import Chat from "@/pages/chat";
import Analytics from "@/pages/analytics";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import FAQ from "@/pages/faq";
import Resources from "@/pages/resources";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/faq" component={FAQ} />
      <Route path="/resources" component={Resources} />
      
      {/* Protected routes */}
      {user && (
        <>
          <Route path="/dashboard">
            {user.role === 'trucking_company' ? (
              <TruckingDashboard />
            ) : user.role === 'shipping_entity' ? (
              <ShippingDashboard />
            ) : (
              <AdminDashboard />
            )}
          </Route>
          <Route path="/chat/:jobId?" component={Chat} />
          <Route path="/analytics" component={Analytics} />
          {(user.role === 'super_admin' || user.role === 'customer_support') && (
            <>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin-dashboard" component={AdminDashboard} />
            </>
          )}
        </>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
