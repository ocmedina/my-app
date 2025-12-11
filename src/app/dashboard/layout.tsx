import DashboardWrapper from "@/components/DashboardWrapper";
import { LayoutProvider } from "@/contexts/LayoutContext";
import LayoutSwitcher from "@/components/LayoutSwitcher";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutProvider>
      <DashboardWrapper>
        <LayoutSwitcher>{children}</LayoutSwitcher>
      </DashboardWrapper>
    </LayoutProvider>
  );
}

