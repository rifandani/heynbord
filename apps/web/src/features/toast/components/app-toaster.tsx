import { Toaster } from "sonner";

import { toasterProps } from "@/features/toast/toast";

/** The app's one `Toaster`. Call sonner's `toast()` from anywhere to show one. */
export const AppToaster = () => <Toaster {...toasterProps} />;
